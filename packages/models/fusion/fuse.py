"""Capstone fusion: combine the tabular, graph, self-supervised-embedding and
anomaly signals into one calibrated risk score, then prioritise investigations
by expected value.

Pipeline
--------
1. Features  = point-in-time tabular + point-in-time graph + (as-of-cutoff) SSL
   account embeddings + unsupervised anomaly scores. Entity features are built
   from train-period history only, so they don't leak future structure into test.
2. Ablation  = tabular -> +graph -> +entity(GNN emb + anomaly), out-of-time.
3. Calibrate = isotonic regression fit on a held-out calibration window; report
   ECE / Brier before vs after so P(fraud) is trustworthy for EV decisions.
4. Cases     = expected-value (P x amount) ranking, deduplicated to entity-level
   cases — showing the alert-volume reduction vs raw per-transaction alerts.

Run: python -m packages.models.fusion.fuse --data data/generated/dev
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import average_precision_score, brier_score_loss

from packages.features.graph import GRAPH_FEATURES, build_graph_features
from packages.features.tabular import CATEGORICAL, FEATURES, build_features
from packages.models.tabular.trainer import recall_at_fpr

GRAPH_TYPOLOGIES = ["mule", "collusion", "layering", "synthetic_id"]


def build_fusion_frame(data_dir: str, cutoff, out_dir: str):
    data = Path(data_dir)
    txns = pd.read_parquet(data / "transactions.parquet")
    accounts = pd.read_parquet(data / "accounts.parquet")

    df = build_features(txns, accounts).merge(build_graph_features(txns), on="txn_id")

    # Point-in-time entity features (SSL embeddings + anomaly) are computed in a
    # separate process: torch and LightGBM each bundle an OpenMP runtime and
    # crash if imported into the same process on macOS.
    ent_path = Path(out_dir) / "_entity_features.parquet"
    ent_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            sys.executable,
            "-m",
            "packages.models.fusion.entity_features",
            "--data",
            data_dir,
            "--cutoff",
            pd.Timestamp(cutoff).isoformat(),
            "--out",
            str(ent_path),
        ],
        check=True,
    )
    ent = pd.read_parquet(ent_path)
    entity_cols = [c for c in ent.columns if c != "account_id"]

    df = df.merge(ent, left_on="src_account_id", right_on="account_id", how="left")
    df[entity_cols] = df[entity_cols].fillna(0.0)
    return df.sort_values("ts", kind="stable").reset_index(drop=True), entity_cols


def _fit(train, feats):
    cat = [c for c in CATEGORICAL if c in feats]
    pos_weight = float((train["is_fraud"] == 0).sum() / max((train["is_fraud"] == 1).sum(), 1))
    model = lgb.LGBMClassifier(
        objective="binary",
        n_estimators=400,
        learning_rate=0.05,
        num_leaves=48,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=pos_weight,
        random_state=7,
        n_jobs=-1,
        verbose=-1,
    )
    model.fit(train[feats], train["is_fraud"], categorical_feature=cat)
    return model


def _ece(y, p, bins=10):
    y, p = np.asarray(y), np.asarray(p)
    edges = np.linspace(0, 1, bins + 1)
    idx = np.clip(np.digitize(p, edges) - 1, 0, bins - 1)  # p==1.0 -> last bin
    e = 0.0
    for i in range(bins):
        m = idx == i
        if m.any():
            e += abs(p[m].mean() - y[m].mean()) * m.mean()
    return float(e)


def run(data_dir: str, out_dir: str = "evaluation") -> dict:
    txns_ts = pd.read_parquet(Path(data_dir) / "transactions.parquet")["ts"]
    q60, q70 = txns_ts.quantile(0.6), txns_ts.quantile(0.7)

    # Entity features are built as-of the train cutoff (q60), so they are strictly
    # in the past for every calibration/test row and never leak into training.
    df, entity_cols = build_fusion_frame(data_dir, cutoff=q60, out_dir=out_dir)
    train = df[df["ts"] <= q60]
    calib = df[(df["ts"] > q60) & (df["ts"] <= q70)]
    test = df[df["ts"] > q70]

    configs = {
        "tabular": FEATURES,
        "tabular+graph": FEATURES + GRAPH_FEATURES,
        "fusion(+emb+anomaly)": FEATURES + GRAPH_FEATURES + entity_cols,
    }
    ablation = {}
    for name, feats in configs.items():
        model = _fit(train, feats)
        s = model.predict_proba(test[feats])[:, 1]
        rec, thr = recall_at_fpr(test["is_fraud"].to_numpy(), s, 0.01)
        flagged = pd.Series(s >= thr, index=test.index)
        per = {
            typ: round(float(flagged[test["typology"] == typ].mean()), 3)
            for typ in GRAPH_TYPOLOGIES
            if (test["typology"] == typ).any()
        }
        ablation[name] = {
            "pr_auc": round(float(average_precision_score(test["is_fraud"], s)), 4),
            "recall_at_1pct_fpr": round(rec, 4),
            "per_typology_recall": per,
        }

    # Production scorer = the best leakage-free config (tabular + point-in-time
    # graph). Static entity embeddings don't help the per-transaction model (see
    # ablation); the GNN/SSL operate at the entity level instead.
    feats = FEATURES + GRAPH_FEATURES
    model = _fit(train, feats)
    s_cal = model.predict_proba(calib[feats])[:, 1]
    s_test = model.predict_proba(test[feats])[:, 1]
    iso = IsotonicRegression(out_of_bounds="clip").fit(s_cal, calib["is_fraud"])
    s_test_cal = iso.predict(s_test)
    yte = test["is_fraud"].to_numpy()
    calibration = {
        "ece_raw": round(_ece(yte, s_test), 4),
        "ece_calibrated": round(_ece(yte, s_test_cal), 4),
        "brier_raw": round(float(brier_score_loss(yte, s_test)), 4),
        "brier_calibrated": round(float(brier_score_loss(yte, s_test_cal)), 4),
    }

    # --- expected-value case prioritisation (entity-level dedup) ---
    t = test.copy()
    t["p"] = s_test_cal
    t["ev"] = t["p"] * t["amount"]
    _, thr = recall_at_fpr(yte, s_test_cal, 0.01)
    flagged = t[t["p"] >= thr]
    n_alerts = int(len(flagged))
    cases = (
        flagged.groupby("src_account_id")
        .agg(
            n_txn=("txn_id", "size"),
            ev=("ev", "sum"),
            max_p=("p", "max"),
            is_fraud=("is_fraud", "max"),
        )
        .sort_values("ev", ascending=False)
    )
    n_cases = int(len(cases))
    fraud_accounts = int(test.loc[test["is_fraud"] == 1, "src_account_id"].nunique())
    caught_accounts = int(cases.loc[cases["is_fraud"] == 1].shape[0])
    # cases are already EV-sorted; precision among the top cases an analyst would
    # work first is the payoff of expected-value prioritisation.
    topk = min(20, n_cases)
    prec_at_k = round(float(cases.head(topk)["is_fraud"].mean()), 3) if topk else 0.0
    case_mgmt = {
        "txn_alerts": n_alerts,
        "entity_cases": n_cases,
        "alert_volume_reduction": round(1 - n_cases / max(n_alerts, 1), 3),
        "case_precision": round(caught_accounts / max(n_cases, 1), 3),
        "precision_at_top20_ev": prec_at_k,
        "fraud_account_recall": round(caught_accounts / max(fraud_accounts, 1), 3),
    }

    metrics = {"ablation": ablation, "calibration": calibration, "case_management": case_mgmt}
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    (Path(out_dir) / "fusion_metrics.json").write_text(json.dumps(metrics, indent=2))
    return metrics


def _print(m: dict) -> None:
    print("=" * 64)
    print("AEGIS fusion — calibrated risk + EV case prioritisation (out-of-time)")
    print("=" * 64)
    print(f"{'config':24s} {'PR-AUC':>8s} {'Rec@1%FPR':>10s}")
    for name, r in m["ablation"].items():
        print(f"{name:24s} {r['pr_auc']:>8.4f} {r['recall_at_1pct_fpr']:>10.4f}")

    c = m["calibration"]
    print(
        f"\nCalibration (isotonic):  ECE {c['ece_raw']:.4f} -> {c['ece_calibrated']:.4f}"
        f"   Brier {c['brier_raw']:.4f} -> {c['brier_calibrated']:.4f}"
    )

    k = m["case_management"]
    print("\nCase prioritisation @ 1% FPR (production model = tabular + graph):")
    print(f"  per-transaction alerts : {k['txn_alerts']}")
    print(
        f"  entity-level cases     : {k['entity_cases']}  "
        f"(alert-volume reduction {k['alert_volume_reduction']:.0%})"
    )
    print(f"  precision @ top-20 EV  : {k['precision_at_top20_ev']:.2f}")
    print(f"  fraud-account recall   : {k['fraud_account_recall']:.2f}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="evaluation")
    args = p.parse_args()
    _print(run(args.data, args.out))

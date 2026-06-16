"""Tabular baseline: imbalance-aware LightGBM on point-in-time features,
evaluated with a leakage-free out-of-time split.

Run: python -m packages.models.tabular.baseline --data data/generated/dev
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, roc_auc_score, roc_curve

from packages.features.tabular import CATEGORICAL, FEATURES, build_features


def temporal_split(t: pd.DataFrame, train_frac: float = 0.7):
    cutoff = t["ts"].quantile(train_frac)
    train = t[t["ts"] <= cutoff]
    test = t[t["ts"] > cutoff]
    return train, test, cutoff


def recall_at_fpr(y_true: np.ndarray, scores: np.ndarray, target_fpr: float):
    fpr, tpr, thr = roc_curve(y_true, scores)
    i = int(np.searchsorted(fpr, target_fpr, side="right") - 1)
    i = max(i, 0)
    return float(tpr[i]), float(thr[i])


def train_baseline(data_dir: str, out_dir: str = "evaluation") -> dict:
    data = Path(data_dir)
    txns = pd.read_parquet(data / "transactions.parquet")
    accounts = pd.read_parquet(data / "accounts.parquet")

    feat = build_features(txns, accounts)
    train, test, cutoff = temporal_split(feat)

    Xtr, ytr = train[FEATURES], train["is_fraud"]
    Xte, yte = test[FEATURES], test["is_fraud"]
    pos_weight = float((ytr == 0).sum() / max((ytr == 1).sum(), 1))

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
    model.fit(Xtr, ytr, categorical_feature=CATEGORICAL)

    scores = model.predict_proba(Xte)[:, 1]
    pr_auc = float(average_precision_score(yte, scores))
    roc = float(roc_auc_score(yte, scores))
    rec1, thr1 = recall_at_fpr(yte.to_numpy(), scores, 0.01)

    # Per-typology recall at the 1%-FPR operating point (shows where tabular is
    # blind: graph-structured typologies like mule/synthetic/collusion).
    test_eval = test.copy()
    test_eval["score"] = scores
    flagged = test_eval["score"] >= thr1
    per_typ = {}
    for typ, grp in test_eval[test_eval["is_fraud"] == 1].groupby("typology"):
        per_typ[typ] = {"n": int(len(grp)), "recall": round(float(flagged[grp.index].mean()), 3)}

    importances = (
        pd.Series(model.feature_importances_, index=FEATURES).sort_values(ascending=False).head(8)
    )

    metrics = {
        "n_train": int(len(train)),
        "n_test": int(len(test)),
        "split_cutoff": str(cutoff),
        "test_fraud_rate": round(float(yte.mean()), 5),
        "pr_auc": round(pr_auc, 4),
        "roc_auc": round(roc, 4),
        "recall_at_1pct_fpr": round(rec1, 4),
        "per_typology_recall": per_typ,
        "top_features": {k: int(v) for k, v in importances.items()},
    }

    Path(out_dir).mkdir(parents=True, exist_ok=True)
    (Path(out_dir) / "baseline_metrics.json").write_text(json.dumps(metrics, indent=2))
    return metrics


def _print_report(m: dict) -> None:
    print("=" * 60)
    print("AEGIS tabular baseline — leakage-free out-of-time eval")
    print("=" * 60)
    print(
        f"train={m['n_train']:,}  test={m['n_test']:,}  test fraud rate={m['test_fraud_rate']:.3%}"
    )
    print(f"\nPR-AUC            {m['pr_auc']:.4f}   (headline metric for imbalance)")
    print(f"ROC-AUC           {m['roc_auc']:.4f}")
    print(f"Recall @ 1% FPR   {m['recall_at_1pct_fpr']:.4f}")
    print("\nPer-typology recall @ 1% FPR (tabular is blind to graph structure):")
    for typ, v in sorted(m["per_typology_recall"].items(), key=lambda kv: -kv[1]["recall"]):
        bar = "#" * int(v["recall"] * 30)
        print(f"  {typ:14s} n={v['n']:4d}  {v['recall']:.2f} {bar}")
    print("\nTop features:", ", ".join(m["top_features"]))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="evaluation")
    args = p.parse_args()
    _print_report(train_baseline(args.data, args.out))

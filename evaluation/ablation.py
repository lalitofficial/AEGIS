"""Ablation: does adding point-in-time graph features lift detection of the
graph-structured typologies the tabular model is blind to?

Run: python -m evaluation.ablation --data data/generated/dev
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from packages.features.graph import GRAPH_FEATURES, build_graph_features
from packages.features.tabular import CATEGORICAL, FEATURES, build_features
from packages.models.tabular.trainer import fit_eval, temporal_split

GRAPH_TYPOLOGIES = ["mule", "collusion", "layering", "synthetic_id"]


def run_ablation(data_dir: str, out_dir: str = "evaluation") -> dict:
    data = Path(data_dir)
    txns = pd.read_parquet(data / "transactions.parquet")
    accounts = pd.read_parquet(data / "accounts.parquet")

    df = build_features(txns, accounts).merge(build_graph_features(txns), on="txn_id")
    df = df.sort_values("ts", kind="stable").reset_index(drop=True)
    train, test, _ = temporal_split(df)

    configs = {"tabular": FEATURES, "tabular+graph": FEATURES + GRAPH_FEATURES}
    results = {}
    for name, feats in configs.items():
        r = fit_eval(train, test, feats, CATEGORICAL)
        results[name] = {
            k: r[k] for k in ("pr_auc", "roc_auc", "recall_at_1pct_fpr", "per_typology_recall")
        }

    out = {"configs": results}
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    (Path(out_dir) / "ablation_metrics.json").write_text(json.dumps(out, indent=2))
    return out


def _print(out: dict) -> None:
    r = out["configs"]
    print("=" * 66)
    print("AEGIS ablation — does graph structure help? (out-of-time)")
    print("=" * 66)
    print(f"{'config':16s} {'PR-AUC':>8s} {'ROC-AUC':>8s} {'Rec@1%FPR':>10s}")
    for name in ("tabular", "tabular+graph"):
        m = r[name]
        print(
            f"{name:16s} {m['pr_auc']:>8.4f} {m['roc_auc']:>8.4f} {m['recall_at_1pct_fpr']:>10.4f}"
        )

    print("\nPer-typology recall @ 1% FPR — graph-structured typologies:")
    print(f"{'typology':14s} {'tabular':>9s} {'+graph':>9s} {'Δ':>8s}")
    tab, grp = r["tabular"]["per_typology_recall"], r["tabular+graph"]["per_typology_recall"]
    for typ in GRAPH_TYPOLOGIES:
        a, b = tab.get(typ, 0.0), grp.get(typ, 0.0)
        print(f"{typ:14s} {a:>9.2f} {b:>9.2f} {b - a:>+8.2f}")
    d_pr = r["tabular+graph"]["pr_auc"] - r["tabular"]["pr_auc"]
    print(f"\nPR-AUC lift from graph features: {d_pr:+.4f}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="evaluation")
    args = p.parse_args()
    _print(run_ablation(args.data, args.out))

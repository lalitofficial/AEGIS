"""Tabular baseline: imbalance-aware LightGBM on point-in-time features,
evaluated with a leakage-free out-of-time split.

Run: python -m packages.models.tabular.baseline --data data/generated/dev
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from packages.features.tabular import CATEGORICAL, FEATURES, build_features
from packages.models.tabular.trainer import fit_eval, temporal_split


def train_baseline(data_dir: str, out_dir: str = "evaluation") -> dict:
    data = Path(data_dir)
    txns = pd.read_parquet(data / "transactions.parquet")
    accounts = pd.read_parquet(data / "accounts.parquet")

    feat = build_features(txns, accounts)
    train, test, cutoff = temporal_split(feat)
    res = fit_eval(train, test, FEATURES, CATEGORICAL)

    importances = (
        pd.Series(res["model"].feature_importances_, index=FEATURES)
        .sort_values(ascending=False)
        .head(8)
    )
    metrics = {
        "n_train": int(len(train)),
        "n_test": int(len(test)),
        "split_cutoff": str(cutoff),
        "test_fraud_rate": round(float(test["is_fraud"].mean()), 5),
        "pr_auc": res["pr_auc"],
        "roc_auc": res["roc_auc"],
        "recall_at_1pct_fpr": res["recall_at_1pct_fpr"],
        "per_typology_recall": res["per_typology_recall"],
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
    for typ, r in sorted(m["per_typology_recall"].items(), key=lambda kv: -kv[1]):
        print(f"  {typ:14s} {r:.2f} {'#' * int(r * 30)}")
    print("\nTop features:", ", ".join(m["top_features"]))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="evaluation")
    args = p.parse_args()
    _print_report(train_baseline(args.data, args.out))

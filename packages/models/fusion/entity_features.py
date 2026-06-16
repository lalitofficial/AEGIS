"""Precompute point-in-time entity features (SSL embeddings + anomaly scores)
as-of a cutoff timestamp, keyed by account_id.

Run as a separate process from the LightGBM fusion model: torch and LightGBM
each bundle an OpenMP runtime and crash if loaded into the same process (macOS).

Run: python -m packages.models.fusion.entity_features --data <dir> --cutoff <iso> --out <parquet>
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from packages.models.anomaly.detectors import score_accounts
from packages.models.graph.ssl import train_ssl


def compute(data_dir: str, cutoff, out_path: str) -> str:
    emb, _, nodes = train_ssl(data_dir, until_ts=cutoff)
    emb_cols = [f"emb_{i}" for i in range(emb.shape[1])]
    edf = pd.DataFrame(emb, columns=emb_cols)
    edf["account_id"] = nodes
    anom, _ = score_accounts(data_dir, until_ts=cutoff)
    ent = edf.merge(anom, on="account_id")
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    ent.to_parquet(out_path, index=False)
    return out_path


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    p.add_argument("--cutoff", required=True, help="ISO timestamp")
    p.add_argument("--out", required=True)
    args = p.parse_args()
    compute(args.data, pd.Timestamp(args.cutoff), args.out)

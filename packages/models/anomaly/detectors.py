"""Unsupervised anomaly detectors for novel / cold-start fraud.

Isolation Forest and a small autoencoder score every account on the same
structural features used by the GNN — with **no labels**. Useful where labelled
fraud is scarce (synthetic identities, never-seen patterns); the scores also feed
the fusion model as complementary signal.

Run: python -m packages.models.anomaly.detectors --data data/generated/dev
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from sklearn.ensemble import IsolationForest
from sklearn.metrics import average_precision_score, roc_auc_score
from torch import nn

from packages.models.graph.dataset import build_account_graph


class _AutoEncoder(nn.Module):
    def __init__(self, in_dim: int, hidden: int = 8, latent: int = 4):
        super().__init__()
        self.enc = nn.Sequential(nn.Linear(in_dim, hidden), nn.ReLU(), nn.Linear(hidden, latent))
        self.dec = nn.Sequential(nn.Linear(latent, hidden), nn.ReLU(), nn.Linear(hidden, in_dim))

    def forward(self, x):
        return self.dec(self.enc(x))


def _standardize(x: np.ndarray) -> np.ndarray:
    return (x - x.mean(axis=0)) / (x.std(axis=0) + 1e-6)


def _autoencoder_scores(x: np.ndarray, epochs: int = 200) -> np.ndarray:
    torch.manual_seed(7)
    xt = torch.tensor(x, dtype=torch.float32)
    model = _AutoEncoder(x.shape[1])
    opt = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=1e-5)
    for _ in range(epochs):
        model.train()
        opt.zero_grad()
        loss = nn.functional.mse_loss(model(xt), xt)
        loss.backward()
        opt.step()
    model.eval()
    with torch.no_grad():
        recon = model(xt)
        err = ((recon - xt) ** 2).mean(dim=1).numpy()
    return err


def score_accounts(data_dir: str):
    g = build_account_graph(data_dir)
    x = _standardize(g.x)

    iforest = IsolationForest(n_estimators=200, contamination="auto", random_state=7)
    iforest.fit(x)
    if_score = -iforest.score_samples(x)  # higher = more anomalous
    ae_score = _autoencoder_scores(x)

    scores = pd.DataFrame({"account_id": g.nodes, "iforest_score": if_score, "ae_score": ae_score})
    return scores, g.y


def evaluate(data_dir: str, out_dir: str = "evaluation") -> dict:
    scores, y = score_accounts(data_dir)
    metrics = {
        "base_rate": round(float(y.mean()), 4),
        "iforest": {
            "pr_auc": round(float(average_precision_score(y, scores["iforest_score"])), 4),
            "roc_auc": round(float(roc_auc_score(y, scores["iforest_score"])), 4),
        },
        "autoencoder": {
            "pr_auc": round(float(average_precision_score(y, scores["ae_score"])), 4),
            "roc_auc": round(float(roc_auc_score(y, scores["ae_score"])), 4),
        },
    }
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    (Path(out_dir) / "anomaly_metrics.json").write_text(json.dumps(metrics, indent=2))
    scores.to_parquet(Path(out_dir) / "anomaly_scores.parquet", index=False)
    return metrics


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="evaluation")
    args = p.parse_args()
    m = evaluate(args.data, args.out)
    print("Unsupervised anomaly detection (account-level, no labels)")
    print(f"  base fraud rate  {m['base_rate']:.3%}")
    for name in ("iforest", "autoencoder"):
        print(f"  {name:13s} PR-AUC {m[name]['pr_auc']:.4f}  ROC-AUC {m[name]['roc_auc']:.4f}")

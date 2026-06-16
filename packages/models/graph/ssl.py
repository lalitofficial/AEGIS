"""Self-supervised graph representation learning + few-shot detection.

A GraphSAGE encoder is trained with a **link-prediction** objective (no labels):
embeddings of connected accounts are pulled together, random pairs pushed apart —
metric learning over the entity graph. We then test few-shot detection: given a
handful of *known* criminal accounts, score every other account by embedding
similarity to that seed set. SSL embeddings should beat raw features, because
they encode relational position (who you transact / share devices with).

Run: python -m packages.models.graph.ssl --data data/generated/dev
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import average_precision_score
from torch import nn

from packages.models.graph.dataset import build_account_graph
from packages.models.graph.gnn import GraphSAGE


def _standardize(x: np.ndarray) -> np.ndarray:
    return (x - x.mean(axis=0)) / (x.std(axis=0) + 1e-6)


def train_ssl(data_dir: str, epochs: int = 250, batch: int = 2048, until_ts=None):
    torch.manual_seed(7)
    g = build_account_graph(data_dir, until_ts=until_ts)
    x = torch.tensor(_standardize(g.x))
    ei = torch.tensor(g.edge_index)
    n_nodes, n_edges = len(g.nodes), ei.shape[1]

    model = GraphSAGE(x.shape[1])  # encoder via .embed(); classification head unused
    opt = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=5e-4)
    bce = nn.functional.binary_cross_entropy_with_logits

    for _ in range(epochs):
        model.train()
        opt.zero_grad()
        z = model.embed(x, ei)
        pe = ei[:, torch.randint(0, n_edges, (batch,))]  # positive (real) edges
        ne = torch.randint(0, n_nodes, (2, batch))  # negative (random) pairs
        pos = (z[pe[0]] * z[pe[1]]).sum(1)
        neg = (z[ne[0]] * z[ne[1]]).sum(1)
        loss = bce(pos, torch.ones_like(pos)) + bce(neg, torch.zeros_like(neg))
        loss.backward()
        opt.step()

    model.eval()
    with torch.no_grad():
        emb = model.embed(x, ei).numpy()
    return emb, g.y, g.nodes


def fewshot_pr_auc(
    features: np.ndarray, y: np.ndarray, n_seed: int = 10, k: int = 5, seed: int = 7
) -> float:
    """Score nodes by mean cosine similarity to the k nearest of a small known-bad
    seed set; evaluate PR-AUC on the non-seed nodes."""
    rng = np.random.default_rng(seed)
    pos = np.where(y == 1)[0]
    seeds = rng.choice(pos, size=min(n_seed, len(pos)), replace=False)
    f = features / (np.linalg.norm(features, axis=1, keepdims=True) + 1e-9)
    sim = f @ f[seeds].T
    score = np.sort(sim, axis=1)[:, -k:].mean(axis=1)
    mask = np.ones(len(y), dtype=bool)
    mask[seeds] = False
    return float(average_precision_score(y[mask], score[mask]))


def run(data_dir: str, out_dir: str = "evaluation") -> dict:
    emb, y, nodes = train_ssl(data_dir)
    raw = _standardize(build_account_graph(data_dir).x)
    metrics = {
        "n_seed": 10,
        "fewshot_pr_auc_ssl_embeddings": round(fewshot_pr_auc(emb, y), 4),
        "fewshot_pr_auc_raw_features": round(fewshot_pr_auc(raw, y), 4),
        "base_rate": round(float(y.mean()), 4),
    }
    metrics["ssl_lift"] = round(
        metrics["fewshot_pr_auc_ssl_embeddings"] - metrics["fewshot_pr_auc_raw_features"], 4
    )
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    (Path(out_dir) / "ssl_metrics.json").write_text(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="evaluation")
    args = p.parse_args()
    m = run(args.data, args.out)
    print("Self-supervised embeddings + few-shot detection (10 known criminals)")
    print(f"  base rate                {m['base_rate']:.3%}")
    print(f"  raw-feature kNN  PR-AUC  {m['fewshot_pr_auc_raw_features']:.4f}")
    print(f"  SSL-embedding kNN PR-AUC {m['fewshot_pr_auc_ssl_embeddings']:.4f}")
    print(f"  SSL lift                 {m['ssl_lift']:+.4f}")

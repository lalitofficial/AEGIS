"""Train GraphSAGE vs an MLP control for criminal-account detection on the
entity graph, and export GNN node embeddings for downstream fusion.

Setup: full-graph (transductive) node classification with a stratified node
split; loss/eval are masked to train/test nodes. The MLP uses identical features
without message passing, so the GraphSAGE−MLP gap isolates the value of graph
structure. (Inductive / temporal node splits are a documented refinement.)

Run: python -m packages.models.graph.train --data data/generated/dev
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import average_precision_score, roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split

from packages.models.graph.dataset import build_account_graph
from packages.models.graph.gnn import MLP, GraphSAGE


def _standardize(x: np.ndarray, train_mask: np.ndarray) -> np.ndarray:
    mu = x[train_mask].mean(axis=0)
    sd = x[train_mask].std(axis=0) + 1e-6
    return (x - mu) / sd


def _recall_at_fpr(y, s, fpr_target=0.05):
    fpr, tpr, _ = roc_curve(y, s)
    i = max(int(np.searchsorted(fpr, fpr_target, side="right") - 1), 0)
    return float(tpr[i])


def _train_model(model, x, edge_index, y, train_mask, test_mask, epochs=300, lr=0.01):
    pos_w = float((y[train_mask] == 0).sum() / max((y[train_mask] == 1).sum(), 1))
    weight = torch.tensor([1.0, pos_w], dtype=torch.float32)
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=5e-4)
    ytr = torch.tensor(y)

    for _ in range(epochs):
        model.train()
        opt.zero_grad()
        out = model(x, edge_index)
        loss = torch.nn.functional.cross_entropy(out[train_mask], ytr[train_mask], weight=weight)
        loss.backward()
        opt.step()

    model.eval()
    with torch.no_grad():
        prob = torch.softmax(model(x, edge_index), dim=1)[:, 1].numpy()
    yte = y[test_mask]
    ste = prob[test_mask]
    return {
        "pr_auc": round(float(average_precision_score(yte, ste)), 4),
        "roc_auc": round(float(roc_auc_score(yte, ste)), 4),
        "recall_at_5pct_fpr": round(_recall_at_fpr(yte, ste), 4),
    }, prob


def run(data_dir: str, out_dir: str = "evaluation", epochs: int = 300) -> dict:
    torch.manual_seed(7)
    g = build_account_graph(data_dir)

    train_idx, test_idx = train_test_split(
        np.arange(len(g.y)), test_size=0.3, random_state=7, stratify=g.y
    )
    train_mask = np.zeros(len(g.y), dtype=bool)
    test_mask = np.zeros(len(g.y), dtype=bool)
    train_mask[train_idx] = True
    test_mask[test_idx] = True

    x = torch.tensor(_standardize(g.x, train_mask))
    edge_index = torch.tensor(g.edge_index)

    in_dim = x.shape[1]
    mlp_metrics, _ = _train_model(MLP(in_dim), x, edge_index, g.y, train_mask, test_mask, epochs)
    sage = GraphSAGE(in_dim)
    sage_metrics, prob = _train_model(sage, x, edge_index, g.y, train_mask, test_mask, epochs)

    # Export GNN embeddings for downstream fusion.
    sage.eval()
    with torch.no_grad():
        emb = sage.embed(x, edge_index).numpy()
    emb_df = pd.DataFrame(emb, columns=[f"gnn_{i}" for i in range(emb.shape[1])])
    emb_df.insert(0, "account_id", g.nodes)
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    emb_df.to_parquet(Path(out_dir) / "account_embeddings.parquet", index=False)

    metrics = {
        "n_nodes": len(g.nodes),
        "n_edges": int(g.edge_index.shape[1]),
        "n_criminal": int(g.y.sum()),
        "n_features": in_dim,
        "mlp": mlp_metrics,
        "graphsage": sage_metrics,
        "message_passing_lift_pr_auc": round(sage_metrics["pr_auc"] - mlp_metrics["pr_auc"], 4),
    }
    (Path(out_dir) / "gnn_metrics.json").write_text(json.dumps(metrics, indent=2))
    return metrics


def _print(m: dict) -> None:
    print("=" * 62)
    print("AEGIS GraphSAGE — criminal-account detection on the entity graph")
    print("=" * 62)
    print(
        f"nodes={m['n_nodes']:,}  edges={m['n_edges']:,}  "
        f"criminal={m['n_criminal']}  feats={m['n_features']}"
    )
    print(f"\n{'model':12s} {'PR-AUC':>8s} {'ROC-AUC':>8s} {'Rec@5%FPR':>10s}")
    for name in ("mlp", "graphsage"):
        r = m[name]
        print(
            f"{name:12s} {r['pr_auc']:>8.4f} {r['roc_auc']:>8.4f} {r['recall_at_5pct_fpr']:>10.4f}"
        )
    print(
        f"\nMessage-passing PR-AUC lift (GraphSAGE − MLP): {m['message_passing_lift_pr_auc']:+.4f}"
    )


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="evaluation")
    p.add_argument("--epochs", type=int, default=300)
    args = p.parse_args()
    _print(run(args.data, args.out, args.epochs))

"""Build the heterogeneous entity graph for node-level GNN learning.

Nodes are accounts. Edges combine two relations:
- money-flow: account -> account transfers (dense among collusion/layering rings)
- shared-identity: accounts that share a device or IP (synthetic-ID clusters)

The label is whether the account is *criminal* (a mule/recruited account, or one
owned by a synthetic identity). These typologies are **homophilous** on this
graph — criminals connect to criminals — which is exactly where message passing
beats a feature-matched MLP. Node features are per-account structural aggregates
that deliberately exclude cross-account sharing, leaving that to the graph.
"""

from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd

FEATURE_COLS = [
    "out_cnt",
    "out_amt",
    "n_dst",
    "in_cnt",
    "in_amt",
    "n_src",
    "n_txn",
    "mean_amt",
    "max_amt",
    "n_dev",
    "age_days",
    "flow_through",
]


@dataclass
class GraphData:
    x: np.ndarray
    edge_index: np.ndarray
    y: np.ndarray
    nodes: list[str]


def _account_features(txns: pd.DataFrame, accounts: pd.DataFrame, nodes: list[str]) -> pd.DataFrame:
    tr = txns[txns["dst_account_id"].notna()]
    out = tr.groupby("src_account_id").agg(
        out_cnt=("amount", "size"), out_amt=("amount", "sum"), n_dst=("dst_account_id", "nunique")
    )
    inn = tr.groupby("dst_account_id").agg(
        in_cnt=("amount", "size"), in_amt=("amount", "sum"), n_src=("src_account_id", "nunique")
    )
    allt = txns.groupby("src_account_id").agg(
        n_txn=("amount", "size"),
        mean_amt=("amount", "mean"),
        max_amt=("amount", "max"),
        n_dev=("device_id", "nunique"),
    )
    df = pd.DataFrame(index=pd.Index(nodes, name="account_id")).join(out).join(inn).join(allt)
    end = txns["ts"].max()
    age = accounts.set_index("account_id")["open_ts"].reindex(nodes)
    df["age_days"] = (end - age).dt.days.to_numpy()
    df = df.fillna(0.0)
    df["flow_through"] = df["out_amt"] / (df["in_amt"] + 1.0)
    for c in ["out_amt", "in_amt", "max_amt", "mean_amt"]:
        df[c] = np.log1p(df[c])
    df["age_days"] = df["age_days"].clip(lower=0)
    return df[FEATURE_COLS]


def _identity_edges(txns: pd.DataFrame, idx: dict[str, int], max_clique: int = 12) -> list:
    """Connect accounts that share a device or IP. Legit own-device usage yields
    singletons (no edge); shared identifiers are an organized-fraud signal."""
    edges = []
    for col in ("device_id", "ip_id"):
        groups = txns.dropna(subset=[col]).groupby(col)["src_account_id"].agg(lambda s: set(s))
        for accts in groups:
            accts = [idx[a] for a in accts if a in idx]
            if 2 <= len(accts) <= max_clique:
                edges.extend(combinations(accts, 2))
    return edges


def build_account_graph(data_dir: str, until_ts=None) -> GraphData:
    data = Path(data_dir)
    txns = pd.read_parquet(data / "transactions.parquet")
    accounts = pd.read_parquet(data / "accounts.parquet")
    customers = pd.read_parquet(data / "customers.parquet")

    # Point-in-time cutoff: build entity features/embeddings from history only,
    # so they can be used as features for later transactions without leakage.
    if until_ts is not None:
        txns = txns[txns["ts"] <= until_ts]

    tr = txns[txns["dst_account_id"].notna()]
    nodes = sorted(set(txns["src_account_id"]) | set(tr["dst_account_id"].dropna()))
    idx = {a: i for i, a in enumerate(nodes)}

    feats = _account_features(txns, accounts, nodes)

    # money-flow edges: keep only repeated or reciprocated transfers — one-off
    # random legit transfers are dropped so the graph isn't dominated by noise
    # that washes out criminal homophily under message passing.
    agg = tr.groupby(["src_account_id", "dst_account_id"]).size().reset_index(name="cnt")
    pair = agg[["src_account_id", "dst_account_id"]].to_numpy()
    pairset = set(map(tuple, pair))
    recip = np.array([(d, s) in pairset for s, d in pair])
    keep = agg[(agg["cnt"].to_numpy() >= 2) | recip]
    ks = keep["src_account_id"].map(idx).to_numpy()
    kd = keep["dst_account_id"].map(idx).to_numpy()
    flow = np.vstack([np.concatenate([ks, kd]), np.concatenate([kd, ks])])

    ident = np.array(_identity_edges(txns, idx), dtype=np.int64).T
    ident = np.hstack([ident, ident[::-1]]) if ident.size else ident.reshape(2, 0)
    edge_index = np.hstack([flow, ident]).astype(np.int64)

    # criminal = mule/recruited account OR owned by a synthetic identity
    synth_custs = set(customers.loc[customers["is_synthetic"], "customer_id"])
    acc = accounts.set_index("account_id")
    is_mule = acc["is_mule"].reindex(nodes).fillna(False).to_numpy()
    cust = acc["customer_id"].reindex(nodes)
    is_synth = cust.isin(synth_custs).to_numpy()
    y = (is_mule | is_synth).astype(int)

    return GraphData(x=feats.to_numpy(dtype=np.float32), edge_index=edge_index, y=y, nodes=nodes)

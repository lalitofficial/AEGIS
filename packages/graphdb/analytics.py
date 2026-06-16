"""Classical graph analytics for ring discovery (an investigative deliverable,
not a training feature — so it may use the full graph without leakage concerns).

Two complementary detectors on the account money-flow graph:
- strongly-connected components -> circular laundering (collusion, cyclic layering)
- Louvain communities -> dense clusters (mule consolidation hubs, collusion)

Recovery is scored against the simulator's ground-truth ring membership.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import networkx as nx
import pandas as pd


def build_money_flow_graph(txns: pd.DataFrame) -> nx.DiGraph:
    tr = txns.loc[txns["dst_account_id"].notna(), ["src_account_id", "dst_account_id", "amount"]]
    g = nx.DiGraph()
    for s, d, a in tr.itertuples(index=False):
        if g.has_edge(s, d):
            g[s][d]["weight"] += float(a)
            g[s][d]["count"] += 1
        else:
            g.add_edge(s, d, weight=float(a), count=1)
    return g


def _suspicious_subgraph(g: nx.DiGraph) -> nx.DiGraph:
    """Keep edges that repeat or are reciprocated — legit one-off transfers to
    random counterparties drop out, isolating colluding/cyclic structure."""
    h = nx.DiGraph()
    for u, v, d in g.edges(data=True):
        if d["count"] >= 2 or g.has_edge(v, u):
            h.add_edge(u, v)
    return h


def discover_rings(g: nx.DiGraph, min_size: int = 3) -> list[set]:
    """Weakly-connected components of the suspicious subgraph + dense Louvain
    communities of the full graph (bounded so the giant legit component is ignored)."""
    h = _suspicious_subgraph(g)
    comps = [set(c) for c in nx.weakly_connected_components(h) if len(c) >= min_size]
    communities = [
        set(c)
        for c in nx.community.louvain_communities(g.to_undirected(), weight="weight", seed=7)
        if min_size <= len(c) <= 40
    ]
    return comps + communities


def evaluate_recovery(
    ring_membership: pd.DataFrame, detected: list[set], ring_typology: dict[str, str]
) -> dict:
    truth: dict[str, set] = defaultdict(set)
    for a, r in ring_membership[["account_id", "ring_id"]].itertuples(index=False):
        truth[r].add(a)

    per_ring = []
    for r, accs in truth.items():
        # coverage = largest fraction of the ring captured in one detected group.
        coverage = max((len(accs & d) / len(accs) for d in detected), default=0.0)
        jaccard = max((len(accs & d) / len(accs | d) for d in detected), default=0.0)
        per_ring.append(
            {
                "typology": ring_typology.get(r, "?"),
                "size": len(accs),
                "coverage": coverage,
                "jaccard": jaccard,
            }
        )

    df = pd.DataFrame(per_ring)
    by_typ = {
        typ: {
            "n": int(len(grp)),
            "recovered": int(grp["coverage"].ge(0.5).sum()),
            "mean_coverage": round(float(grp["coverage"].mean()), 3),
        }
        for typ, grp in df.groupby("typology")
    }
    return {
        "n_rings": int(len(df)),
        "recovered_at_coverage_0.5": int(df["coverage"].ge(0.5).sum()),
        "recovery_rate": round(float(df["coverage"].ge(0.5).mean()), 3),
        "mean_coverage": round(float(df["coverage"].mean()), 3),
        "by_typology": by_typ,
        "n_detected_groups": len(detected),
    }


def run(data_dir: str, out_dir: str = "evaluation") -> dict:
    data = Path(data_dir)
    txns = pd.read_parquet(data / "transactions.parquet")
    ring_membership = pd.read_parquet(data / "ring_membership.parquet")
    ring_typology = (
        txns.loc[txns["ring_id"].notna()].groupby("ring_id")["typology"].first().to_dict()
    )

    g = build_money_flow_graph(txns)
    detected = discover_rings(g)
    metrics = {
        "graph_nodes": g.number_of_nodes(),
        "graph_edges": g.number_of_edges(),
        **evaluate_recovery(ring_membership, detected, ring_typology),
    }
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    (Path(out_dir) / "ring_discovery_metrics.json").write_text(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="evaluation")
    args = p.parse_args()
    m = run(args.data, args.out)
    print(f"money-flow graph: {m['graph_nodes']:,} nodes, {m['graph_edges']:,} edges")
    print(
        f"rings recovered @ coverage>=0.5: {m['recovered_at_coverage_0.5']}/{m['n_rings']} "
        f"({m['recovery_rate']:.0%})  mean coverage {m['mean_coverage']:.2f}"
    )
    for typ, s in m["by_typology"].items():
        print(f"  {typ:12s} {s['recovered']}/{s['n']} recovered  cov {s['mean_coverage']:.2f}")

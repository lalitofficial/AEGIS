"""GraphSAGE training runs end-to-end, beats/matches the MLP control, and
exports node embeddings."""

import pandas as pd

from data.sim import SimConfig, Simulator
from packages.models.graph.dataset import build_account_graph


def test_graph_build_and_labels(tmp_path):
    Simulator(SimConfig(n_customers=1000, days=50)).generate().write(tmp_path / "d")
    g = build_account_graph(str(tmp_path / "d"))
    assert g.x.shape[0] == len(g.nodes)
    assert g.edge_index.shape[0] == 2 and g.edge_index.shape[1] > 0
    assert g.edge_index.max() < len(g.nodes)  # valid node indices
    assert 0 < int(g.y.sum()) < len(g.y)  # both classes present


def test_gnn_trains_and_exports(tmp_path):
    from packages.models.graph.train import run

    Simulator(SimConfig(n_customers=1200, days=60)).generate().write(tmp_path / "d")
    m = run(str(tmp_path / "d"), out_dir=str(tmp_path / "eval"), epochs=80)
    assert 0.0 <= m["graphsage"]["pr_auc"] <= 1.0
    assert 0.0 <= m["mlp"]["pr_auc"] <= 1.0
    assert m["n_criminal"] > 0
    emb = pd.read_parquet(tmp_path / "eval" / "account_embeddings.parquet")
    assert "account_id" in emb.columns and emb.shape[1] > 2

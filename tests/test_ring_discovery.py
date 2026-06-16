"""Ring-discovery analytics run end-to-end and recover dense collusion rings."""

from data.sim import SimConfig, Simulator
from packages.graphdb.analytics import build_money_flow_graph, discover_rings, evaluate_recovery


def test_discovery_runs_and_recovers_collusion():
    out = Simulator(SimConfig(n_customers=1500, days=60)).generate()
    ring_typology = (
        out.transactions.loc[out.transactions["ring_id"].notna()]
        .groupby("ring_id")["typology"]
        .first()
        .to_dict()
    )
    g = build_money_flow_graph(out.transactions)
    detected = discover_rings(g)
    m = evaluate_recovery(out.ring_membership, detected, ring_typology)

    assert g.number_of_edges() > 0
    assert m["n_rings"] > 0
    assert 0.0 <= m["mean_coverage"] <= 1.0
    # Dense circular trading is recoverable by community detection.
    if "collusion" in m["by_typology"]:
        assert m["by_typology"]["collusion"]["mean_coverage"] > 0.3

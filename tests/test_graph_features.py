"""Point-in-time correctness and signal sanity for graph features."""

import numpy as np

from data.sim import SimConfig, Simulator
from packages.features.graph import GRAPH_FEATURES, build_graph_features


def _features():
    out = Simulator(SimConfig(n_customers=600, days=45)).generate()
    return out, build_graph_features(out.transactions)


def test_all_features_present_and_finite():
    _, gf = _features()
    assert set(GRAPH_FEATURES).issubset(gf.columns)
    assert np.isfinite(gf[GRAPH_FEATURES].to_numpy()).all()
    assert gf["txn_id"].is_unique


def test_cumulative_as_of_count_is_point_in_time():
    out, gf = _features()
    t = out.transactions.merge(gf, on="txn_id")
    # Each account's outgoing txns must receive unique incrementing as-of counts
    # 1..k (robust to same-timestamp ties), i.e. each counts only prior+current.
    for _, g in t.groupby("src_account_id"):
        counts = sorted(int(x) for x in g["g_out_cnt"])
        assert counts == list(range(1, len(counts) + 1))


def test_shared_device_signal_fires_for_synthetic():
    out, gf = _features()
    t = out.transactions.merge(gf, on="txn_id")
    synth = t[t["typology"] == "synthetic_id"]
    legit = t[t["is_fraud"] == 0]
    # Synthetic-ID clusters share a device across identities -> higher count.
    assert synth["g_device_shared_cust"].max() > legit["g_device_shared_cust"].median()

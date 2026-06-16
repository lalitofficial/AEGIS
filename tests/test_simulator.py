"""Smoke tests for the synthetic financial-crime simulator: determinism,
schema integrity, point-in-time ordering, and presence of labeled fraud."""

from data.sim import SimConfig, Simulator
from data.sim.schema import TXN_COLUMNS


def _run(**over):
    return Simulator(SimConfig(n_customers=300, days=30, **over)).generate()


def test_deterministic_given_seed():
    a, b = _run(), _run()
    assert a.manifest["n_transactions"] == b.manifest["n_transactions"]
    assert a.manifest["n_fraud"] == b.manifest["n_fraud"]


def test_schema_and_ordering():
    out = _run()
    t = out.transactions
    assert set(TXN_COLUMNS).issubset(t.columns)
    assert t["txn_id"].is_unique
    assert t["ts"].is_monotonic_increasing  # point-in-time stream
    assert t["src_account_id"].isna().sum() == 0


def test_fraud_labels_present():
    out = _run()
    assert out.manifest["n_fraud"] > 0
    assert 0.0 < out.transactions["is_fraud"].mean() < 0.1  # realistic imbalance
    assert out.accounts["is_mule"].sum() > 0
    assert out.customers["is_synthetic"].sum() > 0
    # every typology should fire at least once at this scale
    assert out.transactions.loc[out.transactions.is_fraud == 1, "typology"].nunique() >= 6

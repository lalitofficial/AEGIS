"""Labeled fraud-typology injectors.

Each injector appends transactions (and, where relevant, new mule/synthetic
entities) describing one organized-crime pattern. Signatures are designed so the
*graph* and *temporal* layers can recover structure that a per-row model cannot:
shared devices across mules, fan-in/fan-out money flow, sub-threshold
structuring, multi-hop layering chains, and dense collusion clusters.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from data.sim.config import SimConfig
from data.sim.entities import N_REGIONS, Entities


@dataclass
class Ctx:
    cfg: SimConfig
    rng: np.random.Generator
    ent: Entities
    start: pd.Timestamp
    end: pd.Timestamp
    new_customers: list = field(default_factory=list)
    new_accounts: list = field(default_factory=list)
    new_devices: list = field(default_factory=list)
    new_ips: list = field(default_factory=list)
    mule_ids: set = field(default_factory=set)
    synth_ids: set = field(default_factory=set)
    _eid: int = 90_000_000
    _ring: int = 0

    def _next(self) -> int:
        self._eid += 1
        return self._eid

    def ring_id(self) -> str:
        self._ring += 1
        return f"RING-{self._ring:05d}"

    def new_device(self) -> str:
        d = f"DEV-{self._next()}"
        self.new_devices.append(d)
        return d

    def new_ip(self) -> str:
        ip = f"IP-{self._next()}"
        self.new_ips.append(ip)
        return ip

    def new_account(self, customer_id, open_ts, is_mule=False, account_type="savings") -> str:
        a = f"ACC-{self._next()}"
        if is_mule:
            # Mules are recruited/aged ahead of the episode, so account age alone
            # cannot separate them from legit accounts — the coordination only
            # shows up in the graph (shared devices, fan-in/out money flow).
            open_ts = open_ts - pd.to_timedelta(int(self.rng.integers(15, 200)), unit="D")
        self.new_accounts.append(
            {
                "account_id": a,
                "customer_id": customer_id,
                "open_ts": open_ts,
                "account_type": account_type,
                "is_mule": is_mule,
            }
        )
        if is_mule:
            self.mule_ids.add(a)
        return a

    def new_synthetic_customer(self, signup_ts, region):
        c = f"CUST-{self._next()}"
        self.new_customers.append(
            {
                "customer_id": c,
                "signup_ts": signup_ts,
                "kyc_level": 1,
                "home_region": region,
                "is_synthetic": True,
            }
        )
        self.synth_ids.add(c)
        acc = self.new_account(c, signup_ts, account_type="wallet")
        return c, acc

    def rand_ts(self) -> pd.Timestamp:
        span = int((self.end - self.start).total_seconds())
        return self.start + pd.to_timedelta(int(self.rng.integers(0, span)), unit="s")

    def window(self, base: pd.Timestamp, span_s: int, k: int):
        offs = np.sort(self.rng.integers(0, max(span_s, 1), size=k))
        return [base + pd.to_timedelta(int(o), unit="s") for o in offs]

    def sample_customers(self, k: int):
        idx = self.rng.integers(0, self.cfg.n_customers, size=k)
        e = self.ent
        return (
            idx,
            e.customers["customer_id"].to_numpy()[idx],
            e.cust_account[idx],
            e.cust_card[idx],
        )

    def recruit_mules(self, k: int):
        """Recruit *existing* customers as mules (they keep their legit history and
        own devices), so their laundering transactions look individually normal and
        are only detectable from money-flow structure — not per-row features."""
        idx = self.rng.integers(0, self.cfg.n_customers, size=k)
        e = self.ent
        custs = e.customers["customer_id"].to_numpy()[idx]
        accs = e.cust_account[idx]
        for a in accs:
            self.mule_ids.add(a)
        return custs, accs, e.cust_device[idx], e.cust_ip[idx]

    def normal_amount(self, mu: float = 7.4, sigma: float = 0.6) -> float:
        return round(float(np.exp(self.rng.normal(mu, sigma))), 2)


def _mk(ts, typ, ring=None, **over) -> dict:
    row = {
        "ts": ts,
        "txn_type": "transfer",
        "channel": "upi",
        "src_customer_id": None,
        "src_account_id": None,
        "dst_account_id": None,
        "merchant_id": None,
        "card_id": None,
        "device_id": None,
        "ip_id": None,
        "amount": 0.0,
        "mcc": 0,
        "status": "approved",
        "is_fraud": 1,
        "typology": typ,
        "ring_id": ring,
    }
    row.update(over)
    return row


def card_testing(ctx: Ctx) -> list[dict]:
    """Many small, rapid card purchases from a new device; high decline rate."""
    rng = ctx.rng
    idx, cust, acc, card = ctx.sample_customers(1)
    dev, ip = ctx.new_device(), ctx.new_ip()
    base = ctx.rand_ts()
    k = int(rng.integers(8, 40))
    rows = []
    for ts in ctx.window(base, span_s=1800, k=k):
        rows.append(
            _mk(
                ts,
                "card_testing",
                txn_type="purchase",
                channel="card",
                src_customer_id=cust[0],
                src_account_id=acc[0],
                card_id=card[0],
                device_id=dev,
                ip_id=ip,
                merchant_id=ctx.ent.merchants["merchant_id"].iloc[
                    int(rng.integers(0, ctx.cfg.n_merchants))
                ],
                amount=round(float(rng.uniform(20, 250)), 2),
                mcc=5999,
                status="declined" if rng.random() < 0.45 else "approved",
            )
        )
    return rows


def stolen_card(ctx: Ctx) -> list[dict]:
    """A few high-value purchases from a new device/geo far from home."""
    rng = ctx.rng
    idx, cust, acc, card = ctx.sample_customers(1)
    dev, ip = ctx.new_device(), ctx.new_ip()
    base = ctx.rand_ts()
    rows = []
    for ts in ctx.window(base, span_s=86400, k=int(rng.integers(2, 6))):
        rows.append(
            _mk(
                ts,
                "stolen_card",
                txn_type="purchase",
                channel="card",
                src_customer_id=cust[0],
                src_account_id=acc[0],
                card_id=card[0],
                device_id=dev,
                ip_id=ip,
                merchant_id=ctx.ent.merchants["merchant_id"].iloc[
                    int(rng.integers(0, ctx.cfg.n_merchants))
                ],
                amount=round(float(rng.uniform(5_000, 60_000)), 2),
                mcc=5732,
            )
        )
    return rows


def ato(ctx: Ctx) -> list[dict]:
    """Account takeover: new device/geo then rapid drain to attacker accounts."""
    rng = ctx.rng
    idx, cust, acc, card = ctx.sample_customers(1)
    dev, ip = ctx.new_device(), ctx.new_ip()
    base = ctx.rand_ts()
    drain_to = ctx.new_account(f"CUST-{ctx._next()}", base, is_mule=True)
    rows = []
    for ts in ctx.window(base, span_s=7200, k=int(rng.integers(2, 6))):
        rows.append(
            _mk(
                ts,
                "ato",
                txn_type="transfer",
                channel="netbanking",
                src_customer_id=cust[0],
                src_account_id=acc[0],
                dst_account_id=drain_to,
                device_id=dev,
                ip_id=ip,
                amount=round(float(rng.uniform(8_000, 80_000)), 2),
            )
        )
    return rows


def mule_ring(ctx: Ctx) -> list[dict]:
    """Fan-in -> consolidation -> fan-out across recruited real accounts.

    Amounts and devices look individually normal; only the money-flow topology
    (many sources -> mules -> hub -> cash-out) reveals the ring.
    """
    rng = ctx.rng
    ring = ctx.ring_id()
    base = ctx.rand_ts()
    r = int(rng.integers(4, 10))
    m_cust, m_acc, m_dev, m_ip = ctx.recruit_mules(r)
    hub = 0
    rows = []

    # Fan-in: ordinary accounts pay into the mules (normal-looking transfers).
    idx_s, s_cust, s_acc, _ = ctx.sample_customers(int(rng.integers(6, 16)))
    s_dev, s_ip = ctx.ent.cust_device[idx_s], ctx.ent.cust_ip[idx_s]
    for i in range(len(s_acc)):
        ts = base + pd.Timedelta(hours=int(rng.integers(0, 72)))
        j = int(rng.integers(0, r))
        rows.append(
            _mk(
                ts,
                "mule",
                ring,
                txn_type="transfer",
                channel="upi",
                src_customer_id=s_cust[i],
                src_account_id=s_acc[i],
                dst_account_id=m_acc[j],
                device_id=s_dev[i],
                ip_id=s_ip[i],
                amount=ctx.normal_amount(),
            )
        )
    # Consolidation: mules -> hub.
    for i in range(1, r):
        ts = base + pd.Timedelta(hours=int(rng.integers(12, 96)))
        rows.append(
            _mk(
                ts,
                "mule",
                ring,
                txn_type="transfer",
                channel="upi",
                src_customer_id=m_cust[i],
                src_account_id=m_acc[i],
                dst_account_id=m_acc[hub],
                device_id=m_dev[i],
                ip_id=m_ip[i],
                amount=ctx.normal_amount(7.7, 0.5),
            )
        )
    # Fan-out: hub -> cash-out shell.
    cashout = ctx.new_account(f"CUST-{ctx._next()}", base, is_mule=True)
    for _ in range(int(rng.integers(2, 5))):
        ts = base + pd.Timedelta(hours=int(rng.integers(48, 120)))
        rows.append(
            _mk(
                ts,
                "mule",
                ring,
                txn_type="transfer",
                channel="netbanking",
                src_customer_id=m_cust[hub],
                src_account_id=m_acc[hub],
                dst_account_id=cashout,
                device_id=m_dev[hub],
                ip_id=m_ip[hub],
                amount=ctx.normal_amount(8.0, 0.5),
            )
        )
    return rows


def synthetic_cluster(ctx: Ctx) -> list[dict]:
    """Fabricated customers sharing a device/IP; thin clean history then bust-out."""
    rng = ctx.rng
    ring = ctx.ring_id()
    shared_dev, shared_ip = ctx.new_device(), ctx.new_ip()
    region = int(rng.integers(0, N_REGIONS))
    signup = ctx.start + pd.to_timedelta(int(rng.integers(0, ctx.cfg.days // 3)) * 86400, unit="s")
    s = int(rng.integers(3, 8))
    rows = []
    for _ in range(s):
        cust, acc = ctx.new_synthetic_customer(signup, region)
        # Thin, legit-looking history (label 0).
        for ts in ctx.window(signup, 30 * 86400, int(rng.integers(3, 7))):
            rows.append(
                _mk(
                    ts,
                    None,
                    txn_type="purchase",
                    channel="upi",
                    is_fraud=0,
                    src_customer_id=cust,
                    src_account_id=acc,
                    device_id=shared_dev,
                    ip_id=shared_ip,
                    merchant_id=ctx.ent.merchants["merchant_id"].iloc[
                        int(rng.integers(0, ctx.cfg.n_merchants))
                    ],
                    amount=round(float(rng.uniform(100, 1_500)), 2),
                    mcc=5411,
                )
            )
        # Bust-out (label 1). Amounts stay plausible; the giveaway is the shared
        # device/IP across many "distinct" identities (identity-graph signal).
        bust = signup + pd.Timedelta(days=int(rng.integers(20, 40)))
        for ts in ctx.window(bust, 2 * 86400, int(rng.integers(2, 5))):
            rows.append(
                _mk(
                    ts,
                    "synthetic_id",
                    ring,
                    txn_type="purchase",
                    channel="card",
                    src_customer_id=cust,
                    src_account_id=acc,
                    device_id=shared_dev,
                    ip_id=shared_ip,
                    amount=round(float(rng.uniform(3_000, 12_000)), 2),
                    mcc=5732,
                )
            )
    return rows


def structuring(ctx: Ctx) -> list[dict]:
    """Break a large sum into many sub-threshold transfers over a short period."""
    rng = ctx.rng
    idx, cust, acc, _ = ctx.sample_customers(1)
    dst = ctx.new_account(f"CUST-{ctx._next()}", ctx.start, is_mule=True)
    base = ctx.rand_ts()
    thr = ctx.cfg.structuring_threshold
    rows = []
    for ts in ctx.window(base, 5 * 86400, int(rng.integers(8, 20))):
        rows.append(
            _mk(
                ts,
                "structuring",
                txn_type="transfer",
                channel="netbanking",
                src_customer_id=cust[0],
                src_account_id=acc[0],
                dst_account_id=dst,
                ip_id=ctx.new_ip(),
                amount=round(float(rng.uniform(0.8 * thr, thr - 1)), 2),
            )
        )
    return rows


def layering_chain(ctx: Ctx) -> list[dict]:
    """Multi-hop money movement A->B->C... that may cycle back to obscure origin."""
    rng = ctx.rng
    ring = ctx.ring_id()
    base = ctx.rand_ts()
    L = int(rng.integers(3, 6))
    m_cust, chain, m_dev, m_ip = ctx.recruit_mules(L)
    amount = ctx.normal_amount(8.2, 0.4)
    rows = []
    ts = base
    for i in range(L - 1):
        ts = ts + pd.Timedelta(hours=int(rng.integers(2, 24)))
        amount = round(amount * rng.uniform(0.9, 0.98), 2)  # small skim each hop
        rows.append(
            _mk(
                ts,
                "layering",
                ring,
                src_customer_id=m_cust[i],
                src_account_id=chain[i],
                dst_account_id=chain[i + 1],
                channel="netbanking",
                device_id=m_dev[i],
                ip_id=m_ip[i],
                amount=amount,
            )
        )
    # Cycle back with probability 0.5.
    if rng.random() < 0.5:
        ts = ts + pd.Timedelta(hours=int(rng.integers(2, 24)))
        rows.append(
            _mk(
                ts,
                "layering",
                ring,
                src_customer_id=m_cust[-1],
                src_account_id=chain[-1],
                dst_account_id=chain[0],
                channel="netbanking",
                device_id=m_dev[-1],
                ip_id=m_ip[-1],
                amount=round(amount * 0.95, 2),
            )
        )
    return rows


def collusion_ring(ctx: Ctx) -> list[dict]:
    """A dense cluster of accounts trading among themselves (circular flow)."""
    rng = ctx.rng
    ring = ctx.ring_id()
    base = ctx.rand_ts()
    c = int(rng.integers(4, 8))
    m_cust, members, m_dev, m_ip = ctx.recruit_mules(c)
    rows = []
    for ts in ctx.window(base, 3 * 86400, int(rng.integers(10, 24))):
        i, j = int(rng.integers(0, c)), int(rng.integers(0, c))
        if i == j:
            continue
        rows.append(
            _mk(
                ts,
                "collusion",
                ring,
                txn_type="transfer",
                channel="upi",
                src_customer_id=m_cust[i],
                src_account_id=members[i],
                dst_account_id=members[j],
                device_id=m_dev[i],
                ip_id=m_ip[i],
                amount=ctx.normal_amount(),
            )
        )
    return rows


INJECTORS = {
    "card_testing": (card_testing, "n_card_episodes"),
    "stolen_card": (stolen_card, "n_card_episodes"),
    "ato": (ato, "n_ato_episodes"),
    "mule": (mule_ring, "n_mule_rings"),
    "synthetic_id": (synthetic_cluster, "n_synthetic_clusters"),
    "structuring": (structuring, "n_structuring_episodes"),
    "layering": (layering_chain, "n_layering_chains"),
    "collusion": (collusion_ring, "n_collusion_rings"),
}

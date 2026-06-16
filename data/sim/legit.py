from __future__ import annotations

import numpy as np
import pandas as pd

from data.sim.config import SimConfig
from data.sim.entities import Entities

# Diurnal weighting over 24 hours (low overnight, peaks midday and evening).
_HOUR_WEIGHTS = np.array(
    [
        0.2,
        0.1,
        0.1,
        0.1,
        0.1,
        0.2,
        0.5,
        1.0,
        1.5,
        1.7,
        1.8,
        1.9,
        2.0,
        1.8,
        1.6,
        1.6,
        1.7,
        1.9,
        2.0,
        1.8,
        1.4,
        1.0,
        0.6,
        0.3,
    ]
)
_HOUR_PMF = _HOUR_WEIGHTS / _HOUR_WEIGHTS.sum()


def generate_legit(cfg: SimConfig, rng: np.random.Generator, ent: Entities) -> pd.DataFrame:
    n = cfg.n_customers
    start = pd.Timestamp(cfg.start_ts)

    counts = rng.poisson(ent.cust_rate * cfg.days)
    counts = np.maximum(counts, 1)
    total = int(counts.sum())
    ci = np.repeat(np.arange(n), counts)  # source customer row index per txn

    # Timestamps with diurnal structure.
    day = rng.integers(0, cfg.days, size=total)
    hour = rng.choice(24, size=total, p=_HOUR_PMF)
    sec = rng.integers(0, 3600, size=total)
    ts = start + pd.to_timedelta(day * 86400 + hour * 3600 + sec, unit="s")

    amount = np.clip(np.exp(rng.normal(ent.cust_amt_mu[ci], ent.cust_amt_sigma[ci])), 1.0, None)
    amount = np.round(amount, 2)

    txn_type = rng.choice(
        ["purchase", "transfer", "withdrawal", "topup"], size=total, p=[0.72, 0.16, 0.08, 0.04]
    )

    # Channel per transaction type.
    channel = np.empty(total, dtype=object)
    for t, choices, probs in [
        ("purchase", ["card", "upi", "wallet"], [0.6, 0.35, 0.05]),
        ("transfer", ["upi", "netbanking"], [0.7, 0.3]),
        ("withdrawal", ["atm"], [1.0]),
        ("topup", ["upi", "netbanking"], [0.6, 0.4]),
    ]:
        mask = txn_type == t
        channel[mask] = rng.choice(choices, size=int(mask.sum()), p=probs)

    is_purchase = txn_type == "purchase"
    is_transfer = txn_type == "transfer"

    # Merchant for purchases: favourite with prob p_favorite_merchant, else random.
    merchant_ids = ent.merchants["merchant_id"].to_numpy()
    merchant_mcc = ent.merchants["mcc"].to_numpy()
    rand_m = rng.integers(0, len(merchant_ids), size=total)
    use_fav = rng.random(total) < cfg.p_favorite_merchant
    chosen_m = np.where(use_fav, ent.cust_fav_merchant_idx[ci], rand_m)
    merchant_id = np.where(is_purchase, merchant_ids[chosen_m], None)
    mcc = np.where(is_purchase, merchant_mcc[chosen_m], 0).astype("int64")

    # Destination account for transfers: a random other customer's account (a "contact").
    rand_acc = ent.cust_account[rng.integers(0, n, size=total)]
    dst_account_id = np.where(is_transfer, rand_acc, None)

    # Card present only on card-channel purchases.
    card_id = np.where(channel == "card", ent.cust_card[ci], None)

    # Device / IP: legit customers use their own device and IP. Cross-customer
    # device/IP sharing is therefore (almost) a pure organized-fraud signal that
    # the graph layer can exploit. (Household sharing is a future refinement.)
    device_id = ent.cust_device[ci]
    ip_id = ent.cust_ip[ci]

    status = np.where(rng.random(total) < cfg.p_decline_legit, "declined", "approved")

    return pd.DataFrame(
        {
            "ts": ts,
            "txn_type": txn_type,
            "channel": channel,
            "src_customer_id": ent.customers["customer_id"].to_numpy()[ci],
            "src_account_id": ent.cust_account[ci],
            "dst_account_id": dst_account_id,
            "merchant_id": merchant_id,
            "card_id": card_id,
            "device_id": device_id,
            "ip_id": ip_id,
            "amount": amount,
            "mcc": mcc.astype("int64"),
            "status": status,
            "is_fraud": 0,
            "typology": None,
            "ring_id": None,
        }
    )

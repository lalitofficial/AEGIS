from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from data.sim.config import SimConfig

N_REGIONS = 20


@dataclass
class Entities:
    """Generated entity tables plus per-customer behavioural arrays (numpy, by index)."""

    customers: pd.DataFrame
    accounts: pd.DataFrame
    cards: pd.DataFrame
    merchants: pd.DataFrame
    devices: pd.DataFrame
    ips: pd.DataFrame
    phones: pd.DataFrame
    emails: pd.DataFrame

    # behavioural lookups indexed by customer row position
    cust_rate: np.ndarray
    cust_amt_mu: np.ndarray
    cust_amt_sigma: np.ndarray
    cust_region: np.ndarray
    cust_account: np.ndarray  # primary account_id per customer
    cust_card: np.ndarray  # primary card_id per customer
    cust_device: np.ndarray
    cust_ip: np.ndarray
    cust_fav_merchant_idx: np.ndarray


def _ids(prefix: str, n: int, width: int = 8) -> np.ndarray:
    return np.array([f"{prefix}-{i:0{width}d}" for i in range(n)], dtype=object)


def generate_entities(cfg: SimConfig, rng: np.random.Generator) -> Entities:
    n = cfg.n_customers
    start = pd.Timestamp(cfg.start_ts)

    customer_id = _ids("CUST", n)
    # Sign-ups spread across the year preceding the simulation window.
    signup_offset = rng.integers(1, 365, size=n)
    signup_ts = start - pd.to_timedelta(signup_offset, unit="D")
    kyc_level = rng.choice([1, 2, 3], size=n, p=[0.2, 0.5, 0.3])
    region = rng.integers(0, N_REGIONS, size=n)

    # Behavioural parameters per customer.
    rate = rng.gamma(shape=2.0, scale=cfg.avg_txns_per_customer_per_day / 2.0, size=n)
    amt_mu = cfg.legit_amount_log_mu + rng.normal(0, 0.4, size=n)
    amt_sigma = np.clip(cfg.legit_amount_log_sigma + rng.normal(0, 0.2, size=n), 0.4, 2.0)

    customers = pd.DataFrame(
        {
            "customer_id": customer_id,
            "signup_ts": signup_ts,
            "kyc_level": kyc_level,
            "home_region": region,
            "is_synthetic": False,
        }
    )

    # One account + one card per customer (kept simple for the base population).
    account_id = _ids("ACC", n)
    accounts = pd.DataFrame(
        {
            "account_id": account_id,
            "customer_id": customer_id,
            "open_ts": signup_ts,
            "account_type": rng.choice(
                ["savings", "current", "wallet"], size=n, p=[0.6, 0.25, 0.15]
            ),
            "is_mule": False,
        }
    )

    card_id = _ids("CARD", n)
    cards = pd.DataFrame(
        {
            "card_id": card_id,
            "account_id": account_id,
            "issue_ts": signup_ts,
            "network": rng.choice(["visa", "mastercard", "rupay"], size=n, p=[0.4, 0.3, 0.3]),
        }
    )

    # Identifier pools: each customer owns one device / ip / phone / email.
    devices = pd.DataFrame({"device_id": _ids("DEV", n)})
    ips = pd.DataFrame({"ip_id": _ids("IP", n)})
    phones = pd.DataFrame({"phone_id": _ids("PHN", n)})
    emails = pd.DataFrame({"email_id": _ids("EML", n)})

    # Merchants with category codes and a high-risk minority.
    m = cfg.n_merchants
    mcc = rng.choice([5411, 5732, 5999, 6011, 7995, 4829, 5816], size=m)  # grocery..gambling..wire
    risk = np.where(np.isin(mcc, [7995, 4829, 5816]), "high", "normal")
    merchants = pd.DataFrame(
        {
            "merchant_id": _ids("MER", m, width=6),
            "mcc": mcc,
            "risk_level": risk,
            "region": rng.integers(0, N_REGIONS, size=m),
        }
    )

    fav_merchant = rng.integers(0, m, size=n)

    return Entities(
        customers=customers,
        accounts=accounts,
        cards=cards,
        merchants=merchants,
        devices=devices,
        ips=ips,
        phones=phones,
        emails=emails,
        cust_rate=rate,
        cust_amt_mu=amt_mu,
        cust_amt_sigma=amt_sigma,
        cust_region=region,
        cust_account=account_id,
        cust_card=card_id,
        cust_device=devices["device_id"].to_numpy(),
        cust_ip=ips["ip_id"].to_numpy(),
        cust_fav_merchant_idx=fav_merchant,
    )

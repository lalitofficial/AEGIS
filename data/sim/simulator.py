from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

from data.sim.config import SimConfig
from data.sim.entities import N_REGIONS, generate_entities
from data.sim.legit import generate_legit
from data.sim.typologies import INJECTORS, Ctx


@dataclass
class SimOutput:
    transactions: pd.DataFrame
    customers: pd.DataFrame
    accounts: pd.DataFrame
    cards: pd.DataFrame
    merchants: pd.DataFrame
    devices: pd.DataFrame
    ips: pd.DataFrame
    ring_membership: pd.DataFrame
    manifest: dict

    def write(self, out_dir: str | Path) -> Path:
        out = Path(out_dir)
        out.mkdir(parents=True, exist_ok=True)
        self.transactions.to_parquet(out / "transactions.parquet", index=False)
        self.customers.to_parquet(out / "customers.parquet", index=False)
        self.accounts.to_parquet(out / "accounts.parquet", index=False)
        self.cards.to_parquet(out / "cards.parquet", index=False)
        self.merchants.to_parquet(out / "merchants.parquet", index=False)
        self.devices.to_parquet(out / "devices.parquet", index=False)
        self.ips.to_parquet(out / "ips.parquet", index=False)
        self.ring_membership.to_parquet(out / "ring_membership.parquet", index=False)
        (out / "manifest.json").write_text(json.dumps(self.manifest, indent=2, default=str))
        return out


class Simulator:
    def __init__(self, cfg: SimConfig):
        self.cfg = cfg

    def generate(self) -> SimOutput:
        cfg = self.cfg
        rng = np.random.default_rng(cfg.seed)
        start = pd.Timestamp(cfg.start_ts)
        end = start + pd.Timedelta(days=cfg.days)

        ent = generate_entities(cfg, rng)
        legit = generate_legit(cfg, rng, ent)

        ctx = Ctx(cfg=cfg, rng=rng, ent=ent, start=start, end=end)
        fraud_rows: list[dict] = []
        typology_counts: dict[str, int] = {}
        for name, (fn, count_attr) in INJECTORS.items():
            n_episodes = getattr(cfg, count_attr)
            produced = 0
            for _ in range(n_episodes):
                rows = fn(ctx)
                fraud_rows.extend(rows)
                produced += sum(1 for r in rows if r["is_fraud"] == 1)
            typology_counts[name] = produced

        fraud = pd.DataFrame(fraud_rows, columns=legit.columns)

        # --- reconcile new entities created by injectors ---
        accounts = ent.accounts
        if ctx.new_accounts:
            accounts = pd.concat([accounts, pd.DataFrame(ctx.new_accounts)], ignore_index=True)
        customers = ent.customers
        if ctx.new_customers:
            customers = pd.concat([customers, pd.DataFrame(ctx.new_customers)], ignore_index=True)
        # Any account referencing a customer with no row gets a minimal shell record.
        missing = set(accounts["customer_id"]) - set(customers["customer_id"])
        if missing:
            shell = pd.DataFrame(
                {
                    "customer_id": list(missing),
                    "signup_ts": start,
                    "kyc_level": 1,
                    "home_region": rng.integers(0, N_REGIONS, size=len(missing)),
                    "is_synthetic": False,
                }
            )
            customers = pd.concat([customers, shell], ignore_index=True)

        devices = pd.concat(
            [ent.devices, pd.DataFrame({"device_id": ctx.new_devices})], ignore_index=True
        )
        ips = pd.concat([ent.ips, pd.DataFrame({"ip_id": ctx.new_ips})], ignore_index=True)

        # Apply entity-level fraud labels.
        accounts["is_mule"] = accounts["account_id"].isin(ctx.mule_ids)
        customers["is_synthetic"] = customers["customer_id"].isin(ctx.synth_ids)

        # --- assemble the time-ordered event stream ---
        txns = pd.concat([legit, fraud], ignore_index=True)
        txns = txns.sort_values("ts", kind="stable").reset_index(drop=True)
        txns.insert(0, "txn_id", [f"TXN-{i:09d}" for i in range(len(txns))])
        txns["is_fraud"] = txns["is_fraud"].astype("int8")
        txns["mcc"] = txns["mcc"].astype("int64")

        # Ground-truth ring membership (entity, ring) for graph evaluation later.
        rm = txns.loc[txns["ring_id"].notna(), ["src_account_id", "dst_account_id", "ring_id"]]
        members = (
            pd.concat(
                [
                    rm[["src_account_id", "ring_id"]].rename(
                        columns={"src_account_id": "account_id"}
                    ),
                    rm[["dst_account_id", "ring_id"]].rename(
                        columns={"dst_account_id": "account_id"}
                    ),
                ]
            )
            .dropna()
            .drop_duplicates()
            .reset_index(drop=True)
        )

        n_fraud = int(txns["is_fraud"].sum())
        manifest = {
            "config": cfg.__dict__,
            "n_transactions": int(len(txns)),
            "n_fraud": n_fraud,
            "fraud_rate": round(n_fraud / len(txns), 5),
            "typology_fraud_counts": typology_counts,
            "n_customers": int(len(customers)),
            "n_accounts": int(len(accounts)),
            "n_mule_accounts": int(accounts["is_mule"].sum()),
            "n_synthetic_customers": int(customers["is_synthetic"].sum()),
            "n_rings": int(txns["ring_id"].nunique()),
            "n_devices": int(len(devices)),
            "date_range": [str(txns["ts"].min()), str(txns["ts"].max())],
        }

        return SimOutput(
            transactions=txns,
            customers=customers,
            accounts=accounts,
            cards=ent.cards,
            merchants=ent.merchants,
            devices=devices,
            ips=ips,
            ring_membership=members,
            manifest=manifest,
        )

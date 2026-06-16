"""Point-in-time graph features computed *without* rebuilding a graph per row.

Every feature is a running, as-of-timestamp aggregate over the entity's prior
events, so there is no future leakage — yet each captures network structure the
per-row tabular features cannot:

- money-flow: running in/out degree, in/out amount, flow-through ratio
  (out/in) and distinct counterparties  -> mule / layering / collusion signal
- identity: distinct customers seen on this transaction's device to date, and
  distinct devices on this account  -> synthetic-identity / shared-device signal
"""

from __future__ import annotations

import numpy as np
import pandas as pd

GRAPH_FEATURES = [
    # lifetime (as-of) aggregates
    "g_out_cnt",
    "g_in_cnt",
    "g_out_amt",
    "g_in_amt",
    "g_flow_through",
    "g_distinct_cp",
    "g_device_shared_cust",
    "g_acct_distinct_devices",
    # windowed money-flow — the organized-crime *burst* signal (mule fan-in,
    # collusion churn): many transfers in a short window even if lifetime degree
    # looks normal because the account is a recruited real account.
    "g_in_cnt_24h",
    "g_in_cnt_7d",
    "g_out_cnt_7d",
    "g_in_amt_7d",
]


def build_graph_features(txns: pd.DataFrame) -> pd.DataFrame:
    t = txns.sort_values("ts", kind="stable").reset_index(drop=True)

    # --- identity-graph signals (running distinct counts via first-occurrence) ---
    # ~duplicated keeps the earliest (ts-ordered) occurrence of each pair True.
    fdc = (~t.duplicated(["device_id", "src_customer_id"])).astype("int64")
    g_device_shared = fdc.groupby(t["device_id"]).cumsum()
    fad = (~t.duplicated(["src_account_id", "device_id"])).astype("int64")
    g_acct_devices = fad.groupby(t["src_account_id"]).cumsum()

    # --- money-flow signals: long form so each account accrues both roles ---
    out = pd.DataFrame(
        {
            "oidx": t.index,
            "account": t["src_account_id"],
            "ts": t["ts"],
            "amt": t["amount"],
            "cp": t["dst_account_id"],
            "is_out": 1,
        }
    )
    has_dst = t["dst_account_id"].notna()
    inn = pd.DataFrame(
        {
            "oidx": t.index[has_dst],
            "account": t.loc[has_dst, "dst_account_id"],
            "ts": t.loc[has_dst, "ts"],
            "amt": t.loc[has_dst, "amount"],
            "cp": t.loc[has_dst, "src_account_id"],
            "is_out": 0,
        }
    )
    long = (
        pd.concat([out, inn], ignore_index=True)
        .sort_values(["account", "ts"], kind="stable")
        .reset_index(drop=True)
    )

    long["is_in"] = 1 - long["is_out"]
    long["out_amt"] = long["amt"] * long["is_out"]
    long["in_amt"] = long["amt"] * long["is_in"]
    # distinct counterparty: first time this account meets this cp (cp may be null)
    long["fcp"] = ((~long.duplicated(["account", "cp"])) & long["cp"].notna()).astype("int64")

    grp = long.groupby("account", sort=False)
    long["c_out_cnt"] = grp["is_out"].cumsum()
    long["c_in_cnt"] = grp["is_in"].cumsum()
    long["c_out_amt"] = grp["out_amt"].cumsum()
    long["c_in_amt"] = grp["in_amt"].cumsum()
    long["c_distinct_cp"] = grp["fcp"].cumsum()

    # Windowed (backward) rolling per account — scatter back by position.
    m = len(long)
    win = {k: np.zeros(m) for k in ["in_24h", "in_7d", "out_7d", "in_amt_7d"]}
    ts_l = long["ts"].to_numpy()
    isin_l, isout_l, inamt_l = (
        long["is_in"].to_numpy(),
        long["is_out"].to_numpy(),
        long["in_amt"].to_numpy(),
    )
    for idx in long.groupby("account", sort=False).indices.values():
        dti = pd.DatetimeIndex(ts_l[idx])
        s_in = pd.Series(isin_l[idx], index=dti)
        win["in_24h"][idx] = s_in.rolling("24h").sum().to_numpy()
        win["in_7d"][idx] = s_in.rolling("7d").sum().to_numpy()
        win["out_7d"][idx] = pd.Series(isout_l[idx], index=dti).rolling("7d").sum().to_numpy()
        win["in_amt_7d"][idx] = pd.Series(inamt_l[idx], index=dti).rolling("7d").sum().to_numpy()
    for k, v in win.items():
        long[f"w_{k}"] = v

    # One out-row exists per original transaction; it carries that account's
    # full as-of aggregates (both roles) up to and including this transaction.
    o = long[long["is_out"] == 1].set_index("oidx").reindex(t.index)

    feat = pd.DataFrame({"txn_id": t["txn_id"].to_numpy()})
    feat["g_out_cnt"] = o["c_out_cnt"].to_numpy()
    feat["g_in_cnt"] = o["c_in_cnt"].to_numpy()
    feat["g_out_amt"] = o["c_out_amt"].to_numpy()
    feat["g_in_amt"] = o["c_in_amt"].to_numpy()
    feat["g_flow_through"] = feat["g_out_amt"] / (feat["g_in_amt"] + 1.0)
    feat["g_distinct_cp"] = o["c_distinct_cp"].to_numpy()
    # device-less transfers carry no device-sharing signal -> 0
    feat["g_device_shared_cust"] = np.nan_to_num(g_device_shared.to_numpy(), nan=0.0)
    feat["g_acct_distinct_devices"] = g_acct_devices.to_numpy()
    feat["g_in_cnt_24h"] = o["w_in_24h"].to_numpy()
    feat["g_in_cnt_7d"] = o["w_in_7d"].to_numpy()
    feat["g_out_cnt_7d"] = o["w_out_7d"].to_numpy()
    feat["g_in_amt_7d"] = o["w_in_amt_7d"].to_numpy()
    return feat

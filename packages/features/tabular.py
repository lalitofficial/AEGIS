"""Point-in-time tabular features for the per-transaction fast path.

Every feature is **backward-looking only** — computed as-of each transaction's
timestamp from that entity's prior history — so train/serve are consistent and
there is no label or future leakage. The current transaction's authorization
``status`` is deliberately excluded (it is an outcome, unknown at scoring time);
only *past* decline counts are used.

By design this baseline sees only per-entity signal (velocity, amounts, recency).
Cross-entity structure (shared devices, fan-in/out money flow) is left to the
graph layer, so the ablation can show the marginal lift graph features add.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

HIGH_RISK_MCC = {7995, 4829, 5816}
CATEGORICAL = ["txn_type", "channel"]

FEATURES = [
    "log_amount",
    "hour",
    "dow",
    "is_night",
    "mcc",
    "is_high_risk_mcc",
    "account_age_days",
    "txn_type",
    "channel",
    "secs_since_last",
    "cnt_1h",
    "cnt_24h",
    "cnt_7d",
    "amt_sum_24h",
    "amt_mean_7d",
    "decl_cnt_7d",
    "amt_to_mean",
]


def build_features(txns: pd.DataFrame, accounts: pd.DataFrame) -> pd.DataFrame:
    t = txns.sort_values("ts", kind="stable").reset_index(drop=True).copy()
    t = t.merge(
        accounts[["account_id", "open_ts"]].rename(columns={"account_id": "src_account_id"}),
        on="src_account_id",
        how="left",
    )

    # --- static / current-transaction features (all known at score time) ---
    t["log_amount"] = np.log1p(t["amount"])
    t["hour"] = t["ts"].dt.hour
    t["dow"] = t["ts"].dt.dayofweek
    t["is_night"] = ((t["hour"] < 6) | (t["hour"] >= 23)).astype("int8")
    t["is_high_risk_mcc"] = t["mcc"].isin(HIGH_RISK_MCC).astype("int8")
    age = (t["ts"] - t["open_ts"]).dt.total_seconds() / 86400.0
    t["account_age_days"] = age.clip(lower=0).fillna(0.0)

    # --- backward-looking velocity per source account ---
    # t is sorted by ts with a clean RangeIndex, so each account's positional
    # indices are in ascending-time order; we compute time-window rolling stats
    # per account and scatter them back by position (no future leakage).
    t["secs_since_last"] = (
        t.groupby("src_account_id", sort=False)["ts"].diff().dt.total_seconds().fillna(1e7)
    )

    n = len(t)
    out = {
        k: np.empty(n)
        for k in [
            "cnt_1h",
            "cnt_24h",
            "amt_sum_24h",
            "cnt_7d",
            "amt_mean_7d",
            "decl_cnt_7d",
            "amt_to_mean",
        ]
    }
    ts_all = t["ts"].to_numpy()
    amt_all = t["amount"].to_numpy()
    decl_all = (t["status"] == "declined").astype("int64").to_numpy()

    for idx in t.groupby("src_account_id", sort=False).indices.values():
        dti = pd.DatetimeIndex(ts_all[idx])
        amt = pd.Series(amt_all[idx], index=dti)
        out["cnt_1h"][idx] = amt.rolling("1h").count().to_numpy()
        out["cnt_24h"][idx] = amt.rolling("24h").count().to_numpy()
        out["amt_sum_24h"][idx] = amt.rolling("24h").sum().to_numpy()
        out["cnt_7d"][idx] = amt.rolling("7d").count().to_numpy()
        out["amt_mean_7d"][idx] = amt.rolling("7d").mean().to_numpy()
        decl = pd.Series(decl_all[idx], index=dti)
        out["decl_cnt_7d"][idx] = (decl.rolling("7d").sum() - decl).clip(lower=0).to_numpy()
        past_mean = amt.shift().expanding().mean().to_numpy()
        ratio = np.divide(amt_all[idx], past_mean, out=np.ones_like(past_mean), where=past_mean > 0)
        out["amt_to_mean"][idx] = np.clip(np.nan_to_num(ratio, nan=1.0, posinf=1e4), 0, 1e4)

    for k, v in out.items():
        t[k] = v

    for c in CATEGORICAL:
        t[c] = t[c].astype("category")

    return t

"""Shared LightGBM fit/eval core used by the baseline and the ablation runner."""

from __future__ import annotations

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, roc_auc_score, roc_curve


def temporal_split(t: pd.DataFrame, train_frac: float = 0.7):
    cutoff = t["ts"].quantile(train_frac)
    return t[t["ts"] <= cutoff], t[t["ts"] > cutoff], cutoff


def recall_at_fpr(y_true: np.ndarray, scores: np.ndarray, target_fpr: float):
    fpr, tpr, thr = roc_curve(y_true, scores)
    i = max(int(np.searchsorted(fpr, target_fpr, side="right") - 1), 0)
    return float(tpr[i]), float(thr[i])


def fit_eval(train, test, features, categorical) -> dict:
    cat = [c for c in categorical if c in features]
    Xtr, ytr = train[features], train["is_fraud"]
    Xte, yte = test[features], test["is_fraud"]
    pos_weight = float((ytr == 0).sum() / max((ytr == 1).sum(), 1))

    model = lgb.LGBMClassifier(
        objective="binary",
        n_estimators=400,
        learning_rate=0.05,
        num_leaves=48,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=pos_weight,
        random_state=7,
        n_jobs=-1,
        verbose=-1,
    )
    model.fit(Xtr, ytr, categorical_feature=cat)

    scores = model.predict_proba(Xte)[:, 1]
    rec1, thr1 = recall_at_fpr(yte.to_numpy(), scores, 0.01)
    te = test.copy()
    te["_score"] = scores
    flagged = te["_score"] >= thr1
    per_typ = {
        typ: round(float(flagged[g.index].mean()), 3)
        for typ, g in te[te["is_fraud"] == 1].groupby("typology")
    }
    return {
        "pr_auc": round(float(average_precision_score(yte, scores)), 4),
        "roc_auc": round(float(roc_auc_score(yte, scores)), 4),
        "recall_at_1pct_fpr": round(rec1, 4),
        "per_typology_recall": per_typ,
        "model": model,
        "scores": scores,
        "threshold": thr1,
    }

"""Phase 11: calibration helper + end-to-end fusion / case-prioritisation run."""

import numpy as np

from data.sim import SimConfig, Simulator
from packages.models.fusion.fuse import _ece, run


def test_ece_reflects_calibration():
    y = np.array([0, 0, 1, 1] * 25)
    assert _ece(y, y.astype(float)) < 0.05  # perfectly calibrated
    assert _ece(y, 1.0 - y.astype(float)) > 0.5  # anti-calibrated


def test_fusion_pipeline_runs(tmp_path):
    Simulator(SimConfig(n_customers=1500, days=80)).generate().write(tmp_path / "d")
    m = run(str(tmp_path / "d"), out_dir=str(tmp_path / "eval"))

    assert {"tabular", "tabular+graph"} <= set(m["ablation"])
    cm = m["case_management"]
    assert cm["entity_cases"] <= cm["txn_alerts"]  # dedup never increases volume
    assert 0.0 <= cm["alert_volume_reduction"] <= 1.0
    # isotonic calibration should not worsen ECE materially
    assert m["calibration"]["ece_calibrated"] <= m["calibration"]["ece_raw"] + 0.02

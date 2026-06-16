"""Phase 10: unsupervised anomaly detection and self-supervised few-shot."""

from sklearn.metrics import average_precision_score

from data.sim import SimConfig, Simulator
from packages.models.anomaly.detectors import score_accounts
from packages.models.graph.ssl import fewshot_pr_auc, train_ssl


def test_anomaly_scores_beat_random(tmp_path):
    Simulator(SimConfig(n_customers=1000, days=50)).generate().write(tmp_path / "d")
    scores, y = score_accounts(str(tmp_path / "d"))
    assert len(scores) == len(y)
    # Isolation Forest, with no labels, should rank criminals above chance.
    assert average_precision_score(y, scores["iforest_score"]) > float(y.mean())


def test_ssl_fewshot_beats_base_rate(tmp_path):
    Simulator(SimConfig(n_customers=1200, days=60)).generate().write(tmp_path / "d")
    emb, y, nodes = train_ssl(str(tmp_path / "d"), epochs=120)
    assert emb.shape[0] == len(y)
    # Few-shot detection from 10 seeds should clear the base rate comfortably.
    assert fewshot_pr_auc(emb, y) > float(y.mean())

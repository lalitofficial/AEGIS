from app.ml_models.risk_scorer import RiskScorer

def test_risk_scorer_handles_string_account_age():
    scorer = RiskScorer()
    data = {
        "failed_logins": 1,
        "account_age": "45 days",
    }
    score = scorer.calculate_risk_score(data)
    assert 0 <= score <= 100

def test_risk_scorer_flags_new_account():
    scorer = RiskScorer()
    data = {
        "account_age": "10 days",
    }
    factors = scorer.identify_risk_factors(data)
    assert "New account" in factors

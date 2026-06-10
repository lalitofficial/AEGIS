from app.utils.helpers import generate_transaction_id
from tests.conftest import TEST_USER_EMAIL, TEST_USER_PASSWORD


def test_generate_transaction_id_format():
    txn_id = generate_transaction_id()
    assert txn_id.startswith("TXN-")
    assert len(txn_id) == 16


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_api_requires_api_key(client):
    response = client.get("/api/v1/fraud/alerts")
    assert response.status_code == 401


def test_api_rejects_wrong_api_key(client):
    response = client.get("/api/v1/fraud/alerts", headers={"X-API-Key": "wrong-key"})
    assert response.status_code == 401


def test_get_fraud_alerts(client, api_headers):
    response = client.get("/api/v1/fraud/alerts", headers=api_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_analyze_transaction(client, api_headers):
    payload = {
        "transaction_id": generate_transaction_id(),
        "customer_id": "CUST-TEST-001",
        "customer_name": "Test Customer",
        "amount": 25000.0,
        "merchant_id": "M-001",
        "payment_method": "credit_card",
        "new_device": True,
    }
    response = client.post("/api/v1/fraud/analyze", json=payload, headers=api_headers)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"is_fraud", "confidence", "risk_indicators", "alert_id"}
    assert isinstance(body["confidence"], float)


def test_dashboard_metrics(client, api_headers):
    response = client.get("/api/v1/dashboard/metrics", headers=api_headers)
    assert response.status_code == 200
    body = response.json()
    for key in ("fraudDetectionRate", "suspiciousTransactions", "confirmedFrauds"):
        assert key in body


def test_risk_distribution(client, api_headers):
    response = client.get("/api/v1/risk/distribution", headers=api_headers)
    assert response.status_code == 200
    assert set(response.json()) == {"critical", "high", "medium", "low"}


def test_monitored_accounts(client, api_headers):
    response = client.get("/api/v1/accounts/monitored", headers=api_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_compliance_frameworks(client, api_headers):
    response = client.get("/api/v1/compliance/frameworks", headers=api_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_graph_data(client, api_headers):
    response = client.get("/api/v1/graph/data", headers=api_headers)
    assert response.status_code == 200
    body = response.json()
    assert "nodes" in body and "edges" in body


def test_login_and_me(client, api_headers, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
        headers=api_headers,
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token

    me = client.get(
        "/api/v1/auth/me",
        headers={**api_headers, "Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == TEST_USER_EMAIL


def test_login_rejects_bad_password(client, api_headers, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_USER_EMAIL, "password": "not-the-password"},
        headers=api_headers,
    )
    assert response.status_code == 401

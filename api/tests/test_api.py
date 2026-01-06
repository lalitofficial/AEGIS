from app.utils.helpers import generate_transaction_id

def test_generate_transaction_id_format():
    txn_id = generate_transaction_id()
    assert txn_id.startswith("TXN-")
    assert len(txn_id) == 16

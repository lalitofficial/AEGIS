from app.database import SessionLocal, init_db
# IMPORT ALL MODELS HERE so SQLAlchemy knows about them
from app.models.fraud import FraudAlert, RiskProfile
from app.models.transaction import Transaction, Account 
from app.services.fraud_detection import FraudDetectionService
from app.services.risk_analysis import RiskAnalysisService
import random
from datetime import datetime, timedelta

def seed_database():
    print("🌱 Seeding database with fake data...")
    init_db()
    db = SessionLocal()

    # 1. Create some fake customers
    customers = [
        {"id": "CUST-001", "name": "Rahul Sharma", "age": 365},
        {"id": "CUST-002", "name": "Priya Patel", "age": 45},
        {"id": "CUST-003", "name": "Amit Kumar", "age": 1200},
        {"id": "CUST-004", "name": "John Doe", "age": 10}, 
    ]

    # 2. Generate transactions
    print("Generating transactions...")
    for i in range(20):
        customer = random.choice(customers)
        # 30% chance of being explicitly fraudulent
        is_fraud_simulation = random.random() < 0.3  
        
        amount = random.uniform(500, 5000)
        if is_fraud_simulation:
            amount = random.uniform(15000, 50000)

        # Create mock transaction data
        timestamp_obj = datetime.utcnow() - timedelta(hours=random.randint(0, 24))
        
        txn_data = {
            "transaction_id": f"TXN-{1000+i}",
            "customer_id": customer["id"],
            "customer_name": customer["name"],
            "amount": amount,
            "timestamp": timestamp_obj, # Keep as object for Transaction table
            "merchant_id": f"M-{random.randint(100, 999)}",
            "payment_method": "credit_card",
            "transaction_velocity": random.randint(1, 15) if is_fraud_simulation else random.randint(1, 3),
            "distance_from_home": random.randint(500, 2000) if is_fraud_simulation else random.randint(1, 50),
            "new_device": True if is_fraud_simulation else False,
            "fraud_type": "Credit Card Fraud" if is_fraud_simulation else None
        }
        
        # Save Transaction object First (SQLAlchemy handles datetime objects fine here)
        db_transaction = Transaction(
            transaction_id=txn_data["transaction_id"],
            customer_id=txn_data["customer_id"],
            amount=txn_data["amount"],
            payment_method=txn_data["payment_method"],
            merchant_id=txn_data["merchant_id"],
            timestamp=txn_data["timestamp"]
        )
        db.add(db_transaction)
        db.commit()

        # --- FIX IS HERE ---
        # Convert timestamp to string for JSON serialization in the Alert
        txn_data_for_json = txn_data.copy()
        txn_data_for_json['timestamp'] = txn_data['timestamp'].isoformat()

        # Analyze using the real service
        try:
            # We ignore the model's prediction for seeding purposes 
            is_fraud_detected, confidence, risks = FraudDetectionService.analyze_transaction(txn_data_for_json, db)
            
            # FORCE alert creation if we simulated it as fraud
            if is_fraud_simulation:
                print(f"  ⚠️ FORCING ALERT for {txn_data['transaction_id']}")
                FraudDetectionService.create_fraud_alert(
                    txn_data_for_json, # Use the JSON-safe version
                    True, # Force True
                    0.95, # High confidence
                    ['Simulated Fraud', 'High Value', 'Anomalous Pattern'], 
                    db
                )

            # Update risk profile
            RiskAnalysisService.calculate_customer_risk({
                "customer_id": customer["id"],
                "customer_name": customer["name"],
                "account_age": customer["age"],
                "transaction_velocity": txn_data["transaction_velocity"],
                "high_value_transaction": amount > 10000
            }, db)
            
        except Exception as e:
            print(f"  Error processing {txn_data['transaction_id']}: {e}")

    print("✅ Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
from app.database import SessionLocal, init_db
# IMPORT ALL MODELS HERE so SQLAlchemy knows about them
from app.models.fraud import FraudAlert, RiskProfile
from app.models.transaction import Transaction, Account 
from app.models.user import User
from app.models.compliance import ComplianceFramework, ComplianceActivity, DetectionPosture
from app.services.fraud_detection import FraudDetectionService
from app.services.risk_analysis import RiskAnalysisService
from app.utils.security import get_password_hash
import random
from datetime import datetime, timedelta
import os

def seed_database():
    print("🌱 Seeding database with fake data...")
    init_db()
    db = SessionLocal()

    admin_email = os.getenv("ADMIN_EMAIL", "admin@aegis.local")
    admin_password = os.getenv("ADMIN_PASSWORD", "change-me")
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        admin_user = User(
            email=admin_email,
            username="admin",
            full_name="AEGIS Admin",
            hashed_password=get_password_hash(admin_password),
            role="admin",
            is_superuser=True
        )
        db.add(admin_user)
        db.commit()

    # 1. Create some fake customers
    customers = [
        {"id": "CUST-001", "name": "Rahul Sharma", "age": 365},
        {"id": "CUST-002", "name": "Priya Patel", "age": 45},
        {"id": "CUST-003", "name": "Amit Kumar", "age": 1200},
        {"id": "CUST-004", "name": "John Doe", "age": 10}, 
    ]
    customer_last_txn = {}
    customer_txn_count = {customer["id"]: 0 for customer in customers}

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
        customer_last_txn[txn_data["customer_id"]] = txn_data["timestamp"]
        customer_txn_count[txn_data["customer_id"]] += 1

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

    if db.query(Account).count() == 0:
        account_types = ["checking", "savings", "credit_card", "business"]
        for customer in customers:
            for index in range(random.randint(1, 2)):
                account_type = random.choice(account_types)
                flagged_count = random.randint(0, 3)
                account = Account(
                    account_id=f"{customer['id']}-ACC-{index + 1}",
                    customer_id=customer["id"],
                    account_type=account_type,
                    balance=round(random.uniform(1000, 250000), 2),
                    status="active" if flagged_count == 0 else "review",
                    is_monitored=True,
                    last_transaction=customer_last_txn.get(customer["id"]),
                    transaction_count=customer_txn_count.get(customer["id"], 0),
                    flagged_count=flagged_count,
                )
                db.add(account)
        db.commit()

    if db.query(ComplianceFramework).count() == 0:
        frameworks = [
            ComplianceFramework(
                name="PCI DSS",
                score=92,
                status="Compliant",
                last_audit=datetime(2024, 11, 15).date(),
                description="Payment Card Industry Data Security Standard"
            ),
            ComplianceFramework(
                name="AML Compliance",
                score=88,
                status="Compliant",
                last_audit=datetime(2024, 10, 20).date(),
                description="Anti-Money Laundering"
            ),
            ComplianceFramework(
                name="KYC Requirements",
                score=95,
                status="Compliant",
                last_audit=datetime(2024, 11, 1).date(),
                description="Know Your Customer"
            ),
            ComplianceFramework(
                name="GDPR",
                score=90,
                status="Compliant",
                last_audit=datetime(2024, 10, 28).date(),
                description="General Data Protection Regulation"
            ),
            ComplianceFramework(
                name="SOX",
                score=85,
                status="Needs Review",
                last_audit=datetime(2024, 9, 10).date(),
                description="Sarbanes-Oxley Act"
            ),
        ]
        db.add_all(frameworks)
        db.commit()

    if db.query(ComplianceActivity).count() == 0:
        activities = [
            ComplianceActivity(
                activity="KYC Documentation Completed",
                description="All new customer verifications processed - Dec 1, 2024",
                status="completed",
                date=datetime(2024, 12, 1).date()
            ),
            ComplianceActivity(
                activity="AML Transaction Monitoring Active",
                description="Suspicious activity reports filed for Nov 2024",
                status="completed",
                date=datetime(2024, 11, 28).date()
            ),
            ComplianceActivity(
                activity="SOX Audit Review Required",
                description="Financial controls need quarterly assessment",
                status="pending",
                date=datetime(2024, 11, 20).date()
            ),
        ]
        db.add_all(activities)
        db.commit()

    if db.query(DetectionPosture).count() == 0:
        posture = [
            DetectionPosture(category="Card Fraud Detection", score=94),
            DetectionPosture(category="Account Takeover", score=88),
            DetectionPosture(category="Money Laundering", score=91),
            DetectionPosture(category="Payment Fraud", score=85),
            DetectionPosture(category="Identity Theft", score=92),
            DetectionPosture(category="Wire Fraud", score=87),
        ]
        db.add_all(posture)
        db.commit()

    db.close()

if __name__ == "__main__":
    seed_database()

from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from app.models.fraud import FraudAlert
from app.models.transaction import Transaction
from app.ml_models.fraud_detector import fraud_detector
from app.schemas.fraud import FraudAlertCreate
from app.utils.logger import logger
from datetime import datetime

class FraudDetectionService:
    """Service for fraud detection operations"""
    
    @staticmethod
    def analyze_transaction(transaction_data: Dict, db: Session) -> Tuple[bool, float, List[str]]:
        # Extract features
        features = fraud_detector.extract_features(transaction_data)
        
        # Predict fraud
        is_fraud, confidence = fraud_detector.predict(features)
        
        # Identify risk indicators
        risk_indicators = FraudDetectionService._identify_risk_indicators(
            transaction_data, features, confidence
        )
        
        logger.info(f"Transaction analyzed: fraud={is_fraud}, confidence={confidence:.2f}")
        return is_fraud, confidence, risk_indicators

    @staticmethod
    def _identify_risk_indicators(transaction_data: Dict, features: Dict, confidence: float) -> List[str]:
        indicators = []
        if features.get('new_device', 0) == 1: indicators.append('New device')
        if features.get('vpn_usage', 0) == 1: indicators.append('VPN usage')
        if features.get('amount', 0) > 10000: indicators.append('High-value transaction')
        return indicators

    @staticmethod
    def create_fraud_alert(transaction_data: Dict, is_fraud: bool, confidence: float, risk_indicators: List[str], db: Session) -> FraudAlert:
        risk_score = int(confidence * 100)
        
        if risk_score >= 90: status = "Blocked"
        elif risk_score >= 75: status = "Under Investigation"
        else: status = "Pending Review"

        transaction = db.query(Transaction).filter(
            Transaction.transaction_id == transaction_data['transaction_id']
        ).first()
        if not transaction:
            transaction = Transaction(
                transaction_id=transaction_data['transaction_id'],
                customer_id=transaction_data['customer_id'],
                amount=transaction_data['amount'],
                currency=transaction_data.get('currency', 'INR'),
                merchant_id=transaction_data.get('merchant_id', 'unknown'),
                merchant_category=transaction_data.get('merchant_category'),
                payment_method=transaction_data.get('payment_method', 'unknown'),
                ip_address=transaction_data.get('ip_address'),
                device_id=transaction_data.get('device_id'),
                location=transaction_data.get('location'),
                status=transaction_data.get('status', 'pending'),
                features=transaction_data.get('features'),
                fraud_probability=confidence
            )
            db.add(transaction)
            db.flush()
        else:
            transaction.fraud_probability = confidence
            
        fraud_alert_data = FraudAlertCreate(
            transaction_id=transaction_data['transaction_id'],
            type=transaction_data.get('fraud_type', 'Unknown Fraud'),
            amount=transaction_data['amount'],
            customer_name=transaction_data.get('customer_name', 'Unknown'),
            customer_id=transaction_data['customer_id'],
            risk_score=risk_score,
            indicators=risk_indicators,
            status=status,
            ml_confidence=confidence,
            # RENAMED to matches model
            meta_data=transaction_data
        )
        
        fraud_alert = FraudAlert(**fraud_alert_data.dict())
        db.add(fraud_alert)
        db.commit()
        db.refresh(fraud_alert)
        
        return fraud_alert

    @staticmethod
    def get_recent_alerts(db: Session, limit: int = 10) -> List[FraudAlert]:
        return db.query(FraudAlert).order_by(FraudAlert.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_alert_by_id(alert_id: int, db: Session) -> FraudAlert:
        return db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()

    @staticmethod
    def update_alert_status(alert_id: int, status: str, db: Session) -> FraudAlert:
        alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
        if alert:
            alert.status = status
            alert.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(alert)
        return alert

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.fraud import FraudAlert, RiskProfile
from app.models.transaction import Transaction, Account
from app.models.compliance import DetectionPosture
from datetime import datetime, timedelta
from app.utils.logger import logger
from app.utils.cache import get_cached, set_cached

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def _map_fraud_type(fraud_type: str) -> str:
    if not fraud_type:
        return "cardFraud"
    normalized = fraud_type.lower()
    if "account" in normalized or "takeover" in normalized or "ato" in normalized:
        return "accountTakeover"
    if "identity" in normalized or "id theft" in normalized:
        return "identityTheft"
    if "payment" in normalized or "wire" in normalized or "refund" in normalized or "chargeback" in normalized:
        return "paymentFraud"
    if "card" in normalized or "credit" in normalized or "debit" in normalized:
        return "cardFraud"
    return "cardFraud"

@router.get("/metrics")
async def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Get dashboard metrics"""
    try:
        cached = get_cached("dashboard_metrics")
        if cached:
            return cached

        # Calculate metrics
        total_transactions = db.query(Transaction).count()
        suspicious_transactions = db.query(FraudAlert)\
            .filter(FraudAlert.status.in_(['Blocked', 'Under Investigation']))\
            .count()
        confirmed_frauds = db.query(FraudAlert)\
            .filter(FraudAlert.status == 'Blocked')\
            .count()
            
        # Calculate fraud detection rate
        fraud_detection_rate = (confirmed_frauds / total_transactions * 100) if total_transactions > 0 else 0
        
        false_positive_rate = 0.0
        if suspicious_transactions > 0:
            false_positive_rate = round(
                ((suspicious_transactions - confirmed_frauds) / suspicious_transactions) * 100, 1
            )
        
        metrics = {
            "fraudDetectionRate": round(fraud_detection_rate, 1),
            "suspiciousTransactions": suspicious_transactions,
            "confirmedFrauds": confirmed_frauds,
            "falsePositiveRate": false_positive_rate
        }
        set_cached("dashboard_metrics", metrics)
        return metrics
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard metrics"
        )

@router.get("/fraud-trends")
async def get_fraud_trends(db: Session = Depends(get_db)):
    """Get fraud trends for the last 24 hours"""
    try:
        cached = get_cached("fraud_trends")
        if cached:
            return cached

        now = datetime.utcnow()
        time_ranges = []
        
        for i in range(7):
            start_time = now - timedelta(hours=(7-i)*4)
            end_time = now - timedelta(hours=(6-i)*4)
            
            alerts = db.query(FraudAlert)\
                .filter(FraudAlert.created_at >= start_time)\
                .filter(FraudAlert.created_at < end_time)\
                .all()

            fraud_count = len(alerts)
            blocked_count = sum(1 for alert in alerts if alert.status == 'Blocked')
            type_counts = {
                "cardFraud": 0,
                "accountTakeover": 0,
                "identityTheft": 0,
                "paymentFraud": 0
            }
            for alert in alerts:
                category = _map_fraud_type(alert.type)
                type_counts[category] += 1
                
            time_label = f"{start_time.strftime('%H:00')}"
            
            time_ranges.append({
                "time": time_label,
                "total": fraud_count,
                "blocked": blocked_count,
                "cardFraud": type_counts["cardFraud"],
                "accountTakeover": type_counts["accountTakeover"],
                "identityTheft": type_counts["identityTheft"],
                "paymentFraud": type_counts["paymentFraud"]
            })
            
        set_cached("fraud_trends", time_ranges)
        return time_ranges
    except Exception as e:
        logger.error(f"Error fetching fraud trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch fraud trends"
        )

@router.get("/fraud-type-distribution")
async def get_fraud_type_distribution(db: Session = Depends(get_db)):
    """Get fraud type distribution"""
    try:
        cached = get_cached("fraud_distribution")
        if cached:
            return cached

        # Query fraud alerts grouped by type
        fraud_types = db.query(
            FraudAlert.type,
            func.count(FraudAlert.id).label('count')
        ).group_by(FraudAlert.type).all()
        
        total = sum([ft.count for ft in fraud_types])
        
        distribution = []
        colors = {
            'Card Testing': '#ef4444',
            'Account Takeover': '#f97316',
            'Friendly Fraud': '#eab308',
            'Identity Theft': '#8b5cf6',
            'Payment Fraud': '#06b6d4'
        }
        
        for fraud_type in fraud_types:
            percentage = (fraud_type.count / total * 100) if total > 0 else 0
            distribution.append({
                "type": fraud_type.type,
                "count": fraud_type.count,
                "percentage": round(percentage, 1),
                "color": colors.get(fraud_type.type, '#64748b')
            })
            
        set_cached("fraud_distribution", distribution)
        return distribution
    except Exception as e:
        logger.error(f"Error fetching fraud type distribution: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch fraud type distribution"
        )

@router.get("/detection-posture")
async def get_detection_posture(db: Session = Depends(get_db)):
    """Get fraud detection capabilities posture"""
    cached = get_cached("detection_posture")
    if cached:
        return cached

    posture = db.query(DetectionPosture).order_by(DetectionPosture.score.desc()).all()
    result = [{"category": row.category, "score": row.score} for row in posture]
    set_cached("detection_posture", result)
    return result

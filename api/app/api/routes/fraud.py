from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.fraud import FraudAlertResponse, FraudAlertCreate, FraudAnalysisRequest, FraudAlertStatus
from app.services.fraud_detection import FraudDetectionService
from app.utils.logger import logger
from app.utils.security import require_roles
from app.models.audit import AuditLog
from app.models.user import User

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])

@router.get("/alerts", response_model=List[FraudAlertResponse])
async def get_fraud_alerts(
    limit: int = 50,
    db: Session = Depends(get_db)):
    """Get recent fraud alerts"""
    try:
        alerts = FraudDetectionService.get_recent_alerts(db, limit=limit)
        return alerts
    except Exception as e:
        logger.error(f"Error fetching fraud alerts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch fraud alerts"
        )

@router.get("/alerts/{alert_id}", response_model=FraudAlertResponse)
async def get_fraud_alert(
    alert_id: int,
    db: Session = Depends(get_db)):
    """Get specific fraud alert"""
    alert = FraudDetectionService.get_alert_by_id(alert_id, db)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found"
        )
    return alert

@router.post("/analyze", response_model=dict)
async def analyze_transaction(
    transaction_data: FraudAnalysisRequest,
    db: Session = Depends(get_db)):
    """Analyze a transaction for fraud"""
    try:
        transaction_payload = transaction_data.dict()
        is_fraud, confidence, risk_indicators = FraudDetectionService.analyze_transaction(
            transaction_payload, db
        )
        
        # Create fraud alert if fraud detected
        if is_fraud:
            alert = FraudDetectionService.create_fraud_alert(
                transaction_payload,
                is_fraud,
                confidence,
                risk_indicators,
                db
            )
            alert_id = alert.id
        else:
            alert_id = None
            
        return {
            "is_fraud": is_fraud,
            "confidence": confidence,
            "risk_indicators": risk_indicators,
            "alert_id": alert_id
        }
    except Exception as e:
        logger.error(f"Error analyzing transaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze transaction"
        )

@router.patch("/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: int,
    status: FraudAlertStatus = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["analyst", "admin"]))
):
    """Update fraud alert status"""
    alert = FraudDetectionService.update_alert_status(alert_id, status.value, db)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found"
        )
    audit_log = AuditLog(
        actor_email=current_user.email,
        action="update_alert_status",
        entity_type="fraud_alert",
        entity_id=str(alert_id),
        details={"status": status.value}
    )
    db.add(audit_log)
    db.commit()
    return {"message": "Status updated successfully", "alert": alert}

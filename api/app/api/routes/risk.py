from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.risk_analysis import RiskAnalysisService
from app.models.fraud import RiskProfile
from app.schemas.fraud import RiskProfileResponse

router = APIRouter(prefix="/risk", tags=["Risk Analysis"])

@router.get("/profiles", response_model=List[RiskProfileResponse])
def get_risk_profiles(db: Session = Depends(get_db)):
    return db.query(RiskProfile).order_by(RiskProfile.risk_score.desc()).all()

@router.get("/profiles/high", response_model=List[RiskProfileResponse])
def get_high_risk_profiles(
    threshold: int = 70,
    db: Session = Depends(get_db)
):
    return RiskAnalysisService.get_high_risk_customers(db, threshold=threshold)

@router.get("/profiles/{customer_id}", response_model=RiskProfileResponse)
def get_customer_profile(customer_id: str, db: Session = Depends(get_db)):
    profile = RiskAnalysisService.get_customer_risk_profile(customer_id, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk profile not found"
        )
    return profile

@router.get("/distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    return RiskAnalysisService.get_risk_distribution(db)

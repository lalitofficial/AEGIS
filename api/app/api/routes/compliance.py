from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List
from app.models.compliance import ComplianceFramework, ComplianceActivity
from app.schemas.compliance import ComplianceFrameworkResponse, ComplianceActivityResponse

router = APIRouter(prefix="/compliance", tags=["Compliance"])

@router.get("/frameworks", response_model=List[ComplianceFrameworkResponse])
async def get_compliance_frameworks(db: Session = Depends(get_db)):
    """Get compliance framework data"""
    frameworks = db.query(ComplianceFramework).order_by(ComplianceFramework.score.desc()).all()
    return frameworks

@router.get("/activities", response_model=List[ComplianceActivityResponse])
async def get_compliance_activities(db: Session = Depends(get_db)):
    """Get recent compliance activities"""
    activities = db.query(ComplianceActivity).order_by(ComplianceActivity.date.desc()).all()
    return activities

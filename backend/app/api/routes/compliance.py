from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List

router = APIRouter(prefix="/compliance", tags=["Compliance"])

@router.get("/frameworks")
async def get_compliance_frameworks(db: Session = Depends(get_db)):
    """Get compliance framework data"""
    # This would typically come from a database
    # For now, returning static data that matches frontend
    return [
        {
            "name": "PCI DSS",
            "score": 92,
            "status": "Compliant",
            "lastAudit": "2024-11-15",
            "description": "Payment Card Industry Data Security Standard"
        },
        {
            "name": "AML Compliance",
            "score": 88,
            "status": "Compliant",
            "lastAudit": "2024-10-20",
            "description": "Anti-Money Laundering"
        },
        {
            "name": "KYC Requirements",
            "score": 95,
            "status": "Compliant",
            "lastAudit": "2024-11-01",
            "description": "Know Your Customer"
        },
        {
            "name": "GDPR",
            "score": 90,
            "status": "Compliant",
            "lastAudit": "2024-10-28",
            "description": "General Data Protection Regulation"
        },
        {
            "name": "SOX",
            "score": 85,
            "status": "Needs Review",
            "lastAudit": "2024-09-10",
            "description": "Sarbanes-Oxley Act"
        }
    ]

@router.get("/activities")
async def get_compliance_activities(db: Session = Depends(get_db)):
    """Get recent compliance activities"""
    return [
        {
            "activity": "KYC Documentation Completed",
            "description": "All new customer verifications processed - Dec 1, 2024",
            "status": "completed",
            "date": "2024-12-01"
        },
        {
            "activity": "AML Transaction Monitoring Active",
            "description": "Suspicious activity reports filed for Nov 2024",
            "status": "completed",
            "date": "2024-11-28"
        },
        {
            "activity": "SOX Audit Review Required",
            "description": "Financial controls need quarterly assessment",
            "status": "pending",
            "date": "2024-11-20"
        }
    ]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Account
from app.services.risk_analysis import RiskAnalysisService
from typing import List

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("/monitored")
async def get_monitored_accounts(db: Session = Depends(get_db)):
    """Get monitored accounts summary"""
    try:
        accounts = db.query(Account).filter(Account.is_monitored == True).all()
        
        # Group by account type
        account_summary = {}
        for account in accounts:
            acc_type = account.account_type
            if acc_type not in account_summary:
                account_summary[acc_type] = {
                    "name": acc_type.replace('_', ' ').title() + " Accounts",
                    "count": 0,
                    "clean": 0,
                    "flagged": 0,
                    "status": "healthy",
                    "lastScan": "Recently",
                    "transactionVolume": "0M"
                }
            
            account_summary[acc_type]["count"] += 1
            if account.flagged_count == 0:
                account_summary[acc_type]["clean"] += 1
            else:
                account_summary[acc_type]["flagged"] += account.flagged_count
                
        return list(account_summary.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch monitored accounts")

@router.get("/{account_id}")
async def get_account_details(
    account_id: str,
    db: Session = Depends(get_db)):
    """Get specific account details"""
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Account
from typing import Optional
from datetime import datetime

def _format_volume(count: int) -> str:
    if count >= 1_000_000:
        return f"{count / 1_000_000:.1f}M"
    if count >= 1_000:
        return f"{count / 1_000:.1f}K"
    return str(count)

def _format_last_scan(last_scan: Optional[datetime]) -> str:
    return last_scan.isoformat() if last_scan else "N/A"

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
                    "lastScan": None,
                    "transactionVolume": 0,
                }
            
            account_summary[acc_type]["count"] += 1
            if account.flagged_count == 0:
                account_summary[acc_type]["clean"] += 1
            else:
                account_summary[acc_type]["flagged"] += account.flagged_count
            account_summary[acc_type]["transactionVolume"] += account.transaction_count or 0
            if account.last_transaction:
                existing_last_scan = account_summary[acc_type]["lastScan"]
                if not existing_last_scan or account.last_transaction > existing_last_scan:
                    account_summary[acc_type]["lastScan"] = account.last_transaction

        for summary in account_summary.values():
            flagged_ratio = summary["flagged"] / max(summary["count"], 1)
            if summary["flagged"] >= 10 or flagged_ratio >= 0.25:
                summary["status"] = "critical"
            elif summary["flagged"] > 0:
                summary["status"] = "watch"
            else:
                summary["status"] = "healthy"
            summary["lastScan"] = _format_last_scan(summary["lastScan"])
            summary["transactionVolume"] = _format_volume(summary["transactionVolume"])
                
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

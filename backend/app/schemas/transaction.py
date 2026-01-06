from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class TransactionBase(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float = Field(gt=0)
    currency: str = "INR"
    merchant_id: str
    merchant_category: Optional[str] = None
    payment_method: str
    ip_address: Optional[str] = None
    device_id: Optional[str] = None

class TransactionCreate(TransactionBase):
    location: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None

class TransactionResponse(TransactionBase):
    id: int
    status: str
    fraud_probability: Optional[float] = None
    timestamp: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

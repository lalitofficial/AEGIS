from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float = Field(gt=0)
    currency: str = "INR"
    merchant_id: str
    merchant_category: str | None = None
    payment_method: str
    ip_address: str | None = None
    device_id: str | None = None


class TransactionCreate(TransactionBase):
    location: dict[str, Any] | None = None
    features: dict[str, Any] | None = None


class TransactionResponse(TransactionBase):
    id: int
    status: str
    fraud_probability: float | None = None
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

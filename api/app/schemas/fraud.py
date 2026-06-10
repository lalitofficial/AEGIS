from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FraudAlertStatus(str, Enum):
    blocked = "Blocked"
    under_investigation = "Under Investigation"
    pending_review = "Pending Review"


class FraudAlertBase(BaseModel):
    transaction_id: str
    type: str
    amount: float
    customer_name: str
    customer_id: str
    risk_score: int = Field(ge=0, le=100)
    indicators: list[str]
    status: str


class FraudAlertCreate(FraudAlertBase):
    # Renamed to match model
    meta_data: dict[str, Any] | None = None
    ml_confidence: float | None = None


class FraudAlertResponse(FraudAlertBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RiskProfileBase(BaseModel):
    customer_id: str
    customer_name: str
    risk_score: int
    risk_factors: list[str]
    status: str
    account_age: str


class RiskProfileResponse(RiskProfileBase):
    id: int
    last_activity: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GraphNodeSchema(BaseModel):
    id: str
    label: str
    group: str
    size: int
    title: str | None = None


class GraphEdgeSchema(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")

    model_config = ConfigDict(populate_by_name=True)


class GraphDataResponse(BaseModel):
    nodes: list[GraphNodeSchema]
    edges: list[GraphEdgeSchema]


class FraudAnalysisRequest(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float = Field(gt=0)
    currency: str = "INR"
    merchant_id: str
    merchant_category: str | None = None
    payment_method: str
    ip_address: str | None = None
    device_id: str | None = None
    location: dict[str, Any] | None = None
    features: dict[str, Any] | None = None
    status: str | None = None
    fraud_type: str | None = None
    customer_name: str | None = None

    model_config = ConfigDict(extra="allow")

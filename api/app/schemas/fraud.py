from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class FraudAlertBase(BaseModel):
    transaction_id: str
    type: str
    amount: float
    customer_name: str
    customer_id: str
    risk_score: int = Field(ge=0, le=100)
    indicators: List[str]
    status: str

class FraudAlertCreate(FraudAlertBase):
    # Renamed to match model
    meta_data: Optional[Dict[str, Any]] = None
    ml_confidence: Optional[float] = None

class FraudAlertResponse(FraudAlertBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RiskProfileBase(BaseModel):
    customer_id: str
    customer_name: str
    risk_score: int
    risk_factors: List[str]
    status: str
    account_age: str

class RiskProfileResponse(RiskProfileBase):
    id: int
    last_activity: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class GraphNodeSchema(BaseModel):
    id: str
    label: str
    group: str
    size: int
    title: Optional[str] = None

class GraphEdgeSchema(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    
    class Config:
        populate_by_name = True

class GraphDataResponse(BaseModel):
    nodes: List[GraphNodeSchema]
    edges: List[GraphEdgeSchema]

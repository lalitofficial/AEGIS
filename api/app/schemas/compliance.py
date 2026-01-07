from pydantic import BaseModel
from datetime import date

class ComplianceFrameworkResponse(BaseModel):
    id: int
    name: str
    score: int
    status: str
    last_audit: date
    description: str

    class Config:
        from_attributes = True

class ComplianceActivityResponse(BaseModel):
    id: int
    activity: str
    description: str
    status: str
    date: date

    class Config:
        from_attributes = True

class DetectionPostureResponse(BaseModel):
    id: int
    category: str
    score: int

    class Config:
        from_attributes = True

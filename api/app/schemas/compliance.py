from datetime import date

from pydantic import BaseModel, ConfigDict


class ComplianceFrameworkResponse(BaseModel):
    id: int
    name: str
    score: int
    status: str
    last_audit: date
    description: str

    model_config = ConfigDict(from_attributes=True)


class ComplianceActivityResponse(BaseModel):
    id: int
    activity: str
    description: str
    status: str
    date: date

    model_config = ConfigDict(from_attributes=True)


class DetectionPostureResponse(BaseModel):
    id: int
    category: str
    score: int

    model_config = ConfigDict(from_attributes=True)

from sqlalchemy import Column, Date, DateTime, Integer, String

from app.database import Base
from app.utils.helpers import utcnow


class ComplianceFramework(Base):
    __tablename__ = "compliance_frameworks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    score = Column(Integer)
    status = Column(String)
    last_audit = Column(Date)
    description = Column(String)
    created_at = Column(DateTime, default=utcnow)


class ComplianceActivity(Base):
    __tablename__ = "compliance_activities"

    id = Column(Integer, primary_key=True, index=True)
    activity = Column(String)
    description = Column(String)
    status = Column(String)
    date = Column(Date)
    created_at = Column(DateTime, default=utcnow)


class DetectionPosture(Base):
    __tablename__ = "detection_posture"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, unique=True, index=True)
    score = Column(Integer)
    created_at = Column(DateTime, default=utcnow)

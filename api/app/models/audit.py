from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from datetime import datetime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_email = Column(String, index=True)
    action = Column(String, index=True)
    entity_type = Column(String, index=True)
    entity_id = Column(String, index=True)
    details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

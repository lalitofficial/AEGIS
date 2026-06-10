from sqlalchemy import JSON, Column, DateTime, Integer, String

from app.database import Base
from app.utils.helpers import utcnow


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_email = Column(String, index=True)
    action = Column(String, index=True)
    entity_type = Column(String, index=True)
    entity_id = Column(String, index=True)
    details = Column(JSON)
    created_at = Column(DateTime, default=utcnow)

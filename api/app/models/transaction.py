from sqlalchemy import JSON, Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.helpers import utcnow


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    customer_id = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String, default="INR")
    merchant_id = Column(String)
    merchant_category = Column(String)
    payment_method = Column(String)

    # Location & Device
    ip_address = Column(String)
    device_id = Column(String)
    location = Column(JSON)

    # Timestamps
    timestamp = Column(DateTime, default=utcnow)
    created_at = Column(DateTime, default=utcnow)

    # Status
    status = Column(String, default="pending")

    # ML Features
    features = Column(JSON)
    fraud_probability = Column(Float)

    # Relationships
    fraud_alert = relationship("FraudAlert", back_populates="transaction", uselist=False)


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, unique=True, index=True)
    customer_id = Column(String, index=True)
    account_type = Column(String)
    balance = Column(Float)
    status = Column(String, default="active")

    # Monitoring
    is_monitored = Column(Boolean, default=True)
    last_transaction = Column(DateTime)
    transaction_count = Column(Integer, default=0)
    flagged_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    # ADDED ForeignKey here to fix the join condition error
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), unique=True, index=True)
    type = Column(String)
    amount = Column(Float)
    customer_name = Column(String)
    customer_id = Column(String, index=True)
    risk_score = Column(Integer)
    indicators = Column(JSON)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    meta_data = Column(JSON)
    ml_confidence = Column(Float)
    
    transaction = relationship("Transaction", back_populates="fraud_alert", uselist=False)

class RiskProfile(Base):
    __tablename__ = "risk_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True)
    customer_name = Column(String)
    risk_score = Column(Integer)
    risk_factors = Column(JSON)
    status = Column(String)
    account_age = Column(String)
    last_activity = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GraphNode(Base):
    __tablename__ = "graph_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, unique=True, index=True)
    label = Column(String)
    group = Column(String)
    size = Column(Integer)
    title = Column(String)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class GraphEdge(Base):
    __tablename__ = "graph_edges"
    
    id = Column(Integer, primary_key=True, index=True)
    from_node = Column(String, index=True)
    to_node = Column(String, index=True)
    weight = Column(Float, default=1.0)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

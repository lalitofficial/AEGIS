from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.graph_analysis import GraphAnalysisService
from app.schemas.fraud import GraphDataResponse

router = APIRouter(prefix="/graph", tags=["Graph Intelligence"])

@router.get("/data", response_model=GraphDataResponse)
def get_graph_data(db: Session = Depends(get_db)):
    return GraphAnalysisService.get_fraud_graph_data(db)

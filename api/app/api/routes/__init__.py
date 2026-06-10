from fastapi import APIRouter, Depends

from app.api.routes import accounts, auth, compliance, dashboard, fraud, graph, risk
from app.utils.auth import verify_api_key

api_router = APIRouter(dependencies=[Depends(verify_api_key)])
api_router.include_router(auth.router)
api_router.include_router(fraud.router)
api_router.include_router(dashboard.router)
api_router.include_router(compliance.router)
api_router.include_router(accounts.router)
api_router.include_router(risk.router)
api_router.include_router(graph.router)

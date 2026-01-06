from fastapi import APIRouter
from app.api.routes import fraud, dashboard, compliance, accounts

api_router = APIRouter()
api_router.include_router(fraud.router)
api_router.include_router(dashboard.router)
api_router.include_router(compliance.router)
api_router.include_router(accounts.router)
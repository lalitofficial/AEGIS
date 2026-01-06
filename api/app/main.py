from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api.routes import api_router
from app.utils.logger import logger
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AEGIS Fraud Detection Platform...")
    init_db()
    logger.info("Database initialized")
    
    # Load ML models
    from app.ml_models.fraud_detector import fraud_detector
    try:
        fraud_detector.load_model()
        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load ML models: {e}")
        logger.info("Using default models")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AEGIS Fraud Detection Platform...")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Advanced fraud detection and prevention platform powered by AI/ML",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.get("/")
async def root():
    return {
        "message": "AEGIS Fraud Detection Platform API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
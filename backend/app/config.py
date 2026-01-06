from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AEGIS Fraud Detection Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    
    # Database
    DATABASE_URL: str
    DATABASE_ECHO: bool = False

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ML Models
    MODEL_PATH: str = "./data/models"
    FRAUD_DETECTION_THRESHOLD: float = 0.75
    RISK_SCORE_THRESHOLD: int = 70
    
    # Redis (Optional)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

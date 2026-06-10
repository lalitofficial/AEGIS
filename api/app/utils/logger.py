import sys

from loguru import logger

from app.config import settings

# Configure logger
logger.remove()  # Remove default handler

# Add custom handler with formatting
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",  # noqa: E501
    level=settings.LOG_LEVEL,
)

# Add file handler
logger.add(
    "logs/aegis_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="30 days",
    level=settings.LOG_LEVEL,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} - {message}",
)

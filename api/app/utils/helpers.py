from datetime import datetime, timedelta
from typing import Dict, Any
import json
import uuid

def generate_transaction_id() -> str:
    """Generate unique transaction ID"""
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"

def calculate_time_difference(start: datetime, end: datetime) -> Dict[str, Any]:
    """Calculate time difference"""
    delta = end - start
    return {
        "days": delta.days,
        "hours": delta.seconds // 3600,
        "minutes": (delta.seconds % 3600) // 60,
        "total_seconds": delta.total_seconds()
    }

def format_currency(amount: float, currency: str = "INR") -> str:
    """Format currency amount"""
    if currency == "INR":
        return f"₹{amount:,.2f}"
    elif currency == "USD":
        return f"${amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in km using Haversine formula"""
    from math import radians, cos, sin, asin, sqrt
    
    # Convert to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    
    return c * r

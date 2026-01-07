import time
from typing import Any, Optional

_cache_store = {}

def get_cached(key: str) -> Optional[Any]:
    item = _cache_store.get(key)
    if not item:
        return None
    if time.time() > item["expires"]:
        _cache_store.pop(key, None)
        return None
    return item["value"]

def set_cached(key: str, value: Any, ttl_seconds: int = 15) -> None:
    _cache_store[key] = {
        "value": value,
        "expires": time.time() + ttl_seconds,
    }

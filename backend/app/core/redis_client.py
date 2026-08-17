"""Cliente Redis compartido: cache de sesión modo Express y broker de Celery."""
import redis

from app.core.config import settings

redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)

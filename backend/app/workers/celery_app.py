"""Aplicación Celery: cola de procesamiento asíncrono sobre Redis (HU 1.1, 1.2, 3.1)."""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery("trustocr", broker=settings.redis_url, backend=settings.redis_url)
celery_app.autodiscover_tasks(["app.workers"])

celery_app.conf.beat_schedule = {
    "purge-expired-documents-daily": {
        "task": "app.workers.tasks.purge_expired_documents",
        "schedule": crontab(hour=3, minute=0),
    },
}

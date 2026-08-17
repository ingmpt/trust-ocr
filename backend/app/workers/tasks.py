"""Tareas asíncronas: purga de retención (HU 3.1) y utilidades de procesamiento por lote."""
from app.core.database import SessionLocal
from app.services.document_service import DocumentService
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.purge_expired_documents")
def purge_expired_documents() -> int:
    """Elimina físicamente documentos/datos del modo 'Almacenado' vencidos (5 días, HU 3.1)."""
    db = SessionLocal()
    try:
        return DocumentService(db).purge_expired()
    finally:
        db.close()

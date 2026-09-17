"""Tareas asíncronas: procesamiento batch y purga de retención (HU 1.1, 3.1)."""
import json
import time
import uuid
import zipfile
from io import BytesIO

from app.core.database import SessionLocal
from app.core.config import settings
from app.core.redis_client import redis_client
from app.models.batch import Batch
from app.models.document import Document, ExtractionResult
from app.models.enums import DocumentStatus, ProcessingMode
from app.repositories.batch_repository import BatchRepository
from app.repositories.document_repository import DocumentRepository
from app.services.credit_service import CreditService
from app.services.document_service import DocumentService
from app.services.notification_service import NotificationService
from app.services.ocr.pdf_rasterizer import is_pdf
from app.services.ocr.pipeline import run_extraction_pipeline, run_ocr
from app.services.storage_service import StorageService
from app.services.template_service import TemplateService
from app.workers.celery_app import celery_app

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


@celery_app.task(name="app.workers.tasks.purge_expired_documents")
def purge_expired_documents() -> int:
    db = SessionLocal()
    try:
        return DocumentService(db).purge_expired()
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.create_draft_template")
def create_draft_template_task(user_id: str, fields_json: str) -> dict:
    """Sugiere una plantilla borrador en segundo plano a partir de un documento sin
    coincidencia (HU 4.2), sin bloquear la respuesta al usuario que subió el documento."""
    db = SessionLocal()
    try:
        fields = json.loads(fields_json)
        template = TemplateService(db).create_draft_from_fields(uuid.UUID(user_id), fields)
        return {"created": template is not None, "template_id": str(template.id) if template else None}
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.process_batch")
def process_batch_task(batch_id: str) -> dict:
    db = SessionLocal()
    try:
        repo = BatchRepository(db)
        batch = repo.get_by_id(uuid.UUID(batch_id))
        if batch is None:
            return {"error": "batch not found"}

        batch.status = "processing"
        repo.save(batch)
        db.commit()

        storage = StorageService()
        zip_bytes = storage.get_object(batch.storage_key)
        if zip_bytes is None:
            batch.status = "failed"
            repo.save(batch)
            db.commit()
            return {"error": "zip not found in storage"}

        user = batch.user
        credit_service = CreditService(db)
        doc_repo = DocumentRepository(db)
        notifications = NotificationService()

        fixed_template_fields = None
        if batch.template_id:
            tpl = TemplateService(db).get_template(user, batch.template_id)
            fixed_template_fields = tpl.field_definitions

        processed = 0
        failed = 0

        with zipfile.ZipFile(BytesIO(zip_bytes)) as archive:
            entries = [n for n in archive.namelist() if not n.endswith("/")]
            for name in entries:
                suffix = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
                if suffix not in SUPPORTED_EXTENSIONS:
                    continue

                file_bytes = archive.read(name)
                page_count = _count_pages(file_bytes)

                try:
                    subscription = credit_service.get_active_subscription(user)
                    credit_service.reserve_pages(subscription, page_count)
                except Exception:
                    failed += 1
                    continue

                ocr_text = run_ocr(file_bytes)
                template_fields = fixed_template_fields
                if template_fields is None:
                    svc = TemplateService(db)
                    matched, _ = svc.auto_classify_and_extract(user, ocr_text)
                    if matched:
                        template_fields = matched.field_definitions

                document = Document(
                    user_id=user.id,
                    batch_id=batch.id,
                    original_filename=name,
                    processing_mode=batch.processing_mode,
                    status=DocumentStatus.PROCESSING.value,
                    page_count=page_count,
                )
                doc_repo.create(document)
                db.commit()

                try:
                    result = run_extraction_pipeline(file_bytes, template_fields=template_fields, ocr_text=ocr_text)
                    document.status = DocumentStatus.COMPLETED.value
                    document.document_type = result.document_type
                    from datetime import datetime, timezone
                    document.completed_at = datetime.now(timezone.utc)

                    if document.processing_mode == ProcessingMode.EXPRESS.value:
                        redis_client.set(f"express_result:{document.id}", json.dumps(result.fields), ex=settings.express_result_ttl_seconds)
                    else:
                        storage_key = f"documents/{user.id}/{document.id}/{name}"
                        storage.put_object(storage_key, file_bytes)
                        document.storage_key = storage_key
                        document.expires_at = storage.compute_expiration()
                        doc_repo.save_extraction_result(ExtractionResult(document_id=document.id, extracted_fields=result.fields))

                    doc_repo.save(document)
                    db.commit()
                    processed += 1
                except Exception as exc:
                    document.status = DocumentStatus.FAILED.value
                    document.error_message = str(exc)[:500]
                    doc_repo.save(document)
                    db.commit()
                    failed += 1

        batch.processed_files = processed
        batch.failed_files = failed
        batch.status = "completed" if failed == 0 else ("completed" if processed > 0 else "failed")
        from datetime import datetime, timezone
        batch.completed_at = datetime.now(timezone.utc)
        repo.save(batch)
        db.commit()

        notifications.send_processing_complete(user.email, f"Lote {batch_id}: {processed} procesados, {failed} fallidos")
        return {"batch_id": batch_id, "processed": processed, "failed": failed}
    finally:
        db.close()


def _count_pages(content: bytes) -> int:
    if not is_pdf(content):
        return 1
    import fitz
    with fitz.open(stream=content, filetype="pdf") as doc:
        return max(doc.page_count, 1)

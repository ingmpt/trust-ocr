"""Servicio de Ingesta y Procesamiento de Documentos (HU 1.1, 1.2, 1.3, 3.1).

Orquesta: validación de formato, reserva de créditos (HU 2.3), enrutamiento
por Modo de Privacidad (Express/Almacenado, HU 3.1), ejecución del pipeline
de extracción y persistencia/entrega del resultado.
"""
import json
import time
import uuid
import zipfile
from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.redis_client import redis_client
from app.models.document import Document, ExtractionResult
from app.models.enums import DocumentStatus, ProcessingMode
from app.models.user import User
from app.repositories.document_repository import DocumentRepository
from app.services.credit_service import CreditService
from app.services.notification_service import NotificationService
from app.services.ocr.pdf_rasterizer import is_pdf
from app.services.ocr.pipeline import run_extraction_pipeline
from app.services.storage_service import StorageService
from app.services.template_service import TemplateService

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
EXPRESS_TARGET_SECONDS = 1.5
SECONDS_PER_PAGE_ESTIMATE = 0.8


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.documents = DocumentRepository(db)
        self.credits = CreditService(db)
        self.notifications = NotificationService()
        self.storage = StorageService()

    def _validate_extension(self, filename: str) -> None:
        suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if suffix not in SUPPORTED_EXTENSIONS and suffix != ".zip":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Formato de archivo no soportado: {suffix or 'desconocido'}. Formatos válidos: JPEG, PNG, PDF, ZIP.",
            )

    def _count_pages(self, content: bytes) -> int:
        """1 crédito de página = 1 imagen o 1 hoja de PDF (HU 2.1)."""
        if not is_pdf(content):
            return 1
        import fitz

        with fitz.open(stream=content, filetype="pdf") as document:
            return max(document.page_count, 1)

    def upload_single(self, user: User, file: UploadFile, processing_mode: str, template_id: uuid.UUID | None = None) -> Document:
        self._validate_extension(file.filename)
        content = file.file.read()
        page_count = self._count_pages(content)

        subscription = self.credits.get_active_subscription(user)
        self.credits.reserve_pages(subscription, page_count)
        if self.credits.is_near_limit(subscription):
            self.notifications.send_usage_warning(user.email, self.credits.usage_percent(subscription))

        # OCR se ejecuta UNA sola vez; el texto se reutiliza en clasificación y extracción.
        from app.services.ocr.pipeline import run_ocr
        ocr_text = run_ocr(content)

        template_fields = None
        if template_id:
            template = TemplateService(self.db).get_template(user, template_id)
            template_fields = template.field_definitions
        else:
            svc = TemplateService(self.db)
            matched, _ = svc.auto_classify_and_extract(user, ocr_text)
            if matched:
                template_fields = matched.field_definitions

        document = Document(
            user_id=user.id,
            original_filename=file.filename,
            processing_mode=processing_mode,
            status=DocumentStatus.PROCESSING.value,
            page_count=page_count,
        )
        self.documents.create(document)
        self.db.commit()

        self._process_document(document, content, template_fields, ocr_text)
        return document

    def upload_batch(self, user: User, zip_file: UploadFile, processing_mode: str, template_id: uuid.UUID | None = None) -> list[Document]:
        content = zip_file.file.read()
        documents: list[Document] = []

        # Si el usuario seleccionó plantilla, se aplica a todo el lote (atajo eficiente).
        fixed_template_fields = None
        if template_id:
            fixed_template_fields = TemplateService(self.db).get_template(user, template_id).field_definitions

        with zipfile.ZipFile(BytesIO(content)) as archive:
            entries = [name for name in archive.namelist() if not name.endswith("/")]
            for name in entries:
                suffix = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
                if suffix not in SUPPORTED_EXTENSIONS:
                    continue

                file_bytes = archive.read(name)
                subscription = self.credits.get_active_subscription(user)
                page_count = self._count_pages(file_bytes)
                self.credits.reserve_pages(subscription, page_count)

                from app.services.ocr.pipeline import run_ocr
                ocr_text = run_ocr(file_bytes)

                template_fields = fixed_template_fields
                if template_fields is None:
                    svc = TemplateService(self.db)
                    matched, _ = svc.auto_classify_and_extract(user, ocr_text)
                    if matched:
                        template_fields = matched.field_definitions

                document = Document(
                    user_id=user.id,
                    original_filename=name,
                    processing_mode=processing_mode,
                    status=DocumentStatus.PROCESSING.value,
                    page_count=page_count,
                )
                self.documents.create(document)
                self.db.commit()

                self._process_document(document, file_bytes, template_fields, ocr_text)
                documents.append(document)

        if self.credits.is_near_limit(self.credits.get_active_subscription(user)):
            self.notifications.send_usage_warning(user.email, self.credits.usage_percent(self.credits.get_active_subscription(user)))

        return documents

    def _process_document(self, document: Document, content: bytes, template_fields: list[dict] | None = None, ocr_text: str | None = None) -> None:
        started_at = time.monotonic()
        try:
            result = run_extraction_pipeline(content, template_fields=template_fields, ocr_text=ocr_text)
        except Exception as exc:  # noqa: BLE001 — se persiste el error, no se re-lanza (HU 1.3)
            document.status = DocumentStatus.FAILED.value
            document.error_message = str(exc)
            self.documents.save(document)
            self.db.commit()
            return

        document.status = DocumentStatus.COMPLETED.value
        document.document_type = result.document_type
        document.completed_at = _utcnow()
        elapsed = time.monotonic() - started_at

        if document.processing_mode == ProcessingMode.EXPRESS.value:
            self._store_express_result(document, result.fields)
        else:
            self._store_persisted_result(document, content, result.fields)

        self.documents.save(document)
        self.db.commit()

        user = document.user
        if user:
            self.notifications.send_processing_complete(user.email, str(document.id))

        _ = elapsed  # referencia para calibración de SLA <1.5s en modo Express (ver "Riesgos técnicos")

    def _store_express_result(self, document: Document, fields: dict) -> None:
        """Modo Express: sólo el JSON final vive en Redis durante la sesión activa;
        no hay persistencia en disco ni base de datos (HU 1.3, 3.1)."""
        redis_client.set(f"express_result:{document.id}", json.dumps(fields), ex=settings.express_result_ttl_seconds)

    def _store_persisted_result(self, document: Document, content: bytes, fields: dict) -> None:
        """Modo Almacenado: imagen + resultado persisten 5 días (HU 3.1)."""
        storage_key = f"documents/{document.user_id}/{document.id}/{document.original_filename}"
        self.storage.put_object(storage_key, content)
        document.storage_key = storage_key
        document.expires_at = self.storage.compute_expiration()

        self.documents.save_extraction_result(ExtractionResult(document_id=document.id, extracted_fields=fields))

    def get_result(self, user: User, document_id: uuid.UUID) -> dict:
        document = self.documents.get_by_id_for_user(document_id, user.id)
        if document is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Documento no encontrado.")

        fields = None
        if document.status == DocumentStatus.COMPLETED.value:
            if document.processing_mode == ProcessingMode.EXPRESS.value:
                raw = redis_client.get(f"express_result:{document.id}")
                fields = json.loads(raw) if raw else None
            elif document.extraction_result:
                fields = document.extraction_result.extracted_fields

        return {
            "id": document.id,
            "status": document.status,
            "processing_mode": document.processing_mode,
            "document_type": document.document_type,
            "extracted_fields": fields,
            "used_template": document.document_type == "plantilla",
            "error_message": document.error_message,
            "created_at": document.created_at,
            "completed_at": document.completed_at,
            "expires_at": document.expires_at,
        }

    def estimate_processing_seconds(self, page_count: int) -> float:
        return round(max(page_count * SECONDS_PER_PAGE_ESTIMATE, EXPRESS_TARGET_SECONDS), 2)

    def list_recent(self, user: User, limit: int = 10) -> list[Document]:
        return self.documents.list_recent_for_user(user.id, limit)

    def purge_expired(self) -> int:
        """Elimina físicamente documentos/persistencia vencidos del modo Almacenado (HU 3.1)."""
        expired = self.documents.list_expired(_utcnow())
        for document in expired:
            if document.storage_key:
                self.storage.delete_object(document.storage_key)
                document.storage_key = None
            if document.extraction_result:
                self.db.delete(document.extraction_result)
        self.db.commit()
        return len(expired)


def _utcnow():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)

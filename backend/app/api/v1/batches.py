"""Endpoints de Carga Masiva (Batch) — procesamiento asíncrono."""
import uuid

from fastapi import APIRouter, File, Form, UploadFile

from app.api.deps import CurrentUserAny, DbSession
from app.schemas.batch import BatchDocumentRead, BatchStatusRead, BatchSubmitResponse
from app.services.batch_service import BatchService
from app.services.document_service import DocumentService

router = APIRouter(prefix="/batches", tags=["batches"])


@router.post("", response_model=BatchSubmitResponse, status_code=202)
def submit_batch(
    db: DbSession,
    user: CurrentUserAny,
    file: UploadFile = File(...),
    processing_mode: str = Form("almacenado"),
    template_id: str = Form(""),
):
    tid = uuid.UUID(template_id) if template_id else None
    batch = BatchService(db).submit_batch(user, file, processing_mode, template_id=tid)
    return BatchSubmitResponse(
        batch_id=batch.id,
        status=batch.status,
        total_files=batch.total_files,
        message=f"Lote recibido con {batch.total_files} archivo(s). Se procesará en segundo plano y recibirá una notificación al finalizar.",
    )


@router.get("", response_model=list[BatchStatusRead])
def list_batches(db: DbSession, user: CurrentUserAny, limit: int = 20):
    return BatchService(db).list_batches(user, limit)


@router.get("/{batch_id}", response_model=BatchStatusRead)
def get_batch_status(batch_id: uuid.UUID, db: DbSession, user: CurrentUserAny):
    return BatchService(db).get_batch(user, batch_id)


@router.get("/{batch_id}/documents", response_model=list[BatchDocumentRead])
def list_batch_documents(batch_id: uuid.UUID, db: DbSession, user: CurrentUserAny):
    batch = BatchService(db).get_batch(user, batch_id)
    return [
        BatchDocumentRead(
            id=doc.id,
            original_filename=doc.original_filename,
            status=doc.status,
            document_type=doc.document_type,
            page_count=doc.page_count,
        )
        for doc in batch.documents
    ]

"""Endpoints de Ingesta y Resultados de Documentos (HU 1.1, 1.2, 1.3, 1.4, 3.1).

Acepta autenticación tanto por sesión web (JWT) como por clave API (X-API-Key),
según lo requiera el llamador (portal web o integración programática).
"""
import uuid

from fastapi import APIRouter, File, Form, UploadFile

from app.api.deps import CurrentUserAny, DbSession
from app.schemas.document import BatchUploadResponse, DocumentResultRead, DocumentUploadResponse
from app.services.document_service import DocumentService

router = APIRouter(tags=["documents"])


@router.get("/documents/recent", response_model=list[DocumentResultRead])
def list_recent_documents(db: DbSession, user: CurrentUserAny, limit: int = 10):
    service = DocumentService(db)
    return [service.get_result(user, document.id) for document in service.list_recent(user, limit)]


@router.post("/documents", response_model=DocumentUploadResponse, status_code=201)
def upload_document(
    db: DbSession,
    user: CurrentUserAny,
    file: UploadFile = File(...),
    processing_mode: str = Form("express"),
    template_id: str = Form(""),
):
    service = DocumentService(db)
    tid = uuid.UUID(template_id) if template_id else None
    document = service.upload_single(user, file, processing_mode, template_id=tid)
    return DocumentUploadResponse(
        id=document.id,
        status=document.status,
        processing_mode=document.processing_mode,
        page_count=document.page_count,
        estimated_seconds=service.estimate_processing_seconds(document.page_count),
    )


@router.post("/documents/batch", response_model=BatchUploadResponse, status_code=201)
def upload_batch(
    db: DbSession,
    user: CurrentUserAny,
    file: UploadFile = File(...),
    processing_mode: str = Form("express"),
):
    service = DocumentService(db)
    documents = service.upload_batch(user, file, processing_mode)
    return BatchUploadResponse(
        batch_id=uuid.uuid4(),
        document_ids=[document.id for document in documents],
        total_documents=len(documents),
        estimated_seconds=service.estimate_processing_seconds(len(documents)),
    )


@router.get("/documents/{document_id}", response_model=DocumentResultRead)
def get_document_result(document_id: uuid.UUID, db: DbSession, user: CurrentUserAny):
    return DocumentService(db).get_result(user, document_id)

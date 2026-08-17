"""Endpoints públicos del Portal de Autoservicio ARCO (HU 3.2)."""
from fastapi import APIRouter, File, Form, UploadFile

from app.api.deps import DbSession
from app.schemas.arco import (
    ArcoAccessRequest,
    ArcoCancellationRequest,
    ArcoIdentityVerifyResponse,
    ArcoOppositionRequest,
    ArcoRectificationRequest,
    ArcoRequestRead,
)
from app.services.arco_service import ArcoService

router = APIRouter(prefix="/arco", tags=["arco"])


@router.post("/identity/verify", response_model=ArcoIdentityVerifyResponse, status_code=201)
def verify_identity(db: DbSession, dni: str = Form(..., min_length=8, max_length=8), identity_photo: UploadFile = File(...)):
    token = ArcoService(db).verify_identity(dni, identity_photo)
    return ArcoIdentityVerifyResponse(validation_token=token, dni=dni)


@router.post("/requests/access", response_model=ArcoRequestRead, status_code=201)
def request_access(payload: ArcoAccessRequest, db: DbSession):
    return ArcoService(db).request_access(payload.validation_token)


@router.post("/requests/rectification", response_model=ArcoRequestRead, status_code=201)
def request_rectification(payload: ArcoRectificationRequest, db: DbSession):
    return ArcoService(db).request_rectification(payload.validation_token, payload.fields_to_rectify, payload.reason)


@router.post("/requests/cancellation", response_model=ArcoRequestRead, status_code=201)
def request_cancellation(payload: ArcoCancellationRequest, db: DbSession):
    return ArcoService(db).request_cancellation(payload.validation_token, payload.reason, payload.confirm)


@router.post("/requests/opposition", response_model=ArcoRequestRead, status_code=201)
def request_opposition(payload: ArcoOppositionRequest, db: DbSession):
    return ArcoService(db).request_opposition(payload.validation_token, payload.reason)


@router.get("/requests/track/{dni}", response_model=list[ArcoRequestRead])
def track_requests(dni: str, db: DbSession):
    return ArcoService(db).track_requests(dni)

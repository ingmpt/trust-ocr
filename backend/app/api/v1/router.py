"""Agrega todos los routers de la API v1."""
from fastapi import APIRouter

from app.api.v1 import arco, auth, billing, documents, plans

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(plans.router)
api_router.include_router(documents.router)
api_router.include_router(billing.router)
api_router.include_router(arco.router)

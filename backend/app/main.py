"""Punto de entrada de la API de Trust OCR+."""
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.db.seed import seed_plans

logging.basicConfig(level=logging.INFO if settings.app_debug else logging.WARNING)

app = FastAPI(
    title="Trust OCR+ API",
    description="Plataforma de digitalización y extracción de datos estructurados para documentos peruanos.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Manejo uniforme de errores de API con código y detalle descriptivos (HU 1.4).
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_plans(db)
    finally:
        db.close()


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "env": settings.app_env}

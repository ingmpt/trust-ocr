"""Dependencias comunes de FastAPI: sesión de BD y usuario autenticado (JWT o clave API)."""
from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

_bearer_scheme = HTTPBearer(auto_error=False)
_api_key_scheme = APIKeyHeader(name="X-API-Key", auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(_bearer_scheme)] = None,
) -> User:
    """Autenticación de sesión web (JWT) — usada por el portal (Dashboard, Mi Cuenta, etc.)."""
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado.")

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido o expirado.")

    user = UserRepository(db).get_by_id(user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no encontrado o inactivo.")
    return user


def get_current_user_from_api_key(
    db: DbSession,
    api_key: Annotated[str | None, Security(_api_key_scheme)] = None,
) -> User:
    """Autenticación programática por clave API — usada por los endpoints de integración (HU 1.4)."""
    if api_key is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Falta el encabezado X-API-Key.")
    return AuthService(db).authenticate_api_key(api_key)


CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentApiUser = Annotated[User, Depends(get_current_user_from_api_key)]


def get_current_user_any(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(_bearer_scheme)] = None,
    api_key: Annotated[str | None, Security(_api_key_scheme)] = None,
) -> User:
    """Acepta sesión web (JWT) o clave API (X-API-Key) — usada por endpoints
    accesibles tanto desde el portal como desde integraciones (HU 1.1, 1.4)."""
    if api_key is not None:
        return AuthService(db).authenticate_api_key(api_key)
    if credentials is not None:
        return get_current_user(db, credentials)
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado: provea un token Bearer o una clave X-API-Key.")


CurrentUserAny = Annotated[User, Depends(get_current_user_any)]


def get_current_admin_user(current_user: CurrentUser) -> User:
    """Restringe el acceso a usuarios con rol 'admin' (HU 4.2)."""
    if current_user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Requiere permisos de administrador.")
    return current_user


CurrentAdminUser = Annotated[User, Depends(get_current_admin_user)]

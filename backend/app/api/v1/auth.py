"""Endpoints de autenticación, perfil y claves API (HU 2.1, 4.1, 1.4)."""
from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import (
    ApiKeyCreate,
    ApiKeyCreated,
    ApiKeyRead,
    ChangeEmailRequest,
    ChangePasswordRequest,
    TokenResponse,
    UserLogin,
    UserRead,
    UserRegister,
)
from app.services.auth_service import AuthService

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: DbSession):
    _, token = AuthService(db).register(payload.email, payload.password)
    return TokenResponse(access_token=token)


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: DbSession):
    _, token = AuthService(db).login(payload.email, payload.password)
    return TokenResponse(access_token=token)


@router.get("/users/me", response_model=UserRead)
def get_me(current_user: CurrentUser):
    return current_user


@router.put("/users/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(payload: ChangePasswordRequest, current_user: CurrentUser, db: DbSession):
    AuthService(db).change_password(current_user, payload.current_password, payload.new_password)


@router.put("/users/me/email", status_code=status.HTTP_204_NO_CONTENT)
def change_email(payload: ChangeEmailRequest, current_user: CurrentUser, db: DbSession):
    AuthService(db).change_email(current_user, payload.new_email)


@router.post("/users/me/api-keys", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
def create_api_key(payload: ApiKeyCreate, current_user: CurrentUser, db: DbSession):
    api_key, raw_key = AuthService(db).create_api_key(current_user, payload.name)
    return ApiKeyCreated(id=api_key.id, name=api_key.name, raw_key=raw_key, created_at=api_key.created_at)


@router.get("/users/me/api-keys", response_model=list[ApiKeyRead])
def list_api_keys(current_user: CurrentUser, db: DbSession):
    from app.repositories.user_repository import ApiKeyRepository

    return ApiKeyRepository(db).list_for_user(current_user.id)


@router.delete("/users/me/api-keys/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(api_key_id: str, current_user: CurrentUser, db: DbSession):
    import uuid

    AuthService(db).revoke_api_key(current_user, uuid.UUID(api_key_id))

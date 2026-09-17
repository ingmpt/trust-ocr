"""Esquemas de autenticación y usuario (HU 2.1, 4.1)."""
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ChangeEmailRequest(BaseModel):
    new_email: EmailStr


class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ApiKeyCreated(BaseModel):
    id: uuid.UUID
    name: str
    raw_key: str  # se muestra una única vez
    created_at: datetime


class ApiKeyRead(BaseModel):
    id: uuid.UUID
    name: str
    key_preview: str
    created_at: datetime
    revoked_at: datetime | None

    model_config = {"from_attributes": True}

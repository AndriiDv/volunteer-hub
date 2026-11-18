from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, model_validator

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[Literal["volunteer", "military", "admin"]] = "volunteer"
    unit_name: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_user_fields(cls, values):
        if isinstance(values, dict):
            # Resolve full_name from full_name, name, or username, or email prefix
            name = values.get("full_name") or values.get("name") or values.get("username")
            if not name and values.get("email"):
                name = str(values["email"]).split("@")[0]
            values["full_name"] = (name or "Користувач").strip()

            # Default role
            role = values.get("role")
            if not role or role not in ("volunteer", "military", "admin"):
                values["role"] = "volunteer"

            # Normalize unit_name: empty string -> None
            unit = values.get("unit_name")
            if isinstance(unit, str) and not unit.strip():
                values["unit_name"] = None
        return values

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str

    @model_validator(mode="before")
    @classmethod
    def normalize_login_fields(cls, values):
        if isinstance(values, dict):
            email_val = values.get("email") or values.get("username")
            if not email_val:
                raise ValueError("Email or username is required")
            values["email"] = str(email_val).strip()
        return values

class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    credential: Optional[str] = None
    token: Optional[str] = None
    role: Optional[Literal["volunteer", "military"]] = "volunteer"

    @model_validator(mode="before")
    @classmethod
    def normalize_google_fields(cls, values):
        if isinstance(values, dict):
            tok = values.get("id_token") or values.get("credential") or values.get("token")
            if not tok:
                raise ValueError("id_token or credential is required")
            values["id_token"] = str(tok).strip()

            role = values.get("role")
            if not role or role not in ("volunteer", "military"):
                values["role"] = "volunteer"
        return values

class UserOut(UserBase):
    id: int
    is_verified: bool
    points: int
    created_at: datetime
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"

    class Config:
        from_attributes = True

class UserOutSummary(BaseModel):
    id: int
    full_name: str
    unit_name: Optional[str] = None
    is_verified: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

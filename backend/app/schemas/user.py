from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["volunteer", "military", "admin"] = "volunteer"
    unit_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    is_verified: bool
    points: int
    created_at: datetime

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

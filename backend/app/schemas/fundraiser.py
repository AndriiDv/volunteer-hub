from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, HttpUrl, Field

class VolunteerSummary(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

class FundraiserBase(BaseModel):
    jar_url: str
    goal_amount: float = Field(gt=0)
    current_amount: float = Field(default=0.0, ge=0)

class FundraiserCreate(BaseModel):
    jar_url: str
    goal_amount: float = Field(gt=0)
    current_amount: float = Field(default=0.0, ge=0)

class FundraiserUpdate(BaseModel):
    current_amount: Optional[float] = Field(default=None, ge=0)
    jar_url: Optional[str] = None

class FundraiserOut(FundraiserBase):
    id: int
    need_id: int
    volunteer_user_id: int
    status: Literal["active", "pending_verification", "verified"]
    proof_image_url: Optional[str] = None
    created_at: datetime
    volunteer: Optional[VolunteerSummary] = None

    class Config:
        from_attributes = True

class FundraiserVerifyOut(BaseModel):
    message: str
    fundraiser: FundraiserOut
    awarded_points: int
    need_status: str
    total_verified_amount: float
    target_amount: float

from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from app.schemas.user import UserOutSummary
from app.schemas.fundraiser import FundraiserOut

CategoryType = Literal["drones", "ew", "vehicles", "medicine", "gear"]
UrgencyType = Literal["low", "medium", "critical"]
StatusType = Literal["open", "completed"]

class NeedBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str
    category: CategoryType
    target_amount: float = Field(gt=0)
    urgency: UrgencyType = "medium"

class NeedCreate(NeedBase):
    pass

class NeedOut(NeedBase):
    id: int
    military_user_id: int
    military_user: Optional[UserOutSummary] = None
    status: StatusType
    raised_amount: float = 0.0
    fundraisers_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class NeedDetailOut(NeedOut):
    fundraisers: List[FundraiserOut] = []

    class Config:
        from_attributes = True

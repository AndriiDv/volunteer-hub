from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Fundraiser(Base):
    __tablename__ = "fundraisers"

    id = Column(Integer, primary_key=True, index=True)
    need_id = Column(Integer, ForeignKey("needs.id", ondelete="CASCADE"), nullable=False)
    volunteer_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    jar_url = Column(String(500), nullable=False)  # Monobank / PrivatBank link
    goal_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), nullable=False, default="active")  # active | pending_verification | verified
    proof_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    need = relationship("Need", back_populates="fundraisers")
    volunteer = relationship("User", back_populates="fundraisers")

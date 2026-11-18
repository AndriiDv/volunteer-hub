from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Need(Base):
    __tablename__ = "needs"

    id = Column(Integer, primary_key=True, index=True)
    military_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # drones | ew | vehicles | medicine | gear
    target_amount = Column(Float, nullable=False)
    urgency = Column(String(50), nullable=False, default="medium")  # low | medium | critical
    status = Column(String(50), nullable=False, default="open")  # open | completed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    military_user = relationship("User", back_populates="needs")
    fundraisers = relationship("Fundraiser", back_populates="need", cascade="all, delete-orphan")

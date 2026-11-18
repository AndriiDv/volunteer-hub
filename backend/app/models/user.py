from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="volunteer")  # volunteer | military | admin
    unit_name = Column(String(255), nullable=True)  # for military
    is_verified = Column(Boolean, default=False, nullable=False)
    points = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    needs = relationship("Need", back_populates="military_user", cascade="all, delete-orphan")
    fundraisers = relationship("Fundraiser", back_populates="volunteer", cascade="all, delete-orphan")

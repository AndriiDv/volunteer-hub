from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/users/{id}/verify", response_model=UserOut)
def verify_user_account(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {id} not found."
        )

    user.is_verified = True
    db.commit()
    db.refresh(user)
    return user

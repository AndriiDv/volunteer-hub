from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.fundraiser import Fundraiser
from app.models.need import Need
from app.models.user import User
from app.schemas.fundraiser import FundraiserUpdate, FundraiserOut, FundraiserVerifyOut
from app.api.deps import get_current_user
from app.services.s3 import upload_proof_image

router = APIRouter(prefix="/fundraisers", tags=["Fundraisers"])

@router.patch("/{id}", response_model=FundraiserOut)
def update_fundraiser(
    id: int,
    update_in: FundraiserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fundraiser = db.query(Fundraiser).options(
        joinedload(Fundraiser.volunteer)
    ).filter(Fundraiser.id == id).first()

    if not fundraiser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fundraiser with id {id} not found."
        )

    # Permission check: must be owner or admin
    if fundraiser.volunteer_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this fundraiser."
        )

    if update_in.current_amount is not None:
        fundraiser.current_amount = update_in.current_amount
    if update_in.jar_url is not None:
        fundraiser.jar_url = update_in.jar_url

    db.commit()
    db.refresh(fundraiser)
    return fundraiser

@router.post("/{id}/proof", response_model=FundraiserOut)
async def upload_proof(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fundraiser = db.query(Fundraiser).options(
        joinedload(Fundraiser.volunteer)
    ).filter(Fundraiser.id == id).first()

    if not fundraiser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fundraiser with id {id} not found."
        )

    # Permission check: must be owner or admin
    if fundraiser.volunteer_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to upload proof for this fundraiser."
        )

    # Upload to AWS S3
    public_url = await upload_proof_image(file=file, fundraiser_id=id)

    fundraiser.proof_image_url = public_url
    fundraiser.status = "pending_verification"
    db.commit()
    db.refresh(fundraiser)
    return fundraiser

@router.post("/{id}/verify", response_model=FundraiserVerifyOut)
def verify_fundraiser(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fundraiser = db.query(Fundraiser).options(
        joinedload(Fundraiser.need),
        joinedload(Fundraiser.volunteer)
    ).filter(Fundraiser.id == id).first()

    if not fundraiser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fundraiser with id {id} not found."
        )

    parent_need = fundraiser.need
    if not parent_need:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent need not found."
        )

    # Permission check: must be military owner of the need or admin
    is_need_owner = (parent_need.military_user_id == current_user.id)
    is_admin = (current_user.role == "admin")
    if not is_need_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the military owner of this need or an admin can verify this fundraiser receipt."
        )

    if fundraiser.status == "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This fundraiser has already been verified."
        )

    # Calculate points: 1 point per 1,000 UAH verified, min 10 points
    awarded_points = max(10, int(fundraiser.current_amount / 1000))
    volunteer = fundraiser.volunteer
    if volunteer:
        volunteer.points += awarded_points

    # Update status to verified
    fundraiser.status = "verified"
    db.flush()

    # Recalculate total verified amount for the parent Need
    verified_jars = db.query(Fundraiser).filter(
        Fundraiser.need_id == parent_need.id,
        Fundraiser.status == "verified"
    ).all()
    
    total_verified = sum(j.current_amount for j in verified_jars)
    if total_verified >= parent_need.target_amount:
        parent_need.status = "completed"

    db.commit()
    db.refresh(fundraiser)
    db.refresh(parent_need)

    return {
        "message": "Fundraiser verified successfully.",
        "fundraiser": fundraiser,
        "awarded_points": awarded_points,
        "need_status": parent_need.status,
        "total_verified_amount": round(total_verified, 2),
        "target_amount": parent_need.target_amount
    }

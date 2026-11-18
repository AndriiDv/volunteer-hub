from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.need import Need
from app.models.fundraiser import Fundraiser
from app.models.user import User
from app.schemas.need import NeedCreate, NeedOut, NeedDetailOut
from app.schemas.fundraiser import FundraiserCreate, FundraiserOut
from app.api.deps import get_current_user, get_current_military, get_current_volunteer

router = APIRouter(prefix="/needs", tags=["Needs"])

def enrich_need_out(need: Need) -> dict:
    total_raised = sum(f.current_amount for f in need.fundraisers) if need.fundraisers else 0.0
    return {
        "id": need.id,
        "military_user_id": need.military_user_id,
        "military_user": need.military_user,
        "title": need.title,
        "description": need.description,
        "category": need.category,
        "target_amount": need.target_amount,
        "raised_amount": round(total_raised, 2),
        "urgency": need.urgency,
        "status": need.status,
        "fundraisers_count": len(need.fundraisers) if need.fundraisers else 0,
        "created_at": need.created_at,
    }

@router.get("", response_model=List[NeedOut])
def list_needs(
    category: Optional[str] = Query(None, description="Filter by category: drones | ew | vehicles | medicine | gear"),
    urgency: Optional[str] = Query(None, description="Filter by urgency: low | medium | critical"),
    status: Optional[str] = Query(None, description="Filter by status: open | completed"),
    db: Session = Depends(get_db)
):
    query = db.query(Need).options(
        joinedload(Need.military_user),
        joinedload(Need.fundraisers)
    )

    if category:
        query = query.filter(Need.category == category)
    if urgency:
        query = query.filter(Need.urgency == urgency)
    if status:
        query = query.filter(Need.status == status)

    needs = query.order_by(Need.created_at.desc()).all()
    return [enrich_need_out(n) for n in needs]

@router.get("/{id}", response_model=NeedDetailOut)
def get_need_by_id(id: int, db: Session = Depends(get_db)):
    need = db.query(Need).options(
        joinedload(Need.military_user),
        joinedload(Need.fundraisers).joinedload(Fundraiser.volunteer)
    ).filter(Need.id == id).first()

    if not need:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Need with id {id} not found."
        )

    enriched = enrich_need_out(need)
    enriched["fundraisers"] = need.fundraisers
    return enriched

@router.post("", response_model=NeedOut, status_code=status.HTTP_201_CREATED)
def create_need(
    need_in: NeedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_military)
):
    need = Need(
        military_user_id=current_user.id,
        title=need_in.title,
        description=need_in.description,
        category=need_in.category,
        target_amount=need_in.target_amount,
        urgency=need_in.urgency,
        status="open"
    )
    db.add(need)
    db.commit()
    db.refresh(need)
    
    # Reload with military_user
    need = db.query(Need).options(
        joinedload(Need.military_user),
        joinedload(Need.fundraisers)
    ).filter(Need.id == need.id).first()
    return enrich_need_out(need)

@router.post("/{need_id}/fundraisers", response_model=FundraiserOut, status_code=status.HTTP_201_CREATED)
def create_friendly_jar_for_need(
    need_id: int,
    fundraiser_in: FundraiserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_volunteer)
):
    need = db.query(Need).filter(Need.id == need_id).first()
    if not need:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Need with id {need_id} not found."
        )
    
    if need.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This need has already been fully completed."
        )

    fundraiser = Fundraiser(
        need_id=need_id,
        volunteer_user_id=current_user.id,
        jar_url=fundraiser_in.jar_url,
        goal_amount=fundraiser_in.goal_amount,
        current_amount=fundraiser_in.current_amount,
        status="active"
    )
    db.add(fundraiser)
    db.commit()
    db.refresh(fundraiser)
    
    # Reload with volunteer relationship
    fundraiser = db.query(Fundraiser).options(
        joinedload(Fundraiser.volunteer)
    ).filter(Fundraiser.id == fundraiser.id).first()
    return fundraiser

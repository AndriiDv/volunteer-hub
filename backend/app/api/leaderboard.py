from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User
from app.models.fundraiser import Fundraiser
from app.schemas.leaderboard import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    # Query all volunteers
    volunteers = db.query(User).filter(User.role == "volunteer").all()
    
    # Query verified fundraiser stats grouped by volunteer_user_id
    stats = db.query(
        Fundraiser.volunteer_user_id,
        func.coalesce(func.sum(Fundraiser.current_amount), 0.0).label("total_verified"),
        func.count(Fundraiser.id).label("verified_count")
    ).filter(
        Fundraiser.status == "verified"
    ).group_by(Fundraiser.volunteer_user_id).all()

    stats_map = {s[0]: (float(s[1]), int(s[2])) for s in stats}

    leaderboard = []
    for v in volunteers:
        total_raised, count = stats_map.get(v.id, (0.0, 0))
        leaderboard.append({
            "volunteer_id": v.id,
            "full_name": v.full_name,
            "points": v.points,
            "total_verified_raised": round(total_raised, 2),
            "verified_jars_count": count
        })

    # Sort primarily by total_verified_raised desc, secondarily by points desc
    leaderboard.sort(key=lambda x: (x["total_verified_raised"], x["points"]), reverse=True)

    # Assign ranks
    result = []
    for rank, item in enumerate(leaderboard, start=1):
        result.append(LeaderboardEntry(
            rank=rank,
            volunteer_id=item["volunteer_id"],
            full_name=item["full_name"],
            points=item["points"],
            total_verified_raised=item["total_verified_raised"],
            verified_jars_count=item["verified_jars_count"]
        ))

    return result

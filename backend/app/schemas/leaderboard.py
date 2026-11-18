from pydantic import BaseModel

class LeaderboardEntry(BaseModel):
    rank: int
    volunteer_id: int
    full_name: str
    points: int
    total_verified_raised: float
    verified_jars_count: int

    class Config:
        from_attributes = True

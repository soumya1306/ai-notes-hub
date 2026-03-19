from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user_id
from app.models.models import User
from app.schemas.schemas import UserSearchResult

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/search", response_model=list[UserSearchResult])
def search_users(
    q: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Search for users by email. Case-insensitive, partial matches allowed."""
    return (
        db.query(User)
        .filter(
            User.email.ilike(f"%{q}%"),
            User.id != user_id,
        )
        .limit(10)
        .all()
    )

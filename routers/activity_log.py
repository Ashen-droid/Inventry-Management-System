"""Activity Log router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db, ActivityLog, User
from services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/activity-log", tags=["Activity Log"])


@router.get("/")
def get_logs(
    limit:  int = Query(50, le=200),
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc())
    if action:
        q = q.filter(ActivityLog.action.ilike(f"%{action}%"))
    if user_id:
        q = q.filter(ActivityLog.user_id == user_id)
    logs = q.limit(limit).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat(),
            "user": log.user.username if log.user else "System",
        }
        for log in logs
    ]

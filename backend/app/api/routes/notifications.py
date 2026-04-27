from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.api.routes.auth import _get_current_user
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User

router = APIRouter()


# ── SQLAlchemy model ─────────────────────────────────────────────────────────

class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(String(512), nullable=False)
    notif_type = Column(String(100), nullable=False, default="general")
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    notif_type: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> list[NotificationModel]:
    return (
        db.query(NotificationModel)
        .filter(NotificationModel.user_id == current_user.id)
        .order_by(NotificationModel.created_at.desc())
        .limit(50)
        .all()
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> NotificationModel:
    notif = (
        db.query(NotificationModel)
        .filter(
            NotificationModel.id == notification_id,
            NotificationModel.user_id == current_user.id,
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.is_read = True  # type: ignore[assignment]
    db.commit()
    db.refresh(notif)
    return notif


@router.patch("/read-all", response_model=List[NotificationResponse])
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> list[NotificationModel]:
    db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.id,
        NotificationModel.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
    return (
        db.query(NotificationModel)
        .filter(NotificationModel.user_id == current_user.id)
        .order_by(NotificationModel.created_at.desc())
        .limit(50)
        .all()
    )

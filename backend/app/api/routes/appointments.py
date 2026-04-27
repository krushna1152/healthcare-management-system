from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.api.routes.auth import _get_current_user
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User

router = APIRouter()


# ── Inline SQLAlchemy model (kept here to avoid extra migration) ─────────────

class AppointmentModel(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(255), nullable=False)
    doctor_name = Column(String(255), nullable=False)
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), nullable=False, default="scheduled")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    patient_name: str
    doctor_name: str
    appointment_date: datetime


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    patient_name: str
    doctor_name: str
    appointment_date: datetime
    status: str

    model_config = {"from_attributes": True}


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    search: Optional[str] = Query(None, description="Search patient or doctor name"),
    appointment_status: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(_get_current_user),
) -> list[AppointmentModel]:
    q = db.query(AppointmentModel)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (AppointmentModel.patient_name.ilike(like))
            | (AppointmentModel.doctor_name.ilike(like))
        )
    if appointment_status:
        q = q.filter(AppointmentModel.status == appointment_status)
    return q.order_by(AppointmentModel.appointment_date).all()


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> AppointmentModel:
    appt = AppointmentModel(
        patient_name=payload.patient_name,
        doctor_name=payload.doctor_name,
        appointment_date=payload.appointment_date,
    )
    db.add(appt)
    db.flush()  # get appt.id before commit

    # Create an in-app notification reminder for the booking user
    from app.api.routes.notifications import NotificationModel  # local import to avoid circular
    notif = NotificationModel(
        user_id=current_user.id,
        message=f"Appointment booked with Dr. {payload.doctor_name} on "
                f"{payload.appointment_date.strftime('%d %b %Y %H:%M')}.",
        notif_type="appointment_reminder",
    )
    db.add(notif)
    db.commit()
    db.refresh(appt)
    return appt


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> AppointmentModel:
    appt = db.query(AppointmentModel).filter(AppointmentModel.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if payload.status is not None:
        appt.status = payload.status  # type: ignore[assignment]
        if payload.status == "cancelled":
            from app.api.routes.notifications import NotificationModel
            notif = NotificationModel(
                user_id=current_user.id,
                message=f"Appointment with Dr. {appt.doctor_name} has been cancelled.",
                notif_type="appointment_cancelled",
            )
            db.add(notif)
    db.commit()
    db.refresh(appt)
    return appt

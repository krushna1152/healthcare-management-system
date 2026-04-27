from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.routes.appointments import AppointmentModel, AppointmentResponse
from app.api.routes.auth import _get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserResponse

router = APIRouter()


def _require_doctor_or_admin(current_user: User = Depends(_get_current_user)) -> User:
    if current_user.role not in (UserRole.doctor, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to doctors and admins",
        )
    return current_user


class PatientSummary(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


@router.get("/patients", response_model=List[PatientSummary])
def list_patients(
    db: Session = Depends(get_db),
    _current_user: User = Depends(_require_doctor_or_admin),
) -> list[User]:
    return db.query(User).filter(User.role == UserRole.patient).order_by(User.email).all()


@router.get("/appointments", response_model=List[AppointmentResponse])
def doctor_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_doctor_or_admin),
) -> list[AppointmentModel]:
    """
    Returns appointments where doctor_name contains the doctor's name or email.
    Falls back to all appointments so the dashboard is always populated.
    """
    name_hint = current_user.full_name or current_user.email
    results = (
        db.query(AppointmentModel)
        .filter(AppointmentModel.doctor_name.ilike(f"%{name_hint}%"))
        .order_by(AppointmentModel.appointment_date)
        .all()
    )
    # If no personalised results, return all appointments so the view is useful
    if not results:
        results = (
            db.query(AppointmentModel)
            .order_by(AppointmentModel.appointment_date)
            .all()
        )
    return results

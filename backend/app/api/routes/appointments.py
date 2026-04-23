from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.routes.auth import _get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import PatientProfile
from app.models.doctor import DoctorProfile
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter()


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> Appointment:
    patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Create a patient profile first")
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=payload.doctor_id,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> List[Appointment]:
    if current_user.role == UserRole.admin:
        return db.query(Appointment).all()
    if current_user.role == UserRole.doctor:
        doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if not doctor:
            return []
        return db.query(Appointment).filter(Appointment.doctor_id == doctor.id).all()
    # patient
    patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not patient:
        return []
    return db.query(Appointment).filter(Appointment.patient_id == patient.id).all()


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    _assert_appointment_access(appointment, current_user, db)
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    _assert_appointment_access(appointment, current_user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> None:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    _assert_appointment_access(appointment, current_user, db)
    appointment.status = AppointmentStatus.cancelled
    db.commit()


def _assert_appointment_access(appointment: Appointment, current_user: User, db: Session) -> None:
    if current_user.role == UserRole.admin:
        return
    if current_user.role == UserRole.doctor:
        doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if doctor and appointment.doctor_id == doctor.id:
            return
    else:
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if patient and appointment.patient_id == patient.id:
            return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

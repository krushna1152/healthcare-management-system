from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.routes.auth import _get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.doctor import DoctorProfile
from app.schemas.doctor import DoctorProfileCreate, DoctorProfileUpdate, DoctorProfileResponse

router = APIRouter()


@router.post("", response_model=DoctorProfileResponse, status_code=status.HTTP_201_CREATED)
def create_doctor_profile(
    payload: DoctorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> DoctorProfile:
    if current_user.role not in (UserRole.doctor, UserRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors or admins can create a doctor profile")
    existing = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Doctor profile already exists")
    profile = DoctorProfile(user_id=current_user.id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=List[DoctorProfileResponse])
def list_doctors(db: Session = Depends(get_db)) -> List[DoctorProfile]:
    return db.query(DoctorProfile).all()


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)) -> DoctorProfile:
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return profile


@router.put("/{doctor_id}", response_model=DoctorProfileResponse)
def update_doctor(
    doctor_id: int,
    payload: DoctorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> DoctorProfile:
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    if current_user.role != UserRole.admin and profile.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.routes.auth import _get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.schemas.patient import PatientProfileCreate, PatientProfileUpdate, PatientProfileResponse

router = APIRouter()


@router.post("", response_model=PatientProfileResponse, status_code=status.HTTP_201_CREATED)
def create_patient_profile(
    payload: PatientProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> PatientProfile:
    existing = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient profile already exists")
    profile = PatientProfile(user_id=current_user.id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=List[PatientProfileResponse])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> List[PatientProfile]:
    if current_user.role not in (UserRole.doctor, UserRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return db.query(PatientProfile).all()


@router.get("/me", response_model=PatientProfileResponse)
def get_my_patient_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> PatientProfile:
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")
    return profile


@router.get("/{patient_id}", response_model=PatientProfileResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> PatientProfile:
    if current_user.role not in (UserRole.doctor, UserRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return profile


@router.put("/me", response_model=PatientProfileResponse)
def update_my_patient_profile(
    payload: PatientProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> PatientProfile:
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile

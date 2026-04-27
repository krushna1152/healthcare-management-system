import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.api.routes.auth import _get_current_user
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User, UserRole

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads" / "medical_records"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
}


# ── SQLAlchemy model ─────────────────────────────────────────────────────────

class MedicalRecordModel(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(512), nullable=True)
    file_type = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class MedicalRecordResponse(BaseModel):
    id: int
    patient_id: int
    title: str
    description: Optional[str]
    file_name: Optional[str]
    file_type: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[MedicalRecordResponse])
def list_medical_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> list[MedicalRecordModel]:
    q = db.query(MedicalRecordModel)
    # Doctors and admins can see all records; patients see only their own
    if current_user.role == UserRole.patient:
        q = q.filter(MedicalRecordModel.patient_id == current_user.id)
    return q.order_by(MedicalRecordModel.created_at.desc()).all()


@router.post("/", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_medical_record(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> MedicalRecordModel:
    file_name = None
    file_path_str = None
    file_type = None

    if file and file.filename:
        if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{file.content_type}' is not allowed. Allowed: PDF, images, plain text.",
            )
        ext = Path(file.filename).suffix
        stored_name = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOAD_DIR / stored_name
        contents = await file.read()
        dest.write_bytes(contents)
        file_name = file.filename
        file_path_str = str(dest)
        file_type = file.content_type

    record = MedicalRecordModel(
        patient_id=current_user.id,
        title=title,
        description=description,
        file_name=file_name,
        file_path=file_path_str,
        file_type=file_type,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}/download")
def download_medical_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_get_current_user),
) -> FileResponse:
    record = db.query(MedicalRecordModel).filter(MedicalRecordModel.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    # Patients may only download their own records
    if current_user.role == UserRole.patient and record.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if not record.file_path or not os.path.exists(str(record.file_path)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")
    return FileResponse(
        path=str(record.file_path),
        filename=str(record.file_name or "download"),
        media_type=str(record.file_type or "application/octet-stream"),
    )

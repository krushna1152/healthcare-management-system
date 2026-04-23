from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    doctor_id: int
    scheduled_at: datetime
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    scheduled_at: datetime
    status: AppointmentStatus
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

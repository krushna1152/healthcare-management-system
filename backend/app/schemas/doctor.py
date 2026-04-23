from datetime import date
from typing import Optional

from pydantic import BaseModel


class DoctorProfileCreate(BaseModel):
    first_name: str
    last_name: str
    specialization: str
    phone: Optional[str] = None
    bio: Optional[str] = None


class DoctorProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None


class DoctorProfileResponse(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    specialization: str
    phone: Optional[str] = None
    bio: Optional[str] = None

    model_config = {"from_attributes": True}

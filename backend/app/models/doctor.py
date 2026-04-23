from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    specialization = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)

    user = relationship("User", backref="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")

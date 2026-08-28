from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(String, primary_key=True)  # client-generated UUID, not auto-default
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    severity_grade = Column(Integer, nullable=True)       # 0-4, or null if uncertain
    confidence_score = Column(Float, nullable=True)
    is_uncertain = Column(Boolean, default=False)
    image_path = Column(String, nullable=True)
    gradcam_path = Column(String, nullable=True)
    device_id = Column(String, nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow)
    synced_at = Column(DateTime, nullable=True)
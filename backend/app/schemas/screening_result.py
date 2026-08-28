from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ScreeningResultCreate(BaseModel):
    id: str  
    patient_id: str
    severity_grade: Optional[int] = None
    confidence_score: Optional[float] = None
    is_uncertain: bool = False
    device_id: Optional[str] = None


class ScreeningResultOut(BaseModel):
    id: str
    patient_id: str
    severity_grade: Optional[int] = None
    confidence_score: Optional[float] = None
    is_uncertain: bool
    image_path: Optional[str] = None
    gradcam_path: Optional[str] = None
    device_id: Optional[str] = None
    captured_at: datetime
    synced_at: Optional[datetime] = None

    class Config:
        from_attributes = True
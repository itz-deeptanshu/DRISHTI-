from pydantic import BaseModel
from datetime import datetime


class ReferralOut(BaseModel):
    id: str
    screening_result_id: str
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True


class ReferralStatusUpdate(BaseModel):
    status: str
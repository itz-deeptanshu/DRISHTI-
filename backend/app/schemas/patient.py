from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PatientCreate(BaseModel):
    name:str
    age: Optional[int] = None
    village: Optional[str] = None

class PatientOut(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    village: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
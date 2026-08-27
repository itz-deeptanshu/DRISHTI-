from sqlalchemy import Column, String, Integer, DateTime
from datetime import datetime
import uuid
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    village = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
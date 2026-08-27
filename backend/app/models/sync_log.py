from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.database import Base

class SyncLog(Base):
    __tablename__ = "sync_log"

    id = Column(String, primary_key=True, default=lambda: __import__("uuid").uuid4().__str__())
    device_id = Column(String, nullable=True)
    screening_result_id = Column(String, nullable=False)
    sync_status = Column(String)  # success / failed
    attempted_at = Column(DateTime, default=datetime.utcnow)
from sqlalchemy import Column, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String, primary_key=True, default=lambda: __import__("uuid").uuid4().__str__())
    screening_result_id = Column(String, ForeignKey("screening_results.id"), nullable=False)
    status = Column(String, default="screened")  # screened / referred / confirmed / completed
    updated_at = Column(DateTime, default=datetime.utcnow)
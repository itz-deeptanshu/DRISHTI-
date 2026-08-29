from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.screening_result import ScreeningResult
from app.models.referral import Referral
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_screenings = db.query(ScreeningResult).count()

    severity_counts = {}
    for grade in range(5):
        count = db.query(ScreeningResult).filter(ScreeningResult.severity_grade == grade).count()
        severity_counts[str(grade)] = count

    uncertain_count = db.query(ScreeningResult).filter(ScreeningResult.is_uncertain == True).count()

    total_referrals = db.query(Referral).count()
    completed_referrals = db.query(Referral).filter(Referral.status == "completed").count()

    referral_completion_rate = (
        round(completed_referrals / total_referrals, 3) if total_referrals > 0 else 0.0
    )

    return DashboardSummary(
        total_screenings=total_screenings,
        severity_counts=severity_counts,
        uncertain_count=uncertain_count,
        total_referrals=total_referrals,
        completed_referrals=completed_referrals,
        referral_completion_rate=referral_completion_rate,
    )
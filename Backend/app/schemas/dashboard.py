from pydantic import BaseModel
from typing import Dict


class DashboardSummary(BaseModel):
    total_screenings: int
    severity_counts: Dict[str,int]
    uncertain_count: int
    total_referrals: int
    completed_referrals: int
    referral_completion_rate: float
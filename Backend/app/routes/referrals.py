from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.referral import Referral
from app.models.screening_result import ScreeningResult
from app.schemas.referral import ReferralOut, ReferralStatusUpdate
from app.services.referral_logic import is_valid_transition, get_next_allowed_status

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.get("/{screening_id}", response_model=ReferralOut)
def get_referral(screening_id: str, db: Session = Depends(get_db)):
    referral = db.query(Referral).filter(Referral.screening_result_id == screening_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


@router.patch("/{screening_id}", response_model=ReferralOut)
def update_referral_status(
    screening_id: str, update: ReferralStatusUpdate, db: Session = Depends(get_db)
):
    referral = db.query(Referral).filter(Referral.screening_result_id == screening_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    if not is_valid_transition(referral.status, update.status):
        next_allowed = get_next_allowed_status(referral.status)
        raise HTTPException(
            status_code=422,
            detail=(
                f"Invalid transition from '{referral.status}' to '{update.status}'. "
                f"Next allowed status is '{next_allowed}'."
                if next_allowed
                else f"'{referral.status}' is a final status; no further transitions allowed."
            ),
        )

    referral.status = update.status
    db.commit()
    db.refresh(referral)
    return referral


@router.get("/", response_model=list[ReferralOut])
def list_high_priority_referrals(db: Session = Depends(get_db)):
    # Join with screening_results to find severe or uncertain cases still not completed
    results = (
        db.query(Referral)
        .join(ScreeningResult, Referral.screening_result_id == ScreeningResult.id)
        .filter(
            (ScreeningResult.severity_grade >= 3) | (ScreeningResult.is_uncertain == True),
            Referral.status != "completed",
        )
        .all()
    )
    return results
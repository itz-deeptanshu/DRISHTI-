from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import get_db
from app.models.patient import Patient
from app.models.screening_result import ScreeningResult
from app.models.referral import Referral
from app.models.sync_log import SyncLog
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse, SyncItemResult

router = APIRouter(prefix="/screenings", tags=["sync"])


@router.post("/sync", response_model=SyncBatchResponse)
def sync_screenings(batch: SyncBatchRequest, db: Session = Depends(get_db)):
    item_results = []
    inserted_count = 0
    already_synced_count = 0
    failed_count = 0

    for item in batch.results:
        existing = db.query(ScreeningResult).filter(ScreeningResult.id == item.id).first()
        if existing:
            already_synced_count += 1
            item_results.append(SyncItemResult(id=item.id, status="already_synced"))
            _log_attempt(db, batch.device_id, item.id, "already_synced")
            continue

        patient = db.query(Patient).filter(Patient.id == item.patient_id).first()
        if not patient:
            failed_count += 1
            item_results.append(
                SyncItemResult(id=item.id, status="failed", detail="Patient not found")
            )
            _log_attempt(db, batch.device_id, item.id, "failed")
            continue

        if item.severity_grade is not None and not (0 <= item.severity_grade <= 4):
            failed_count += 1
            item_results.append(
                SyncItemResult(id=item.id, status="failed", detail="severity_grade must be between 0 and 4")
            )
            _log_attempt(db, batch.device_id, item.id, "failed")
            continue

        new_result = ScreeningResult(
            id=item.id,
            patient_id=item.patient_id,
            severity_grade=item.severity_grade,
            confidence_score=item.confidence_score,
            is_uncertain=item.is_uncertain,
            image_path=item.image_path,
            device_id=item.device_id,
            synced_at=datetime.utcnow(),
        )
        db.add(new_result)

        new_referral = Referral(
            id=str(uuid.uuid4()),
            screening_result_id=item.id,
            status="screened",
        )
        db.add(new_referral)

        inserted_count += 1
        item_results.append(SyncItemResult(id=item.id, status="inserted"))
        _log_attempt(db, batch.device_id, item.id, "success")

    db.commit()

    return SyncBatchResponse(
        total_received=len(batch.results),
        inserted=inserted_count,
        already_synced=already_synced_count,
        failed=failed_count,
        items=item_results,
    )


def _log_attempt(db: Session, device_id: str, screening_result_id: str, status: str):
    log_entry = SyncLog(
        device_id=device_id,
        screening_result_id=screening_result_id,
        sync_status=status,
    )
    db.add(log_entry)
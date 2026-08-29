import os
import uuid
import shutil

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.screening_result import ScreeningResult
from app.models.referral import Referral
from app.schemas.screening_result import ScreeningResultOut
from app.services.inference import run_inference

router = APIRouter(prefix="/screenings", tags=["screenings"])

UPLOAD_DIR = "uploads/images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_MB = 10


@router.post("/", response_model=ScreeningResultOut)
def create_screening(
    id: str = Form(...),
    patient_id: str = Form(...),
    device_id: str = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    existing = db.query(ScreeningResult).filter(ScreeningResult.id == id).first()
    if existing:
        return existing

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    file_ext = os.path.splitext(image.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type '{file_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    image.file.seek(0, os.SEEK_END)
    file_size_mb = image.file.tell() / (1024 * 1024)
    image.file.seek(0)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=422, detail=f"File too large ({file_size_mb:.1f}MB). Max {MAX_FILE_SIZE_MB}MB.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_filename = f"{id}{file_ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save image file")

    prediction = run_inference(saved_path, id)

    new_result = ScreeningResult(
        id=id,
        patient_id=patient_id,
        severity_grade=prediction["severity_grade"],
        confidence_score=prediction["confidence_score"],
        is_uncertain=prediction["is_uncertain"],
        device_id=device_id,
        image_path=saved_path.replace("\\", "/"),
        gradcam_path=prediction["heatmap_path"],
    )
    db.add(new_result)

    new_referral = Referral(
        id=str(uuid.uuid4()),
        screening_result_id=id,
        status="screened",
    )
    db.add(new_referral)

    db.commit()
    db.refresh(new_result)
    return new_result


@router.get("/{patient_id}", response_model=list[ScreeningResultOut])
def get_patient_screenings(patient_id: str, db: Session = Depends(get_db)):
    results = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.patient_id == patient_id)
        .order_by(ScreeningResult.captured_at.desc())
        .all()
    )
    return results
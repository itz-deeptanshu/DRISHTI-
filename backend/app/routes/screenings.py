import os
import uuid
import shutil

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.screening_result import ScreeningResult
from app.schemas.screening_result import ScreeningResultOut

router = APIRouter(prefix="/screenings", tags=["screenings"])

UPLOAD_DIR = "uploads/images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_MB = 10


@router.post("/", response_model=ScreeningResultOut)
def create_screening(
    id: str = Form(...),
    patient_id: str = Form(...),
    severity_grade: int = Form(None),
    confidence_score: float = Form(None),
    is_uncertain: bool = Form(False),
    device_id: str = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # 1. Idempotency check — same as Day 2, unchanged in spirit
    existing = db.query(ScreeningResult).filter(ScreeningResult.id == id).first()
    if existing:
        return existing

    # 2. Patient must exist — same as Day 2's fix
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 3. Validate severity_grade range — same as Day 2
    if severity_grade is not None and not (0 <= severity_grade <= 4):
        raise HTTPException(status_code=422, detail="severity_grade must be between 0 and 4")

    # 4. Validate the uploaded file's extension
    file_ext = os.path.splitext(image.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type '{file_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # 5. Validate file size before saving
    image.file.seek(0, os.SEEK_END)
    file_size_mb = image.file.tell() / (1024 * 1024)
    image.file.seek(0)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=422, detail=f"File too large ({file_size_mb:.1f}MB). Max {MAX_FILE_SIZE_MB}MB.")

    # 6. Save the file to disk, named after the screening result's own id
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_filename = f"{id}{file_ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save image file")

    # 7. Only now, after the file is safely saved, create the database row
    new_result = ScreeningResult(
        id=id,
        patient_id=patient_id,
        severity_grade=severity_grade,
        confidence_score=confidence_score,
        is_uncertain=is_uncertain,
        device_id=device_id,
        image_path=saved_path.replace("\\", "/"),
    )
    db.add(new_result)
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
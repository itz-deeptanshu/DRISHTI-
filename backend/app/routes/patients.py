from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("/", response_model=PatientOut)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    new_patient = Patient(
        id=str(uuid.uuid4()),
        name=patient.name,
        age=patient.age,
        village=patient.village,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/", response_model=list[PatientOut])
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()
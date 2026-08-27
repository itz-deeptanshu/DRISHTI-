from fastapi import FastAPI
from app.database import Base, engine
from app.models import patient, screening_result, referral, sync_log

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DR Screening Backend")

@app.get("/")
def read_root():
    return {"status": "ok"}
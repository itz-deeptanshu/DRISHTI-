from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.models import patient, screening_result, referral, sync_log
from app.routes import patients, screenings

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DR Screening Backend")

app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.include_router(patients.router)
app.include_router(screenings.router)


@app.get("/")
def read_root():
    return {"status": "ok"}
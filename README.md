# Explainable AI for Diabetic Retinopathy Screening in Rural India

**SIH26038** — A full-stack, explainable AI system that grades diabetic retinopathy severity from a retinal photo, visually explains its reasoning via Grad-CAM, and tracks each flagged patient through a referral lifecycle  built to be operated by a health worker with no medical training.

---

## Table of Contents

- [The Problem](#the-problem)
- [What This Project Actually Does](#what-this-project-actually-does)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [ML: Model, Training & Explainability](#ml-model-training--explainability)
- [Backend](#backend)
- [Frontend](#frontend)
- [Real, Verified Metrics](#real-verified-metrics)
- [Known Limitations — Stated Honestly](#known-limitations--stated-honestly)
- [Setup & Local Development](#setup--local-development)
- [API Reference (Summary)](#api-reference-summary)
- [Project Structure](#project-structure)
- [Roadmap / Next Steps](#roadmap--next-steps)
- [Existing Solutions & Where This Differs](#existing-solutions--where-this-differs)
- [Team](#team)

---

## The Problem

India has over 77 million diabetic adults, the second highest number globally. Diabetic Retinopathy (DR) affects roughly 18% of this population and is a leading cause of preventable blindness. Early screening can prevent up to 90% of vision loss, but India has only about **1 ophthalmologist per 100,000 rural population**, making mass manual screening infeasible.

Existing AI screening tools often function as black boxes, offer no visual explanation a non-specialist can trust, and struggle with the variable image quality produced by low-cost, portable fundus cameras in real field conditions.

## What This Project Actually Does

1. A health worker captures or uploads a retinal (fundus) photo through the app
2. The image is preprocessed (cropped, contrast-enhanced) and passed to a trained CNN
3. The model returns a 5-class DR severity grade, a confidence score, and when confidence is too low, flags the result as **uncertain** instead of forcing a guess
4. A **Grad-CAM heatmap** is generated, visually showing which regions of the image drove the prediction
5. A **referral** is automatically created and tracked through a defined lifecycle (`screened → referred → confirmed → completed`)
6. Aggregate results feed a **dashboard**, including referral completion rate a public-health metric, not just a detection count

Every piece described above is built, deployed, and independently verified working end-to-end including by an external device over mobile data, not just localhost.

## System Architecture

```
┌─────────────┐      HTTPS       ┌──────────────┐      Python call     ┌──────────────┐
│   Frontend   │ ───────────────▶ │   Backend    │ ───────────────────▶ │  ML Inference │
│  React + TS  │ ◀─────────────── │   FastAPI    │ ◀───────────────────  │  PyTorch/timm │
│  (Vercel)    │   JSON / files   │  (SQLite)    │    grade + heatmap    │  EfficientNet │
└─────────────┘                  └──────────────┘                      └──────────────┘
```

Data flow for one screening:

```
Capture → Quality Preprocessing (CLAHE) → Model Inference → Grad-CAM →
Result stored + Referral auto-created → Synced to dashboard
```

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| ML | Python, PyTorch, timm | Grad-CAM implementation is more mature and direct in PyTorch (hook-based access to gradients/activations) than TensorFlow/Keras — chosen deliberately since explainability is the core requirement of this problem statement |
| Model | EfficientNet-B0 (transfer learning) | Small (~5M params), fast to fine-tune, light enough for a future mobile export path, no meaningful accuracy loss vs. larger backbones at this dataset scale |
| Explainability | Grad-CAM | Requires no architecture changes to an already-trained model; well-established, peer-reviewed technique (Selvaraju et al.) |
| Preprocessing | OpenCV (crop-to-circle + CLAHE) | Removes irrelevant background; CLAHE adaptively corrects for the uneven lighting/quality common in low-cost fundus camera captures |
| Backend | FastAPI, SQLAlchemy, SQLite | FastAPI runs in the same Python process as the model — no network hop between backend and ML; SQLAlchemy ORM makes a future PostgreSQL migration a config change, not a rewrite; SQLite is a zero-infrastructure fit for lightweight PHC deployment |
| Auth | bcrypt (via passlib), API key headers | Passwords are hashed, never stored in plain text; doctor accounts are real, backend-verified credentials, not device-local fakes |
| Frontend | React, TypeScript, Vite | Type safety catches data-shape mismatches against the backend contract at compile time; Vite's fast dev/reload suited rapid iteration across multiple integration rounds |
| Deployment (prototype) | Vercel (frontend) + secure tunnel to backend | Public, testable link without requiring cloud infra investment at prototype stage |

## ML: Model, Training & Explainability

- **Datasets:** APTOS 2019 and EyePACS for training; **IDRiD** held out exclusively for Grad-CAM explainability validation (pixel-level lesion ground truth), never used for training — kept strictly separate so validation is meaningful
- **Architecture:** EfficientNet-B0, ImageNet-pretrained, fine-tuned for 5-class DR severity (No DR → Proliferative)
- **Class imbalance handling:** class-weighted loss / oversampling, since DR datasets skew heavily toward "No DR" — addressed specifically because under-flagging real disease is the costly failure mode in a screening tool
- **Uncertainty handling:** predictions below a tuned confidence threshold return `severity_grade: null` and no heatmap, rather than a low-confidence number that could be mistaken for a confident result
- **Explainability validation:** Grad-CAM heatmaps compared against IDRiD's real lesion masks — the result is reported honestly (see [Real, Verified Metrics](#real-verified-metrics)), including where it currently underperforms

## Backend

- Full CRUD for patients, screenings, referrals, and doctor accounts
- Real image upload with file-type/size validation
- **Idempotent bulk sync** (`POST /screenings/sync`) — offline-queued results can be safely resubmitted without creating duplicates; verified by submitting the same batch twice and confirming zero duplicate rows
- **Referral state machine** — status can only progress `screened → referred → confirmed → completed`, one step at a time; invalid transitions are rejected with a clear error naming the correct next state
- **Live model transparency** — `GET /model-info/` serves the model's real, currently-evaluated metrics from a JSON file, read fresh on every request
- **Real authentication** — doctor accounts are registered and verified against the database with bcrypt-hashed passwords; API-key protection on all write endpoints

## Frontend

- Full capture → analyze → result flow, calling the real backend (not mock data)
- Grad-CAM heatmap displayed directly over the captured image
- Doctor login/registration against real backend accounts; patient lookup against real backend records (no fabricated fallback data)
- Referral status view and dashboard with live aggregate numbers
- Deployed publicly, verified reachable and functional from an independent device over mobile data

## Real, Verified Metrics

These are read live from the running system's `/model-info/` endpoint — not slide claims.

| Metric | Value | Why this metric |
|---|---|---|
| Quadratic Weighted Kappa | **0.7635** | DR severity is ordinal — QWK penalizes a 3-grade miss far more than a 1-grade miss, unlike raw accuracy |
| Per-class recall — No DR | 87.8% | |
| Per-class recall — Mild | 53.6% | |
| Per-class recall — Moderate | 33.3% | Known, disclosed weakest class — a middle grade inherently harder to separate from its neighbors |
| Per-class recall — Severe | 51.7% | |
| Per-class recall — Proliferative | 54.5% | |
| Confidence threshold | 0.5 | Tuned via a real coverage/accuracy sweep (0.3–0.7); 87.5% coverage, 70.3% accuracy among confident predictions at this value |
| Grad-CAM / IDRiD lesion overlap | 26.5% recall vs **25.2%** empirical random baseline | Honestly reported — current explainability localization is close to chance-level on the sample tested; disclosed rather than hidden |

## Known Limitations — Stated Honestly

- **Requires connectivity end-to-end today.** The offline-first *data layer* is built (client-generated IDs, idempotent sync), but full on-device inference is a defined next step, not yet complete.
- **Grad-CAM localization is not yet strongly validated** against ground truth — see the table above. The mechanism works and produces real heatmaps; whether those heatmaps reliably point at true lesions is still an open, disclosed question.
- **Per-class recall is uneven**, particularly for Moderate DR (33.3%).
- **This is a screening/triage tool, not a diagnostic one.** Every flagged case is intended for review by a qualified clinician before any treatment decision — the model's job is to get the right patients in front of a doctor sooner, not to replace clinical judgment.
- **No formal clinical validation** (prospective testing with practicing ophthalmologists, inter-rater reliability studies, regulatory review) has been conducted. Statistical validation against labeled datasets is not the same as clinical validation.

## Setup & Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1        # Windows
# source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file in the backend root:
```
API_KEY=your-api-key-here
```

Run the server:
```bash
uvicorn app.main:app --reload
```
Visit `http://127.0.0.1:8000/docs` for interactive API documentation.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend root:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_API_KEY=your-api-key-here
```

Run the dev server:
```bash
npm run dev
```

### ML Model File

Place the trained model weights at `backend/app/ml/best_model.pth`. This file is required for the backend to start — `app/inference.py` loads it at server startup.

## API Reference (Summary)

Full details, request/response shapes, and integration notes: see [`API_REFERENCE.md`](./API_REFERENCE.md).

| Endpoint | Method | Purpose |
|---|---|---|
| `/patients/` | POST, GET | Create / list patients |
| `/patients/{id}` | GET | Fetch a single patient |
| `/screenings/` | POST | Submit a screening (image + patient) — runs real inference |
| `/screenings/{patient_id}` | GET | Fetch a patient's screening history |
| `/screenings/sync` | POST | Idempotent bulk sync for offline-queued results |
| `/referrals/{screening_id}` | GET, PATCH | View / update referral status |
| `/referrals/` | GET | List active high-priority referrals |
| `/dashboard/summary` | GET | Aggregate stats |
| `/model-info/` | GET | Live, real model evaluation metrics |
| `/doctors/register` | POST | Register a clinician account |
| `/doctors/login` | POST | Clinician login |

All write endpoints require an `X-API-Key` header.

## Project Structure

```
backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── inference.py            # real model inference (loaded once at startup)
│   ├── model_metrics.json      # live-served evaluation metrics
│   ├── config.py / auth.py     # API key auth
│   ├── ml/best_model.pth       # trained model weights
│   ├── models/                 # SQLAlchemy table definitions
│   ├── schemas/                # Pydantic request/response shapes
│   ├── routes/                 # API endpoints
│   └── services/                # inference wrapper, referral state machine
├── requirements.txt
└── .env

frontend/
├── src/
│   ├── api/client.ts            # all backend calls
│   ├── context/ScreeningContext.tsx
│   ├── pages/                   # Login, Capture, Analyzing, Result, Dashboard, etc.
│   ├── components/
│   └── types.ts
├── package.json
└── .env
```

## Roadmap / Next Steps

- On-device model export (TFLite/ONNX) for true offline inference
- Larger-sample Grad-CAM/IDRiD validation, with a coordinate-alignment audit
- Retinal structure segmentation (microaneurysm, vessel, exudate detection) as a distinct model alongside the existing classifier
- Formal sensitivity/specificity reporting for referable DR (Level 2+), benchmarked against clinical thresholds
- Migration to PostgreSQL and containerized cloud deployment for production scale
- Multi-language UI support for regional deployment

## Existing Solutions & Where This Differs

Real, deployed solutions already exist in this space, and this project was built with awareness of them, not in a vacuum:

- **Remidio Medios AI** — CDSCO-approved, offline DR screening deployed across rural India since 2018
- **MadhuNetrAI** (AIIMS Dr. RP Centre / AFMS) — national pilot launched December 2025

This project does not claim to outperform these regulator-approved, clinically-validated products on raw accuracy. Where it focuses differently: an explainability layer validated (and honestly reported) against real pixel-level lesion ground truth, and referral-completion tracking as a first-class dashboard metric — neither of which appears to be a published, central feature of the solutions above.

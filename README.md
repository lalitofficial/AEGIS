# Aegis

Fraud detection platform with a FastAPI backend and a React/Vite frontend.

## Repo structure
- `backend/`: FastAPI API, ML models, database layer, and tests.
- `frontend/`: React/Vite frontend for dashboards and monitoring.

## Quick start

### Backend
1. `cd backend`
2. `cp .env.example .env`
3. `python -m venv .venv && source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Configuration
Backend settings live in `backend/.env` (see `backend/.env.example` for defaults).

## Notes
- This repo is meant to be a single Git repository with `backend/` and `frontend/` as subfolders.
# AEGIS

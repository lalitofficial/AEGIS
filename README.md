# Aegis

Fraud detection platform with a FastAPI API and a React/Vite frontend.

## Repo structure
- `api/`: FastAPI API, ML models, database layer, and tests.
- `frontend/`: React/Vite frontend for dashboards and monitoring.

## Quick start

### API
1. `cd api`
2. `cp .env.example .env`
3. `python -m venv .venv && source .venv/bin/activate`
4. `pip install -r ../requirements.txt`
5. `uvicorn app.main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Docker (recommended)
1. `docker compose up --build`
2. Frontend: `http://localhost:3000`
3. API: `http://localhost:8000`

## Docker (dev workflow)
1. `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
2. Frontend (Vite dev): `http://localhost:3000`
3. API (reload): `http://localhost:8000`

## Configuration
API settings live in `api/.env` (see `api/.env.example` for defaults).

## Notes
- This repo is meant to be a single Git repository with `api/` and `frontend/` as subfolders.

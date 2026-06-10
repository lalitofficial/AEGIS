# AEGIS API

FastAPI backend for the AEGIS fraud detection platform: REST API, ML scoring models, graph intelligence, and the PostgreSQL data layer.

## Stack

- **FastAPI** + Uvicorn, **SQLAlchemy 2** ORM, **PostgreSQL** (SQLite supported for tests)
- **scikit-learn** gradient boosting for fraud scoring, **PyTorch** GNN for graph analysis, **networkx** for ring detection
- **Loguru** structured logging, **Ruff** lint/format, **pytest** test suite

## Getting started

```bash
cd api
cp .env.example .env          # adjust values as needed
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Interactive docs: http://localhost:8000/docs

Seed demo data (requires a reachable database):

```bash
python seed_data.py
```

## Configuration

All settings are read from environment variables (or `api/.env`, see `.env.example`):

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | — (required) | SQLAlchemy URL, e.g. `postgresql://user:pass@localhost:5432/aegis_db` |
| `SECRET_KEY` | — (required) | JWT signing key; use a long random value in production |
| `API_KEY` | — (required) | Static key clients must send in `X-API-Key` |
| `DEBUG` | `False` | Enables auto-reload when running `python -m app.main` |
| `ALLOWED_ORIGINS` | localhost:3000,5173 | Comma-separated CORS origins |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT lifetime |
| `MODEL_PATH` | `./data/models` | Where trained model artifacts are loaded from |
| `FRAUD_DETECTION_THRESHOLD` | `0.75` | Probability above which a transaction is flagged |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | — | Seed admin credentials used by `seed_data.py` |

## Authentication

Two layers:

1. **API key** — every route under `/api/v1` requires the `X-API-Key` header.
2. **JWT** — user-scoped actions (e.g. updating alert status) additionally require a Bearer token from `POST /api/v1/auth/login`. Role checks (`analyst`, `admin`) are enforced per route.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness probe (no auth) |
| POST | `/api/v1/auth/login` | Email/password login, returns JWT |
| GET | `/api/v1/auth/me` | Current user (JWT) |
| GET | `/api/v1/fraud/alerts` | Recent fraud alerts |
| POST | `/api/v1/fraud/analyze` | Score a transaction for fraud |
| PATCH | `/api/v1/fraud/alerts/{id}/status` | Update alert status (analyst/admin) |
| GET | `/api/v1/dashboard/metrics` | KPI metrics |
| GET | `/api/v1/dashboard/fraud-trends` | 24h fraud trend buckets |
| GET | `/api/v1/risk/profiles` | Customer risk profiles |
| GET | `/api/v1/risk/distribution` | Risk level distribution |
| GET | `/api/v1/accounts/monitored` | Monitored account summary |
| GET | `/api/v1/compliance/frameworks` | Compliance framework scores |
| GET | `/api/v1/graph/data` | Fraud graph for visualization |

## Testing & linting

```bash
pytest                 # runs against a throwaway SQLite database
ruff check .
ruff format --check .
```

## Project layout

```
app/
├── api/routes/    # FastAPI routers (auth, fraud, risk, dashboard, ...)
├── services/      # Business logic (fraud detection, risk, graph analysis)
├── ml_models/     # Fraud detector, risk scorer, graph neural network
├── models/        # SQLAlchemy ORM models
├── schemas/       # Pydantic request/response schemas
└── utils/         # Auth, security, caching, logging helpers
tests/             # pytest suite (API + ML unit tests)
```

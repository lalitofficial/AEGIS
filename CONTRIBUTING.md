# Contributing to AEGIS

Thanks for your interest in improving AEGIS. This document explains how to set up a development environment and what we expect from contributions.

## Development setup

### Backend (FastAPI)
```bash
cd api
cp .env.example .env
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

### Frontend (React/Vite)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Before opening a pull request

Run the full check suite locally — CI runs the same commands:

```bash
# Backend (from api/)
ruff check .
ruff format --check .
pytest

# Frontend (from frontend/)
npm run lint
npm test
npm run build
```

## Conventions

- **Branches**: create feature branches from `main` (`feat/...`, `fix/...`, `docs/...`).
- **Commits**: use [Conventional Commits](https://www.conventionalcommits.org/) — `feat(api): ...`, `fix(frontend): ...`, `docs: ...`, `test: ...`, `chore: ...`.
- **Python**: formatted and linted with Ruff (config in `api/pyproject.toml`). Target Python 3.11, 100-character lines.
- **JavaScript**: linted with ESLint (config in `frontend/eslint.config.js`).
- **Tests**: new endpoints and components should come with tests. Backend tests live in `api/tests/`, frontend tests in `frontend/src/test/`.

## Pull request checklist

- [ ] Lint and tests pass locally
- [ ] New behavior is covered by tests
- [ ] Documentation updated if behavior or configuration changed
- [ ] No secrets, credentials, or local artifacts committed

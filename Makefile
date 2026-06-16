PY := .venv/bin/python
RUFF := .venv/bin/ruff

.PHONY: help data baseline lint fmt test
help:
	@echo "data      generate the dev synthetic dataset"
	@echo "baseline  train+evaluate the tabular baseline (leakage-free out-of-time)"
	@echo "lint      ruff check + format --check"
	@echo "test      run the test suite"

data:
	$(PY) -m data.sim --preset dev --out data/generated/dev

baseline:
	$(PY) -m packages.models.tabular.baseline --data data/generated/dev

ablation:
	$(PY) -m evaluation.ablation --data data/generated/dev

rings:
	$(PY) -m packages.graphdb.analytics --data data/generated/dev

gnn:
	$(PY) -m packages.models.graph.train --data data/generated/dev

lint:
	$(RUFF) check data packages
	$(RUFF) format --check data packages

fmt:
	$(RUFF) check --fix data packages
	$(RUFF) format data packages

test:
	$(PY) -m pytest

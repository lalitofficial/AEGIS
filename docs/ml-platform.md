# AEGIS ML Platform — implementation status

Full design: [DESIGN.md](DESIGN.md). This tracks what is built vs. planned.

## Built (Phase 1–2)
- **Synthetic data simulator** (`data/sim/`): seeded, configurable, multi-entity
  (customers, accounts, cards, devices, IPs, merchants). Emits a time-ordered,
  labeled transaction stream + entity tables + ground-truth ring membership.
  Eight fraud typologies — card testing, stolen card, ATO, mule networks,
  synthetic identities, structuring, layering, collusion — designed so that
  **money-flow typologies use recruited real accounts with normal-looking
  amounts** (detectable only from graph structure, not per-row features).
- **Point-in-time tabular features** (`packages/features/tabular.py`): backward-
  looking velocity / amount / recency per account; the current authorization
  outcome is excluded; no future or label leakage.
- **Tabular baseline** (`packages/models/tabular/baseline.py`): imbalance-aware
  LightGBM evaluated on a **leakage-free out-of-time split**, reporting PR-AUC,
  recall@1% FPR, and per-typology recall.

## Quickstart
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-ml.txt
make data        # -> data/generated/dev/*.parquet
make baseline    # -> evaluation/baseline_metrics.json
make test        # simulator smoke tests
```

## Baseline result (dev preset, ~145k txns, 0.93% fraud)
| Metric | Value |
|---|---|
| PR-AUC (out-of-time) | ~0.89 |
| ROC-AUC | ~0.99 |
| Recall @ 1% FPR | ~0.88 |

**Per-typology recall @ 1% FPR — the ablation baseline.** Tabular catches per-row
typologies but is largely blind to graph-structured ones, leaving headroom the
graph layer is meant to close:

| Catches well (per-row signal) | Misses (graph signal) |
|---|---|
| stolen_card, ato ~1.00 | mule ~0.44 |
| structuring ~0.98 | collusion ~0.16 |
| card_testing ~0.96 | layering ~0.12 |

> Numbers vary slightly by seed/scale; regenerate with `make data && make baseline`.

## Next (per DESIGN.md roadmap)
Streaming features (Kafka/Bytewax/Redis) → graph construction (Neo4j/GDS) →
inductive GNN embeddings (GraphSAGE/GAT) → self-supervised + anomaly → fusion +
calibration → case prioritization + explainability → MLOps/observability.

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

## Built (Phase 6–7: graph)
- **Point-in-time graph features** (`packages/features/graph.py`): running, as-of
  money-flow signals (in/out degree, flow-through ratio, distinct counterparties)
  + windowed burst signals (fan-in over 24h/7d) + identity signals (shared-device
  customer count). Computed without a per-row graph rebuild; no future leakage.
- **Ablation runner** (`evaluation/ablation.py`): tabular vs tabular+graph.
- **Ring discovery** (`packages/graphdb/analytics.py`): networkx money-flow graph,
  reciprocal/repeated-edge subgraph + Louvain communities, scored (coverage) vs
  ground-truth ring membership.
- **Neo4j export** (`packages/graphdb/neo4j_export.py`): CSVs + `load.cypher`
  (constraints, LOAD CSV, GDS Louvain projection) for the graph-DB story.

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

## Ablation: adding graph features (`make ablation`)
| Config | PR-AUC | Recall@1% FPR |
|---|---|---|
| tabular | 0.886 | 0.882 |
| **tabular + graph** | **0.932** | **0.937** |

Per-typology recall @ 1% FPR — graph features close the gap on the structured typologies:

| typology | tabular | +graph | Δ |
|---|---|---|---|
| layering | 0.12 | 0.75 | **+0.62** |
| collusion | 0.16 | 0.40 | **+0.24** |
| mule | 0.44 | 0.56 | **+0.11** |

## Ring discovery (`make rings`)
Community detection on the money-flow graph recovers dense **collusion** rings
(2/3, mean coverage 0.57) but is blind to **mule** fan-in (0/5) where criminal
accounts are embedded in legit activity — motivating the inductive GNN.

## Built (Phase 8–9: GNN) — `make gnn`
- **GraphSAGE** (`packages/models/graph/`, PyTorch Geometric) for criminal-account
  detection (mule/recruited + synthetic-owned) on the **heterogeneous entity
  graph** (denoised reciprocal/repeated money-flow edges + shared-device/IP
  identity edges). Max-aggregation propagates risk through homophilous clusters.
- **MLP control** with identical node features isolates the value of message
  passing. Exports node embeddings (`account_embeddings.parquet`) for fusion.

| model | PR-AUC | ROC-AUC | Recall@5% FPR |
|---|---|---|---|
| MLP (features only) | 0.52 | 0.79 | 0.49 |
| **GraphSAGE (message passing)** | **0.58** | 0.80 | **0.51** |

**Message passing lifts PR-AUC ~+0.06** — the relational signal classical
community detection couldn't exploit for mules. (Setup: transductive node split;
inductive/temporal splits are a documented next refinement.)

## Built (Phase 10: self-supervised + anomaly)
- **Anomaly** (`packages/models/anomaly/`, `make anomaly`): Isolation Forest +
  autoencoder score accounts with **no labels**. IF reaches PR-AUC ~0.47 vs a
  ~5.7% base rate (~8×); the autoencoder is weak (~0.08) because recruited mules
  look individually normal — unsupervised methods catch odd/cold-start cases but
  miss deliberately-normal organized crime.
- **Self-supervised + few-shot** (`packages/models/graph/ssl.py`, `make ssl`): a
  GraphSAGE encoder trained by **link prediction** (no labels), then few-shot
  detection — given **10 known criminals**, rank all accounts by embedding
  similarity. SSL embeddings hit PR-AUC **~0.36 vs ~0.18** for raw-feature kNN
  (**+0.18**) — metric learning / few-shot demonstrated.

## Built (Phase 11: fusion + calibration + cases) — `make fusion`
Decision pipeline on a train/calibration/test out-of-time split:
- **Capstone ablation** (honest negative result included):

  | config | PR-AUC | Recall@1% FPR |
  |---|---|---|
  | tabular | 0.88 | 0.87 |
  | **tabular + graph** (production) | **0.92** | **0.93** |
  | + static GNN emb + anomaly | 0.79 | 0.86 |

  Static, as-of-cutoff entity embeddings **hurt** the per-transaction model
  (stale for out-of-time rows, noisy); the GNN/SSL deliver value at the **entity
  level** instead. Per-row temporal embeddings (TGN) are the proper fusion path.
- **Calibration** (isotonic on a held-out window): ECE **0.0016 → 0.0006**, so
  P(fraud) is trustworthy for expected-value decisions.
- **EV case prioritization**: rank by P×amount, dedup to entity-level cases —
  **~58% alert-volume reduction** (785 txn alerts → 326 cases), **precision@top-20
  EV ≈ 0.90**, ~76% fraud-account recall.

> Numbers vary slightly by seed/scale; regenerate with `make data ablation gnn ssl anomaly fusion`.

## Next (per DESIGN.md roadmap)
Explainability (SHAP / counterfactual / GNNExplainer case narratives) →
MLOps/observability (MLflow registry, retraining, drift). Streaming/serving infra
(Kafka/Bytewax/Redis) and inductive/temporal GNN (TGN) remain documented refinements.

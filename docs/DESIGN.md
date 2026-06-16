# AEGIS — Financial Crime Intelligence Platform (Technical Design Document)

> Flagship ML systems project. Detects and investigates organized financial crime — card fraud, mule
> accounts, synthetic identities, money laundering, fraud rings, account takeover, shared-device abuse,
> cross-account collusion — by fusing **tabular**, **temporal**, and **graph** representation learning
> behind a real-time, production-realistic architecture.

## Context & why this design
The existing AEGIS repo (FastAPI + React + Postgres demo with a stub gradient-boosting model and an
untrained GNN) is a scaffold. This document redesigns it into an ML-first platform that fills the graph
ML / representation-learning / MLOps gaps in the author's profile, complementing existing systems work
(Rust market-surveillance engine, multi-agent platform, etc.). **Emphasis is ML depth and modeling
rigor, not dashboard engineering.** The React app is repurposed as a thin investigator console; the
weight goes into the ML/graph/streaming layers.

### Decisions locked in (you can veto any)
- **Name/grounding:** keep "AEGIS"; ground it as a **real-time payments + AML** problem (instant,
  irreversible transfers → detection must be inline and fast). This is the single most important framing
  choice — it makes the "real-time" and "graph" requirements *necessary*, not decorative.
- **The differentiating thesis:** *per-transaction classifiers miss organized crime; model the entity
  graph and temporal money-flow.* Every advanced technique is justified against this thesis.
- **Build order:** MVP vertical slice first (sim → tabular → leakage-free backtest), then graph/GNN,
  then SSL/fusion, then MLOps/observability. Phased so there's always something demoable.
- **Frontend:** minimal. Reuse the existing React shell as a case console. No new design system work.

---

## 1. Problem statement
A financial institution processing real-time payments must, for **every transaction and every entity**,
produce a **calibrated risk score** fast enough to act inline, and route the **highest-expected-value
investigations** to a small analyst team. The hard, differentiated problem: the costliest crime is
**networked and temporal** — mules pass money through (high flow-through, low retention), synthetic
identities share devices/emails/phones across many "customers," laundering hides in fan-in/fan-out and
cyclic money flows, and rings collude across accounts. Single-row models are structurally blind to this.

**Goal:** a unified entity-and-transaction risk score combining tabular signal, temporal dynamics, and
graph structure, with a human-in-the-loop feedback loop that turns investigator dispositions into labels
for continuous retraining — all under point-in-time (leakage-free) correctness.

## 2. What makes this *not* generic (the thesis, operationalized)
| Generic fraud project | AEGIS |
|---|---|
| One XGBoost on a flat CSV | Layered tabular + temporal + graph + SSL, fused & calibrated |
| Random train/test split | Leakage-free **out-of-time backtest**, point-in-time features |
| ROC-AUC headline | **PR-AUC, recall@fixed-FPR, $-cost curves**, calibration |
| Row-level alerts | **Entity/ring-level cases** ranked by expected value |
| Labels assumed abundant | **Self-supervised** embeddings on a mostly-unlabeled graph |
| "Detects fraud" | Detects **mules, synthetic IDs, laundering, rings** as distinct typologies |

## 3. System architecture
```
                 ┌─────────────┐   transactions (events)
 Synthetic Sim ─▶│   Kafka     │──────────────┬───────────────────────────┐
 / replay        │ (Redpanda)  │              │                           │
                 └─────────────┘              ▼                           ▼
                          ┌──────────────────────────┐        ┌────────────────────┐
                          │  Stream feature pipeline  │        │  Graph ingest       │
                          │  (Bytewax) → Redis online │        │  (Neo4j loader)     │
                          └────────────┬──────────────┘        └─────────┬──────────┘
                                       ▼                                  ▼
                          ┌──────────────────────────┐        ┌────────────────────┐
   real-time fast path ──▶│  Scoring service (FastAPI)│        │  Graph ML (offline/ │
                          │  tabular GBM + cached emb │◀───────│  micro-batch):      │
                          │  + rules → decision       │  emb   │  GraphSAGE/GAT,     │
                          └────────────┬──────────────┘        │  community, linkpred│
                                       ▼                        └─────────┬──────────┘
                          ┌──────────────────────────┐                    │
                          │  Risk fusion + calibration│◀───────────────────┘
                          │  (stacking, isotonic, EV) │
                          └────────────┬──────────────┘
                                       ▼
            ┌───────────────┐  ┌──────────────────┐  ┌────────────────────┐
            │ Case priority │─▶│ Investigator AI  │─▶│ Alert/case mgmt +  │
            │ (entity/ring) │  │ (SHAP/CF/GNNexp) │  │ feedback → labels  │
            └───────────────┘  └──────────────────┘  └─────────┬──────────┘
                                                                │ dispositions
                                          ┌─────────────────────▼─────────────┐
                                          │ MLOps: MLflow registry, Optuna,    │
                                          │ retraining (Prefect), Evidently    │
                                          │ drift, Prometheus/Grafana          │
                                          └────────────────────────────────────┘
```
**Two fast paths, deliberately separated:** (1) sub-50ms **tabular** scoring inline on the stream using
Redis-served online features + *cached* graph embeddings; (2) heavier **graph** computation in
micro-batch (embeddings refreshed every few minutes, community detection hourly). This split is the
correct production pattern — GNN inference over a 30M-edge graph is not a per-request operation.

## 4. Tech stack (and why each is justified — plus what we deliberately skip)
| Layer | Choice | Justification |
|---|---|---|
| Stream | **Kafka** (Redpanda locally) | Event backbone + **replay** for deterministic backtests |
| Stream compute | **Bytewax** (Rust-core, Python) | Stateful windowed features; ties to your perf brand. Alt: Faust |
| Online store | **Redis** | <1ms velocity/aggregate + embedding cache for the fast path |
| Offline store | **PostgreSQL** | Transactions, cases, labels, point-in-time feature tables |
| Graph DB | **Neo4j + GDS** | Heterogeneous graph, Cypher typologies, Louvain/PageRank at scale |
| Feature store | **Feast** | Online/offline **parity** (anti-leakage); resume-grade, justified |
| Tabular ML | **XGBoost / LightGBM / CatBoost** | Imbalanced tabular SOTA; compared, not assumed |
| Graph ML | **PyTorch Geometric** | GraphSAGE/GAT, HeteroConv, link prediction, GNNExplainer |
| Anomaly | **scikit-learn / PyTorch** | Isolation Forest + autoencoder for novel/cold-start fraud |
| HPO / tracking | **Optuna + MLflow** | Tuning, experiment tracking, model registry |
| Explainability | **SHAP, DiCE, GNNExplainer** | Tabular + counterfactual + graph attributions |
| Drift | **Evidently** | Feature/score drift (PSI), retraining triggers |
| Orchestration | **Prefect** | Training/backtest/retrain flows (over raw cron) |
| Serving/API | **FastAPI** | Reuse existing app; scoring + case APIs |
| Infra | **Docker Compose** (k8s manifests as extension) | One-command local stack; k8s only for the deploy story |
| Observability | **Prometheus + Grafana** | Latency/throughput/score-distribution dashboards |
| Data versioning | **DVC** (or lakeFS) | Reproducible datasets + model lineage |

**Skipped on purpose (say so in interviews):** Flink/Spark (Bytewax + micro-batch suffices at this
scale), real k8s cluster (manifests provided, not operated), a bespoke frontend framework.

## 5. Data model (synthetic, multi-entity)
Entities: **Customer, Account, Card, Device, IP, Phone, Email, Merchant, Transaction.** Each carries
realistic attributes (KYC age, geo, issuer, MCC, device fingerprint, ASN, etc.). Two complementary
relational structures:
- **Identity graph** (slowly-changing): entities ↔ shared identifiers (Device/IP/Phone/Email/Card).
  Reveals synthetic-ID clusters and shared-device rings.
- **Money-flow graph** (temporal, directed, weighted): `Account -[TRANSFER {ts, amount, channel}]→
  Account`. Reveals mules (flow-through), structuring, layering cycles.

## 6. Graph schema (Neo4j, heterogeneous)
```
(:Customer)-[:OWNS]->(:Account)-[:USES]->(:Card)
(:Customer|:Account)-[:USED {first_seen,last_seen,count}]->(:Device|:IP|:Phone|:Email)
(:Account)-[:TRANSFER {ts,amount,channel,txn_id}]->(:Account)     // temporal money-flow
(:Account)-[:PAYS {ts,amount,mcc}]->(:Merchant)
(:Transaction)                                                     // optional node for txn-centric views
```
Node features = tabular + temporal aggregates; edge features = amount/time/channel. GDS projections:
identity subgraph (community detection, connected components) and money-flow subgraph (PageRank,
betweenness, cycle/motif detection).

## 7. Synthetic data + fraud typologies (ground-truth labeled)
Custom simulator (inspired by IBM **AMLSim** / **PaySim**) emitting a time-ordered event stream with
*labeled* injected typologies so every metric is honest:
- **Card fraud:** card testing (many small declines), stolen-card bursts, CNP anomalies.
- **Account takeover:** device/geo change → drain; sequence-detectable.
- **Mule networks:** fan-in → consolidation → fan-out; high flow-through, low retention.
- **Synthetic identities:** many "customers" sharing devices/emails/phones; thin, too-clean histories.
- **Structuring/smurfing:** sub-threshold splits over time.
- **Layering/laundering:** multi-hop chains and **cycles** across accounts.
- **Collusion rings:** dense subgraphs trading among themselves.

Base fraud rate ~0.3–1% (realistically extreme imbalance). **Validate on real public data** too —
**IEEE-CIS Fraud** (tabular) and **Elliptic / Elliptic++** (real Bitcoin AML graph) — to prove the
approach generalizes beyond your own simulator. This dual synthetic+real validation is a strong
credibility signal.

## 8. ML pipeline (the layered core)
| Layer | Technique | Role | Resume concept |
|---|---|---|---|
| L1 Tabular | XGBoost/LightGBM/CatBoost | Per-txn fast-path score | classical ML, imbalance, cost-sensitive |
| L2 Temporal | Sliding windows (1h/24h/7d/30d), time-decay, inter-event, sequence stats | Velocity & burst signal | temporal ML |
| L3 Anomaly | Isolation Forest + autoencoder | Novel/cold-start, synthetic-ID detection | anomaly detection, SSL-adjacent |
| L4 Graph classical | Louvain/Leiden, PageRank, betweenness, motif/cycle, fan-in/out | Ring discovery, mule/laundering features | large-scale graph analytics |
| L5 Graph ML | **GraphSAGE / GAT** (inductive, heterogeneous, PyG) | Entity embeddings & risk | Graph ML, heterogeneous graphs |
| L6 Link prediction | GNN edge scoring | Hidden mule links, synthetic-ID linkage | link prediction |
| L7 Representation | **Self-supervised** (graph contrastive + metric learning) | Embeddings without labels; few-shot detection | SSL, contrastive, metric learning |
| L8 Fusion | Stacking meta-learner + **isotonic calibration** | Unified calibrated risk | model fusion, calibration |
| L9 Decision | **Expected-value** thresholding (P(fraud)×exposure − review cost) | Approve/decline/review, case rank | cost-sensitive decisioning |

**Why inductive GNNs (GraphSAGE/GAT) not GCN/node2vec:** new entities must get embeddings without
retraining the whole graph — required for streaming. **Why SSL:** labels are <1% and delayed; contrastive
pretraining on the *unlabeled* graph + metric learning lets you detect new fraud by **kNN similarity to a
handful of known-bad entities** (few-shot) — the most sophisticated and defensible thread in the project.

## 9. Feature engineering strategy
- **Tabular:** amount/MCC/channel encodings, issuer/geo, ratios vs. customer baseline.
- **Temporal (point-in-time!):** windowed counts/sums/uniques per entity, time-since-last, burst/velocity,
  time-of-day/day-of-week, exponential time-decay; all computed **as-of event time** (Feast online/offline
  parity guarantees train==serve).
- **Graph:** degree, PageRank, community id/size, flow-through ratio, fan-in/out, cycle membership,
  shared-identifier counts, **GNN embedding** (and embedding-kNN distance to nearest known fraud).
- **Cross-entity:** shared-device/IP counts, distinct customers per device (synthetic-ID signal).

## 10. Modeling rigor / correctness (the section quant firms care about most)
1. **No leakage / point-in-time:** every feature computed as-of txn timestamp; labels (confirmed later)
   respect time. Feast enforces train/serve parity.
2. **Out-of-time evaluation:** temporal split (train past → test future), not random. Treat like a
   strategy backtest. Graph eval masks future edges/labels from message passing.
3. **Imbalance:** PR-AUC headline (not ROC), focal/weighted loss, scale_pos_weight, optional
   under/over-sampling — measured, not assumed.
4. **Calibration:** isotonic/Platt so P(fraud) is meaningful for EV decisions; report reliability curves.
5. **Ablation table** (tabular → +temporal → +graph-classical → +GNN → +SSL): the single most impressive
   artifact — shows the marginal value of each ML layer.

## 11. Evaluation metrics + realistic targets
> **Honesty rule:** numbers below are *illustrative targets / measurement protocol*. The eval harness
> produces real figures from the seeded simulator; never ship fabricated metrics.

| Metric | Target (illustrative) | How measured |
|---|---|---|
| Scale | ~20M txns, ~5M nodes, ~30M edges | simulator config, Neo4j counts |
| Tabular PR-AUC | ~0.70 baseline | out-of-time test |
| +Graph/temporal PR-AUC | ~0.82 (Δ from ablation) | same split, added features |
| Recall @ 1% FPR | +15–20 pts vs baseline | operating-point analysis |
| Inference latency | <50 ms p99 (fast path) | load test (Locust), Prometheus |
| Throughput | ~5–15k txns/s scoring | streaming benchmark |
| Alert-volume reduction | ~30–50% at equal recall | entity-level case dedup vs row alerts |
| Ring discovery | N rings, ~M accts each, $X traced | simulator ground truth |
| Calibration (ECE) | < 0.03 | reliability curve |

## 12. Explainability / Investigator AI (not a chatbot)
Deterministic **evidence synthesis** per case: top **SHAP** features, **counterfactual** ("what minimal
change flips the decision", via DiCE), **GNNExplainer** subgraph (which neighbors/paths drove the risk),
matched **typology**, and **embedding-kNN** of similar known-bad entities → assembled into a structured
case narrative. An LLM is *optional* phrasing-only polish over this grounded evidence — explicitly framed
as explanation automation, not a RAG chatbot (respecting the "no chatbot" constraint).

## 13. Deployment architecture
Docker Compose stack (Redpanda, Postgres, Neo4j, Redis, MLflow, scoring API, case API, Bytewax worker,
Prefect, Prometheus, Grafana, frontend). Kubernetes manifests + a Helm chart provided as the "scales to
cloud" extension (not operated). CI (already present) extended with a **model-eval gate**: PR-AUC on a
fixed holdout must not regress before merge.

## 14. API design (FastAPI)
```
POST /v1/score/transaction      → {risk, decision: approve|review|decline, top_reasons[]}
GET  /v1/entities/{id}/risk      → fused entity risk, embedding neighbors, typology flags
GET  /v1/cases?status&priority   → EV-ranked case queue (entity/ring level)
GET  /v1/cases/{id}              → evidence bundle (SHAP, counterfactual, subgraph, similar bad)
POST /v1/cases/{id}/disposition  → investigator label → feedback loop
GET  /v1/rings                   → discovered communities (size, $ flow, members)
POST /v1/investigate/{entity}    → on-demand evidence synthesis
GET  /metrics                    → Prometheus; /v1/models, /v1/drift (admin)
```

## 15. Folder structure
```
aegis/
  data/sim/            # transaction + typology simulator (seeded, → Parquet + Kafka)
  packages/
    features/          # point-in-time feature defs (Feast), windowed aggregates
    models/
      tabular/  anomaly/  graph/  fusion/   # XGB-LGBM-CatBoost | IForest+AE | GNN+SSL+linkpred | stacking+calibration
    graphdb/           # Neo4j loaders, Cypher typologies, GDS jobs
    explain/           # SHAP, DiCE counterfactuals, GNNExplainer, narrative builder
  services/
    ingest/  streamproc/  scoring/  api/    # Kafka producer | Bytewax | real-time score | case API (existing FastAPI)
  pipelines/           # Prefect flows: train, backtest, retrain, drift
  evaluation/          # leakage-free backtest, ablation, calibration, latency benchmarks
  frontend/            # existing React → investigator console (minimal)
  infra/               # docker-compose, k8s/helm, prometheus, grafana
  mlflow/  notebooks/  docs/DESIGN.md
```

## 16. Weekly implementation roadmap (~12 weeks, phased; each phase yields an artifact/metric)
| Wk | Phase | Deliverable / artifact |
|---|---|---|
| 1–2 | Simulator + data model | Seeded multi-entity sim → 20M labeled txns (Parquet), entity/graph schema |
| 3–4 | Tabular MVP + **eval harness** | XGB/LGBM/CatBoost, point-in-time features (Feast), **out-of-time PR-AUC baseline** |
| 5 | Streaming | Kafka replay + Bytewax windowed features → Redis; <50ms scoring API; latency benchmark |
| 6–7 | Graph construction + classical | Neo4j load (~30M edges), GDS community detection → **first ring discoveries**, fan-in/out features |
| 8–9 | Graph ML | GraphSAGE/GAT inductive embeddings (PyG), link prediction; **ablation: +graph lift** |
| 10 | SSL + anomaly | Contrastive/metric-learning pretraining, embedding-kNN few-shot; IForest+autoencoder |
| 11 | Fusion + cases + explain | Stacking + isotonic calibration, EV case prioritization, SHAP/CF/GNNExplainer bundle |
| 12 | MLOps + benchmarks + report | MLflow/Optuna/Prefect retrain, Evidently drift, Grafana, **ablation table + technical report** |
| +  | Real-data validation | Re-run on IEEE-CIS + Elliptic; publish comparison |

## 17. Future extensions
Temporal GNNs (**TGN/TGAT** continuous-time), GNN at serving via feature-store-cached embeddings,
active learning for label efficiency, differential privacy / federated angle, adversarial robustness
(evasion-aware training), graph foundation-model pretraining, real-time community maintenance (streaming
Louvain), agentic multi-step investigation over the evidence graph.

## 18. Resume bullets (4–5; fill bracketed metrics with measured values — never fabricate)
1. **Architected AEGIS, a real-time financial-crime intelligence platform** fusing gradient-boosted
   tabular models, sliding-window temporal features, and **inductive Graph Neural Networks
   (GraphSAGE/GAT, PyTorch Geometric)** over a heterogeneous entity graph (**~5M nodes / ~30M edges**,
   Neo4j GDS); graph + temporal signal lifted fraud **PR-AUC [0.71→0.83]** and **recall@1%FPR by [18 pts]**
   on a **leakage-free out-of-time backtest**.
2. **Pretrained self-supervised entity embeddings** (graph contrastive + metric learning) on a
   largely-unlabeled transaction graph, enabling **few-shot mule & synthetic-identity discovery** via
   embedding kNN + link prediction; surfaced **[N] organized fraud rings (~[M] accounts, $[X] traced)**
   invisible to per-transaction models.
3. **Built a streaming feature pipeline** (Kafka + Bytewax stateful operators + Redis online store, Feast
   online/offline parity) scoring transactions at **<50 ms p99 / ~[10]k TPS** over a **20M-transaction**
   simulation, with **point-in-time-correct features** eliminating label leakage.
4. **Engineered imbalance-aware, cost-sensitive training** across XGBoost/LightGBM/CatBoost (Optuna HPO,
   focal/weighted loss, isotonic calibration); **expected-value entity-level case prioritization cut
   analyst alert volume ~[40%] at equal recall**, with MLflow registry, feedback-driven retraining, and
   Evidently drift monitoring.
5. **Developed an investigation-evidence engine** combining **SHAP, counterfactuals (DiCE), and
   GNNExplainer** subgraphs into auto-generated case narratives, plus **Isolation Forest + autoencoder**
   anomaly detectors for novel-fraud cold-start.

## 19. How to make it stand out (quant / AI-startup / ML recruiter)
- **Quant:** lead with the **leakage-free out-of-time backtest, calibration, and EV-optimal
  decisioning** — they think in PnL/cost curves, not accuracy. Publish **p50/p99 latency + TPS** (ties to
  your Rust surveillance engine). The **ablation table** is your money shot.
- **AI startups:** the **graph + SSL representation-learning** stack and **few-shot detection** read as
  research maturity; the **end-to-end MLOps** (registry, retraining, drift) reads as "ships to prod."
- **All:** a crisp **technical report / blog** with PR curves, a **t-SNE of ring embeddings**,
  GNNExplainer subgraphs, and **real-data (Elliptic/IEEE-CIS) validation** to prove it's more than a toy
  simulator. One-command reproducibility (`docker compose up` + `prefect run`) + seeded data.

## 20. Verification (per phase, when we build)
- **Data:** simulator emits N labeled txns; typology ground-truth queryable; class balance as configured.
- **Tabular/eval:** `prefect run train` → MLflow logs PR-AUC on out-of-time split; leakage test
  (shuffle-time control) passes.
- **Streaming:** Locust load test confirms <50ms p99; Bytewax features match offline (parity test).
- **Graph:** Neo4j edge counts; GDS community detection recovers seeded rings (precision/recall vs ground
  truth); ablation shows +graph PR-AUC lift.
- **End-to-end:** `docker compose up` → score a streamed txn → it appears as a prioritized case with a
  full evidence bundle → disposition feeds a retraining run.

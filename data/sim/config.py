from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SimConfig:
    """Configuration for the financial-crime transaction simulator.

    All randomness is driven by ``seed`` so a given config is fully reproducible.
    Scale up ``n_customers`` / ``days`` toward the ~20M-transaction target; the
    defaults produce a fast (~150k-transaction) development dataset.
    """

    seed: int = 7

    # --- scale ---
    n_customers: int = 2_000
    days: int = 90
    start_ts: str = "2024-01-01"
    avg_txns_per_customer_per_day: float = 0.8
    n_merchants: int = 300

    # --- money (INR) ---
    legit_amount_log_mu: float = 6.4  # exp(6.4) ~ 600
    legit_amount_log_sigma: float = 1.0
    structuring_threshold: float = 10_000.0

    # --- legit behaviour ---
    p_own_device: float = 0.95  # legit txns mostly use the customer's own device
    p_favorite_merchant: float = 0.6
    p_decline_legit: float = 0.02

    # --- fraud prevalence ---
    # Episode counts scale with customer count; tune to land ~1-2% fraud.
    card_episodes_per_1k: float = 18.0
    ato_episodes_per_1k: float = 6.0
    mule_rings_per_1k: float = 2.5
    synthetic_clusters_per_1k: float = 2.0
    structuring_episodes_per_1k: float = 5.0
    layering_chains_per_1k: float = 2.0
    collusion_rings_per_1k: float = 1.5

    @property
    def n_card_episodes(self) -> int:
        return self._scaled(self.card_episodes_per_1k)

    @property
    def n_ato_episodes(self) -> int:
        return self._scaled(self.ato_episodes_per_1k)

    @property
    def n_mule_rings(self) -> int:
        return self._scaled(self.mule_rings_per_1k)

    @property
    def n_synthetic_clusters(self) -> int:
        return self._scaled(self.synthetic_clusters_per_1k)

    @property
    def n_structuring_episodes(self) -> int:
        return self._scaled(self.structuring_episodes_per_1k)

    @property
    def n_layering_chains(self) -> int:
        return self._scaled(self.layering_chains_per_1k)

    @property
    def n_collusion_rings(self) -> int:
        return self._scaled(self.collusion_rings_per_1k)

    def _scaled(self, per_1k: float) -> int:
        return max(1, int(round(per_1k * self.n_customers / 1_000)))


# Convenience presets.
DEV = SimConfig()
MEDIUM = SimConfig(n_customers=25_000, days=120)
LARGE = SimConfig(n_customers=250_000, days=120, avg_txns_per_customer_per_day=1.0)

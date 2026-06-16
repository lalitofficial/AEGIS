"""AEGIS synthetic financial-crime data simulator.

Generates a time-ordered stream of labeled transactions plus the entity tables
needed to construct the heterogeneous graph. Deterministic given a seed.
"""

from data.sim.config import SimConfig
from data.sim.simulator import SimOutput, Simulator

__all__ = ["SimConfig", "Simulator", "SimOutput"]

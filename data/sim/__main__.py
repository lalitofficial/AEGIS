from __future__ import annotations

import argparse
import json

from data.sim.config import DEV, LARGE, MEDIUM, SimConfig
from data.sim.simulator import Simulator

PRESETS = {"dev": DEV, "medium": MEDIUM, "large": LARGE}


def main() -> None:
    p = argparse.ArgumentParser(description="AEGIS synthetic financial-crime data simulator")
    p.add_argument("--preset", choices=PRESETS, default="dev")
    p.add_argument("--customers", type=int, help="override n_customers")
    p.add_argument("--days", type=int, help="override days")
    p.add_argument("--seed", type=int, help="override seed")
    p.add_argument("--out", default="data/generated/dev", help="output directory")
    args = p.parse_args()

    base = PRESETS[args.preset]
    overrides = {}
    if args.customers is not None:
        overrides["n_customers"] = args.customers
    if args.days is not None:
        overrides["days"] = args.days
    if args.seed is not None:
        overrides["seed"] = args.seed
    cfg = SimConfig(**{**base.__dict__, **overrides}) if overrides else base

    out = Simulator(cfg).generate()
    path = out.write(args.out)
    print(f"Wrote dataset to {path}")
    print(json.dumps(out.manifest, indent=2, default=str))


if __name__ == "__main__":
    main()

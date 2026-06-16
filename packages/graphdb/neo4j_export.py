"""Export the simulated dataset to Neo4j-loadable CSVs + a Cypher load script
(constraints, LOAD CSV, and a GDS Louvain projection for ring detection).

Run: python -m packages.graphdb.neo4j_export --data data/generated/dev
The CSVs are written for `neo4j-admin`/`LOAD CSV`; running them needs a Neo4j
instance with the Graph Data Science library.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

LOAD_CYPHER = """// AEGIS graph load (run from the Neo4j import dir; needs GDS for the projection)
CREATE CONSTRAINT account_id IF NOT EXISTS FOR (a:Account) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT device_id  IF NOT EXISTS FOR (d:Device)  REQUIRE d.id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///accounts.csv' AS row
MERGE (a:Account {id: row.account_id})
SET a.is_mule = toBoolean(row.is_mule), a.customer_id = row.customer_id;

LOAD CSV WITH HEADERS FROM 'file:///devices.csv' AS row
MERGE (:Device {id: row.device_id});

LOAD CSV WITH HEADERS FROM 'file:///rel_transfer.csv' AS row
MATCH (s:Account {id: row.src}), (d:Account {id: row.dst})
MERGE (s)-[t:TRANSFER {txn_id: row.txn_id}]->(d)
SET t.amount = toFloat(row.amount), t.ts = datetime(row.ts);

LOAD CSV WITH HEADERS FROM 'file:///rel_used_device.csv' AS row
MATCH (a:Account {id: row.account_id}), (d:Device {id: row.device_id})
MERGE (a)-[:USED]->(d);

// Ring detection with GDS Louvain over the money-flow graph:
CALL gds.graph.project('flow', 'Account', {TRANSFER: {orientation: 'UNDIRECTED'}});
CALL gds.louvain.stream('flow') YIELD nodeId, communityId
RETURN communityId, count(*) AS size ORDER BY size DESC LIMIT 25;
"""


def export(data_dir: str, out_dir: str) -> Path:
    data, out = Path(data_dir), Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    txns = pd.read_parquet(data / "transactions.parquet")
    accounts = pd.read_parquet(data / "accounts.parquet")

    accounts[["account_id", "customer_id", "is_mule"]].to_csv(out / "accounts.csv", index=False)
    pd.read_parquet(data / "devices.parquet").to_csv(out / "devices.csv", index=False)

    transfers = txns.loc[
        txns["dst_account_id"].notna(),
        ["txn_id", "src_account_id", "dst_account_id", "amount", "ts"],
    ]
    transfers.rename(columns={"src_account_id": "src", "dst_account_id": "dst"}).to_csv(
        out / "rel_transfer.csv", index=False
    )
    txns[["src_account_id", "device_id"]].dropna().drop_duplicates().rename(
        columns={"src_account_id": "account_id"}
    ).to_csv(out / "rel_used_device.csv", index=False)

    (out / "load.cypher").write_text(LOAD_CYPHER)
    return out


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/generated/dev")
    p.add_argument("--out", default="data/generated/dev/neo4j")
    args = p.parse_args()
    print(f"Wrote Neo4j CSVs + load.cypher to {export(args.data, args.out)}")

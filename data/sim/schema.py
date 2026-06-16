from __future__ import annotations

# Canonical transaction columns shared by the legit generator and every typology
# injector. ``txn_id`` is assigned after the global time sort.
TXN_COLUMNS = [
    "ts",
    "txn_type",  # purchase | transfer | withdrawal | topup
    "channel",  # card | upi | netbanking | wallet | atm
    "src_customer_id",
    "src_account_id",
    "dst_account_id",
    "merchant_id",
    "card_id",
    "device_id",
    "ip_id",
    "amount",
    "mcc",  # merchant category code; 0 when no merchant
    "status",  # approved | declined
    "is_fraud",  # 0 | 1
    "typology",  # None for legit, else the fraud pattern name
    "ring_id",  # None unless part of a labeled ring/cluster
]

TYPOLOGIES = [
    "card_testing",
    "stolen_card",
    "ato",
    "mule",
    "synthetic_id",
    "structuring",
    "layering",
    "collusion",
]

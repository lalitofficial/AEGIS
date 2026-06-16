"""GraphSAGE (inductive message passing) and an MLP control with identical
features. Comparing the two isolates the value of graph message passing."""

from __future__ import annotations

import torch.nn.functional as F
from torch import nn
from torch_geometric.nn import SAGEConv


class GraphSAGE(nn.Module):
    def __init__(self, in_dim: int, hidden: int = 64, n_classes: int = 2, dropout: float = 0.3):
        super().__init__()
        # max aggregation propagates "any suspicious neighbour" rather than
        # averaging the criminal signal away across mostly-legit neighbours.
        self.conv1 = SAGEConv(in_dim, hidden, aggr="max")
        self.conv2 = SAGEConv(hidden, hidden, aggr="max")
        self.head = nn.Linear(hidden, n_classes)
        self.dropout = dropout

    def embed(self, x, edge_index):
        h = F.relu(self.conv1(x, edge_index))
        h = F.dropout(h, p=self.dropout, training=self.training)
        h = F.relu(self.conv2(h, edge_index))
        return h

    def forward(self, x, edge_index):
        return self.head(self.embed(x, edge_index))


class MLP(nn.Module):
    """Same features, no message passing — the control for the ablation."""

    def __init__(self, in_dim: int, hidden: int = 64, n_classes: int = 2, dropout: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, n_classes),
        )

    def forward(self, x, edge_index=None):
        return self.net(x)

import torch
import torch.nn as nn
import torch.nn.functional as F
import networkx as nx
from typing import Dict, List, Tuple
import numpy as np
from app.utils.logger import logger

class GraphConvLayer(nn.Module):
    """Graph Convolutional Layer"""
    
    def __init__(self, in_features: int, out_features: int):
        super(GraphConvLayer, self).__init__()
        self.linear = nn.Linear(in_features, out_features)
        
    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        # GCN: H^(l+1) = σ(D^(-1/2) A D^(-1/2) H^(l) W^(l))
        out = torch.mm(adj, x)
        out = self.linear(out)
        return F.relu(out)

class FraudGNN(nn.Module):
    """Graph Neural Network for Fraud Detection"""
    
    def __init__(self, input_dim: int = 32, hidden_dim: int = 64, output_dim: int = 4):
        super(FraudGNN, self).__init__()
        self.conv1 = GraphConvLayer(input_dim, hidden_dim)
        self.conv2 = GraphConvLayer(hidden_dim, hidden_dim)
        self.fc = nn.Linear(hidden_dim, output_dim)
    
    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        x = self.conv1(x, adj)
        x = F.dropout(x, p=0.5, training=self.training)
        x = self.conv2(x, adj)
        x = self.fc(x)
        return F.softmax(x, dim=1)

class GraphAnalyzer:
    """Analyze transaction graphs for fraud patterns"""
    
    def __init__(self):
        self.model = FraudGNN()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
    
    def build_transaction_graph(self, transactions: List[Dict]) -> nx.Graph:
        """Build a graph from transaction data"""
        G = nx.Graph()
        
        for txn in transactions:
            # Add nodes
            customer_id = txn['customer_id']
            card_id = txn.get('card_id', 'unknown')
            ip_address = txn.get('ip_address', 'unknown')
            
            G.add_node(customer_id, node_type='customer')
            G.add_node(card_id, node_type='card')
            G.add_node(ip_address, node_type='ip')
            
            # Add edges
            G.add_edge(customer_id, card_id, weight=txn['amount'])
            G.add_edge(customer_id, ip_address, weight=1.0)
            
        return G

    def detect_fraud_rings(self, G: nx.Graph) -> List[List[str]]:
        """Detect potential fraud rings using community detection"""
        communities = list(nx.community.greedy_modularity_communities(G))
        
        fraud_rings = []
        for community in communities:
            # Check if community shows suspicious patterns
            subgraph = G.subgraph(community)
            
            # Criteria for fraud ring:
            # 1. Multiple customers sharing cards/IPs
            # 2. High connectivity
            # 3. Similar transaction patterns
            
            if len(community) > 3:  # At least 4 entities
                density = nx.density(subgraph)
                if density > 0.5:  # High connectivity
                    fraud_rings.append(list(community))
                    
        return fraud_rings

    def calculate_node_risk(self, G: nx.Graph, node: str) -> float:
        """Calculate risk score for a node based on graph features"""
        if node not in G:
            return 0.0
            
        # Graph features
        degree = G.degree(node)
        clustering = nx.clustering(G, node)
        
        # Centrality measures
        try:
            betweenness = nx.betweenness_centrality(G)[node]
            closeness = nx.closeness_centrality(G)[node]
        except:
            betweenness = 0
            closeness = 0
            
        # Calculate risk score
        risk = (
            0.3 * min(degree / 10, 1.0) +
            0.2 * clustering +
            0.25 * betweenness +
            0.25 * closeness
        )
        
        return risk

    def calculate_node_risks(self, G: nx.Graph) -> Dict[str, float]:
        """Calculate risk scores for all nodes efficiently"""
        if G.number_of_nodes() == 0:
            return {}

        try:
            betweenness = nx.betweenness_centrality(G)
            closeness = nx.closeness_centrality(G)
        except Exception:
            betweenness = {node: 0 for node in G.nodes()}
            closeness = {node: 0 for node in G.nodes()}

        risks = {}
        for node in G.nodes():
            degree = G.degree(node)
            clustering = nx.clustering(G, node)
            risk = (
                0.3 * min(degree / 10, 1.0) +
                0.2 * clustering +
                0.25 * betweenness.get(node, 0) +
                0.25 * closeness.get(node, 0)
            )
            risks[node] = risk
        return risks

# Global instance
graph_analyzer = GraphAnalyzer()

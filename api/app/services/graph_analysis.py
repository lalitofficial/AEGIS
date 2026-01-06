from typing import Dict, List
from sqlalchemy.orm import Session
from app.models.fraud import GraphNode, GraphEdge
from app.ml_models.graph_neural_network import graph_analyzer
from app.utils.logger import logger
import networkx as nx

class GraphAnalysisService:
    """Service for graph-based fraud detection"""
    
    @staticmethod
    def get_fraud_graph_data(db: Session) -> Dict:
        """Get graph data for visualization"""
        nodes = db.query(GraphNode).all()
        edges = db.query(GraphEdge).all()
        
        # Convert to frontend format
        graph_data = {
            'nodes': [
                {
                    'id': node.node_id,
                    'label': node.label,
                    'group': node.group,
                    'size': node.size,
                    'title': node.title
                }
                for node in nodes
            ],
            'edges': [
                {
                    'from': edge.from_node,
                    'to': edge.to_node
                }
                for edge in edges
            ]
        }
        
        return graph_data

    @staticmethod
    def analyze_transaction_patterns(transactions: List[Dict], db: Session) -> Dict:
        """Analyze transaction patterns using graph analysis"""
        
        # Build transaction graph
        G = graph_analyzer.build_transaction_graph(transactions)
        
        # Detect fraud rings
        fraud_rings = graph_analyzer.detect_fraud_rings(G)
        
        # Calculate node risks
        node_risks = graph_analyzer.calculate_node_risks(G)
            
        # Store graph in database
        GraphAnalysisService._store_graph(G, node_risks, db)
        
        analysis_result = {
            'total_nodes': G.number_of_nodes(),
            'total_edges': G.number_of_edges(),
            'fraud_rings_detected': len(fraud_rings),
            'fraud_rings': fraud_rings,
            'high_risk_nodes': [
                node for node, risk in node_risks.items() if risk > 0.7
            ]
        }
        
        logger.info(f"Graph analysis completed: {analysis_result['fraud_rings_detected']} fraud rings detected")
        
        return analysis_result

    @staticmethod
    def _store_graph(G: nx.Graph, node_risks: Dict, db: Session):
        """Store graph data in database"""
        
        # Clear existing graph data (optional)
        # db.query(GraphNode).delete()
        # db.query(GraphEdge).delete()
        
        # Store nodes
        for node in G.nodes():
            risk = node_risks.get(node, 0)
            
            # Determine group based on risk
            if risk >= 0.8:
                group = 'Detected'
                size = 30
            elif risk >= 0.6:
                group = 'Investigation'
                size = 20
            elif risk >= 0.4:
                group = 'Suspicious'
                size = 15
            else:
                group = 'Safe'
                size = 10
                
            node_type = G.nodes[node].get('node_type', 'unknown')
            
            # Check if node exists
            existing_node = db.query(GraphNode).filter(GraphNode.node_id == str(node)).first()
            
            if not existing_node:
                graph_node = GraphNode(
                    node_id=str(node),
                    label=f"{node_type}_{node}",
                    group=group,
                    size=size,
                    title=f"Risk: {risk:.2f}",
                    meta_data={'node_type': node_type, 'risk_score': risk}
                )
                db.add(graph_node)
                
        # Store edges
        for edge in G.edges():
            from_node, to_node = edge
            weight = G[from_node][to_node].get('weight', 1.0)
            
            # Check if edge exists
            existing_edge = db.query(GraphEdge)\
                .filter(GraphEdge.from_node == str(from_node))\
                .filter(GraphEdge.to_node == str(to_node))\
                .first()
                
            if not existing_edge:
                graph_edge = GraphEdge(
                    from_node=str(from_node),
                    to_node=str(to_node),
                    weight=weight,
                    meta_data={'weight': weight}
                )
                db.add(graph_edge)
                
        db.commit()
        logger.info(f"Graph stored: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

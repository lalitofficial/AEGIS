import numpy as np
from typing import Dict, List
from app.config import settings
from app.utils.logger import logger

class RiskScorer:
    """Calculate risk scores for customers"""
    
    def __init__(self):
        self.risk_weights = {
            'failed_logins': 15,
            'new_device': 10,
            'location_change': 12,
            'transaction_velocity': 20,
            'high_value_transaction': 15,
            'chargeback_history': 25,
            'vpn_usage': 8,
            'account_age': -10,  # Negative weight (older = safer)
        }
        
    def calculate_risk_score(self, customer_data: Dict) -> int:
        """
        Calculate risk score (0-100) for a customer
        """
        score = 50  # Base score
        
        # Apply risk factors
        for factor, weight in self.risk_weights.items():
            if factor in customer_data:
                value = customer_data[factor]
                
                if factor == 'account_age':
                    # Account age in days (older is safer)
                    age_years = value / 365
                    score += weight * min(age_years, 5) / 5
                else:
                    # Boolean or count factors
                    if isinstance(value, bool):
                        score += weight if value else 0
                    else:
                        score += weight * min(value, 1)
        
        # Clamp score between 0 and 100
        score = max(0, min(100, int(score)))
        
        return score

    def identify_risk_factors(self, customer_data: Dict) -> List[str]:
        """
        Identify specific risk factors for a customer
        """
        risk_factors = []
        
        if customer_data.get('failed_logins', 0) > 3:
            risk_factors.append('Multiple failed logins')
            
        if customer_data.get('new_device', False):
            risk_factors.append('New device detected')
            
        if customer_data.get('location_change', False):
            risk_factors.append('Unusual location')
            
        if customer_data.get('transaction_velocity', 0) > 10:
            risk_factors.append('High transaction velocity')
            
        if customer_data.get('high_value_transaction', False):
            risk_factors.append('High-value purchases')
            
        if customer_data.get('chargeback_history', 0) > 0:
            risk_factors.append('Chargeback history')
            
        if customer_data.get('vpn_usage', False):
            risk_factors.append('VPN usage')
            
        if customer_data.get('account_age', 365) < 30:
            risk_factors.append('New account')
            
        return risk_factors

    def determine_status(self, risk_score: int) -> str:
        """
        Determine customer status based on risk score
        """
        if risk_score >= 90:
            return 'Restricted'
        elif risk_score >= 70:
            return 'Under Review'
        elif risk_score >= 50:
            return 'Monitoring'
        else:
            return 'Normal'

# Global instance
risk_scorer = RiskScorer()
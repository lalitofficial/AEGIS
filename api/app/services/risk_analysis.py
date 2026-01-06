from typing import Dict, List
from sqlalchemy.orm import Session
from app.models.fraud import RiskProfile
from app.ml_models.risk_scorer import risk_scorer
from app.utils.logger import logger
from datetime import datetime

class RiskAnalysisService:
    """Service for risk analysis operations"""
    
    @staticmethod
    def calculate_customer_risk(customer_data: Dict, db: Session) -> RiskProfile:
        """Calculate and store customer risk profile"""
        
        # Calculate risk score
        risk_score = risk_scorer.calculate_risk_score(customer_data)
        
        # Identify risk factors
        risk_factors = risk_scorer.identify_risk_factors(customer_data)
        
        # Determine status
        status = risk_scorer.determine_status(risk_score)
        
        # Check if profile exists
        existing_profile = db.query(RiskProfile)\
            .filter(RiskProfile.customer_id == customer_data['customer_id'])\
            .first()
            
        if existing_profile:
            # Update existing profile
            existing_profile.risk_score = risk_score
            existing_profile.risk_factors = risk_factors
            existing_profile.status = status
            existing_profile.last_activity = datetime.utcnow()
            existing_profile.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_profile)
            return existing_profile
        else:
            # Create new profile
            new_profile = RiskProfile(
                customer_id=customer_data['customer_id'],
                customer_name=customer_data.get('customer_name', 'Unknown'),
                risk_score=risk_score,
                risk_factors=risk_factors,
                status=status,
                account_age=customer_data.get('account_age', '0 days'),
                last_activity=datetime.utcnow()
            )
            db.add(new_profile)
            db.commit()
            db.refresh(new_profile)
            
            logger.info(f"Risk profile created for customer {customer_data['customer_id']}")
            return new_profile

    @staticmethod
    def get_high_risk_customers(db: Session, threshold: int = 70) -> List[RiskProfile]:
        """Get all high-risk customers"""
        return db.query(RiskProfile)\
            .filter(RiskProfile.risk_score >= threshold)\
            .order_by(RiskProfile.risk_score.desc())\
            .all()

    @staticmethod
    def get_customer_risk_profile(customer_id: str, db: Session) -> RiskProfile:
        """Get risk profile for a specific customer"""
        return db.query(RiskProfile)\
            .filter(RiskProfile.customer_id == customer_id)\
            .first()

    @staticmethod
    def get_risk_distribution(db: Session) -> Dict[str, int]:
        """Get distribution of risk levels"""
        profiles = db.query(RiskProfile).all()
        
        distribution = {
            'critical': 0,  # 90-100
            'high': 0,      # 70-89
            'medium': 0,    # 50-69
            'low': 0        # 0-49
        }
        
        for profile in profiles:
            score = profile.risk_score
            if score >= 90:
                distribution['critical'] += 1
            elif score >= 70:
                distribution['high'] += 1
            elif score >= 50:
                distribution['medium'] += 1
            else:
                distribution['low'] += 1
                
        return distribution
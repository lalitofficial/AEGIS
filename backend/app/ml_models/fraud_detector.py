import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple
import joblib
import os
from app.config import settings
from app.utils.logger import logger

class FraudDetector:
    """ML Model for fraud detection"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'amount', 'hour', 'day_of_week', 'is_weekend',
            'transaction_velocity', 'avg_transaction_amount',
            'account_age_days', 'distance_from_home',
            'new_device', 'vpn_usage', 'failed_login_attempts'
        ]
        self.model_path = os.path.join(settings.MODEL_PATH, 'fraud_detector.pkl')
        
    def train(self, X_train: np.ndarray, y_train: np.ndarray):
        logger.info("Training fraud detection model...")
        self.model = GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42
        )
        X_train_scaled = self.scaler.fit_transform(X_train)
        self.model.fit(X_train_scaled, y_train)
        logger.info("Model training completed")
        
    def predict(self, features: Dict[str, float]) -> Tuple[bool, float]:
        if self.model is None:
            self.load_model()
            
        feature_vector = np.array([features.get(f, 0) for f in self.feature_names]).reshape(1, -1)
        feature_vector_scaled = self.scaler.transform(feature_vector)
        
        try:
            fraud_probability = self.model.predict_proba(feature_vector_scaled)[0][1]
            is_fraud = fraud_probability >= settings.FRAUD_DETECTION_THRESHOLD
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            # Fallback for safety
            return False, 0.0
        
        return is_fraud, fraud_probability

    def extract_features(self, transaction_data: Dict) -> Dict[str, float]:
        features = {}
        features['amount'] = transaction_data.get('amount', 0)
        from datetime import datetime
        timestamp = transaction_data.get('timestamp', datetime.utcnow())
        
        # Convert string timestamp if necessary
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp)
            except:
                timestamp = datetime.utcnow()
                
        features['hour'] = timestamp.hour
        features['day_of_week'] = timestamp.weekday()
        features['is_weekend'] = 1 if timestamp.weekday() >= 5 else 0
        features['transaction_velocity'] = transaction_data.get('transaction_velocity', 0)
        features['avg_transaction_amount'] = transaction_data.get('avg_transaction_amount', 0)
        features['account_age_days'] = transaction_data.get('account_age_days', 0)
        features['distance_from_home'] = transaction_data.get('distance_from_home', 0)
        features['new_device'] = 1 if transaction_data.get('new_device', False) else 0
        features['vpn_usage'] = 1 if transaction_data.get('vpn_usage', False) else 0
        features['failed_login_attempts'] = transaction_data.get('failed_login_attempts', 0)
        return features

    def save_model(self):
        os.makedirs(settings.MODEL_PATH, exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }, self.model_path)
        
    def load_model(self):
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.feature_names = data['feature_names']
            logger.info(f"Model loaded from {self.model_path}")
        else:
            logger.warning("No saved model found, using default model")
            self.model = GradientBoostingClassifier(random_state=42)
            
            # FIX: Create 2 samples with different classes (0 and 1)
            # This ensures the classifier knows there are two possibilities
            X_dummy = np.zeros((2, len(self.feature_names)))
            y_dummy = np.array([0, 1]) 
            
            self.scaler.fit(X_dummy)
            self.model.fit(X_dummy, y_dummy)

fraud_detector = FraudDetector()

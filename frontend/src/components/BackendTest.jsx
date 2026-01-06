import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';

const BackendTest = () => {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const data = await dashboardService.getMetrics();
        if (data) {
          setMetrics(data);
          setStatus('✅ Connected to AEGIS Backend');
        } else {
          setStatus('❌ Backend connected but returned no data');
        }
      } catch (err) {
        setStatus('❌ Failed to connect (Is backend running on port 8000?)');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', border: '2px solid #333', margin: '20px', borderRadius: '8px' }}>
      <h2>System Status: {status}</h2>
      
      {metrics && (
        <div style={{ marginTop: '10px' }}>
          <h3>Live Data from Python:</h3>
          <ul>
            <li>Fraud Rate: <strong>{metrics.fraudDetectionRate}%</strong></li>
            <li>Suspicious Txns: <strong>{metrics.suspiciousTransactions}</strong></li>
            <li>Confirmed Frauds: <strong>{metrics.confirmedFrauds}</strong></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BackendTest;
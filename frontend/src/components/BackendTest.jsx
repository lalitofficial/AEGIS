import React, { useEffect, useState } from 'react';
import { dashboardMetrics } from '../data/mockData';
import { dashboardService } from '../services/api';
import { usePresentationMode } from '../utils/presentationMode';

const BackendTest = () => {
  const [presentationMode] = usePresentationMode();
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('Connecting to API...');
  const [latencyMs, setLatencyMs] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      if (presentationMode) {
        setMetrics(dashboardMetrics);
        setStatus('Presentation mode active');
        setLatencyMs(Math.floor(120 + Math.random() * 60));
        return;
      }

      try {
        const { data, latencyMs: measuredLatency } = await dashboardService.getMetricsWithLatency();
        if (data) {
          setMetrics(data);
          setStatus('Connected to AEGIS API');
          setLatencyMs(measuredLatency);
        } else {
          setStatus('API reachable but returned no data');
        }
      } catch (err) {
        setStatus('Connection failed. Verify API on port 8000.');
        setLatencyMs(null);
      }
    };

    testConnection();
  }, [presentationMode]);

  return (
    <div className="aegis-panel-soft rounded-2xl p-5 border border-slate-800/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">System Link</p>
          <h3 className="text-lg font-semibold text-white mt-1">API Control Plane</h3>
          <p className="text-sm text-slate-400 mt-1">{status}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Latency</p>
          <p className="text-2xl font-semibold text-cyan-300">
            {latencyMs ? `${latencyMs}ms` : '--'}
          </p>
        </div>
      </div>
      
      {metrics && (
        <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/70">
            <p className="text-xs text-slate-400">Fraud Rate</p>
            <p className="text-lg font-semibold text-emerald-300">{metrics.fraudDetectionRate}%</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/70">
            <p className="text-xs text-slate-400">Suspicious</p>
            <p className="text-lg font-semibold text-amber-300">{metrics.suspiciousTransactions}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/70">
            <p className="text-xs text-slate-400">Confirmed</p>
            <p className="text-lg font-semibold text-rose-300">{metrics.confirmedFrauds}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendTest;

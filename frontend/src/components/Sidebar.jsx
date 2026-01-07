import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shield, AlertTriangle, FileText, Database, Activity } from 'lucide-react';
import { fraudService } from '../services/api';
import { recentFraudAlerts } from '../data/mockData';
import { usePresentationMode } from '../utils/presentationMode';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [presentationMode, setPresentationMode] = usePresentationMode();
  const [activeInvestigations, setActiveInvestigations] = useState(0);
  const [aiConfidence, setAiConfidence] = useState(78);
  
  const menuItems = [
    { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { path: '/fraud-alerts', label: 'Fraud Triage', icon: AlertTriangle },
    { path: '/risk-analysis', label: 'Risk Signals', icon: Shield },
    { path: '/compliance', label: 'Compliance', icon: FileText },
    { path: '/monitored-accounts', label: 'Account Watchlist', icon: Database },
  ];

  useEffect(() => {
    let isMounted = true;

    const computeStats = (alerts) => {
      const investigations = (alerts || []).filter(
        (alert) => alert.status === 'Under Investigation'
      ).length;
      const scores = (alerts || [])
        .map((alert) => alert.risk_score ?? alert.riskScore ?? 0)
        .filter((score) => score > 0);
      const avgScore = scores.length
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 78;

      return {
        investigations,
        confidence: Math.min(100, Math.max(50, avgScore)),
      };
    };

    const loadStats = async () => {
      if (presentationMode) {
        if (!isMounted) {
          return;
        }
        const { investigations, confidence } = computeStats(recentFraudAlerts);
        setActiveInvestigations(investigations);
        setAiConfidence(confidence);
        return;
      }

      const alerts = await fraudService.getRecentAlerts(50);
      if (!isMounted) {
        return;
      }
      const { investigations, confidence } = computeStats(alerts || []);
      setActiveInvestigations(investigations);
      setAiConfidence(confidence);
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [presentationMode]);

  return (
    <aside className={`fixed left-0 top-16 h-full bg-slate-950/70 border-r border-slate-800/60 backdrop-blur-xl transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-0'
    } overflow-hidden z-40`}>
      <nav className="p-4 h-full flex flex-col">
        <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-4">Operations</div>
        <ul className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-200 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 aegis-panel-soft rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <Activity className="w-4 h-4 text-cyan-300" />
            Pulse Status
          </div>
          <div className="text-xs text-slate-400">Active investigations</div>
          <div className="text-2xl font-semibold text-amber-300">{activeInvestigations}</div>
          <div className="mt-3 text-xs text-slate-400">AI confidence</div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2"
              style={{ width: `${aiConfidence}%` }}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Presentation Mode</span>
              <button
                className={`px-2 py-1 rounded-full border text-[11px] ${
                  presentationMode
                    ? 'border-amber-400 text-amber-300'
                    : 'border-slate-700 text-slate-400'
                }`}
                onClick={() => setPresentationMode(!presentationMode)}
              >
                {presentationMode ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

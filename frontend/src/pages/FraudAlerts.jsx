import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Shield, Activity, Search, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import FraudCard from '../components/FraudCard';
import { fraudTrendData, fraudTypeDistribution as mockFraudTypeDistribution, recentFraudAlerts } from '../data/mockData';
import { dashboardService, fraudService } from '../services/api';
import GraphView from '../components/GraphView'; // <-- NEW IMPORT
import { usePresentationMode } from '../utils/presentationMode';

const FraudAlerts = () => {
  const [presentationMode] = usePresentationMode();
  const [alerts, setAlerts] = useState([]);
  const [fraudTrends, setFraudTrends] = useState([]);
  const [fraudTypeDistribution, setFraudTypeDistribution] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (presentationMode) {
        if (!isMounted) {
          return;
        }
        setAlerts(recentFraudAlerts);
        setFraudTrends(fraudTrendData);
        setFraudTypeDistribution(mockFraudTypeDistribution);
        return;
      }

      const [alertsData, trendsData, distributionData] = await Promise.all([
        fraudService.getRecentAlerts(50),
        dashboardService.getFraudTrends(),
        dashboardService.getFraudTypeDistribution(),
      ]);

      if (!isMounted) return;
      setAlerts(alertsData || []);
      setFraudTrends(trendsData || []);
      setFraudTypeDistribution(distributionData || []);
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [presentationMode]);

  const formattedAlerts = useMemo(() => {
    return alerts.map((alert) => ({
      id: alert.id,
      type: alert.type || 'Unknown Fraud',
      transactionId: alert.transaction_id || alert.transactionId || 'N/A',
      amount: alert.amount || 0,
      customer: alert.customer_name || alert.customer || 'Unknown',
      customerId: alert.customer_id || alert.customerId || 'N/A',
      riskScore: alert.risk_score ?? alert.riskScore ?? 0,
      indicators: alert.indicators || [],
      status: alert.status || 'Pending Review',
      time: alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Just now',
    }));
  }, [alerts]);

  const { activeInvestigations, blockedCount, pendingCount, successRate } = useMemo(() => {
    let investigations = 0;
    let blocked = 0;
    let pending = 0;
    alerts.forEach((alert) => {
      if (alert.status === 'Under Investigation') investigations += 1;
      if (alert.status === 'Blocked') blocked += 1;
      if (alert.status === 'Pending Review') pending += 1;
    });
    const total = alerts.length;
    const rate = total ? ((blocked / total) * 100).toFixed(1) : '0.0';
    return {
      activeInvestigations: investigations,
      blockedCount: blocked,
      pendingCount: pending,
      successRate: rate,
    };
  }, [alerts]);

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') {
      return '--';
    }
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const triageItems = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => {
      const scoreA = a.risk_score ?? a.riskScore ?? 0;
      const scoreB = b.risk_score ?? b.riskScore ?? 0;
      return scoreB - scoreA;
    });

    return sorted.slice(0, 4).map((alert, index) => {
      const score = alert.risk_score ?? alert.riskScore ?? 0;
      const etaMinutes = Math.max(8, Math.round(45 - score / 3));
      let status = 'Review';
      if (alert.status === 'Blocked') status = 'Blocked';
      if (alert.status === 'Under Investigation') status = 'Investigate';
      return {
        id: alert.id || index,
        title: `${alert.type || 'Fraud Alert'} · ${alert.transaction_id || alert.transactionId || 'N/A'}`,
        status,
        owner: alert.customer_name || alert.customer || 'Ops Team',
        eta: `${etaMinutes}m`,
        amount: formatCurrency(alert.amount),
      };
    });
  }, [alerts]);
  const getQueueStatus = (status) => {
    switch (status) {
      case 'Blocked':
        return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
      case 'Investigate':
        return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Fraud Alerts</h1>
        <p className="text-slate-400">Monitor and investigate suspicious transactions in real-time</p>
      </div>

      {/* Fraud Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-yellow-400" />
            <span className="text-slate-400">Active Investigations</span>
          </div>
          <p className="text-3xl font-bold text-white">{activeInvestigations}</p>
          <p className="text-sm text-slate-500 mt-1">Currently being reviewed</p>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-slate-400">Blocked Today</span>
          </div>
          <p className="text-3xl font-bold text-white">{blockedCount.toLocaleString()}</p>
          <p className="text-sm text-slate-500 mt-1">{successRate}% success rate</p>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <span className="text-slate-400">Pending Review</span>
          </div>
          <p className="text-3xl font-bold text-white">{pendingCount}</p>
          <p className="text-sm text-slate-500 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        {/* Fraud Types Distribution */}
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <h3 className="text-lg font-semibold text-white mb-4">Fraud Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fraudTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percentage }) => `${type}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {fraudTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Triage Queue</h3>
            <button className="text-xs text-cyan-300 flex items-center gap-1">
              View board <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {triageItems.map((item) => (
              <div key={item.id} className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getQueueStatus(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>Owner: {item.owner}</span>
                  <span>ETA {item.eta}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-amber-300">{item.amount}</span>
                  <button className="text-xs text-cyan-300">Open case</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Auto-approve low risk
            </button>
            <button className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-200 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-300" />
              Block high-risk BINs
            </button>
          </div>
        </div>
      </div>

      <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
        <h3 className="text-lg font-semibold text-white mb-4">Fraud Trends by Type</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={fraudTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Bar dataKey="cardFraud" fill="#ef4444" name="Card Fraud" />
            <Bar dataKey="accountTakeover" fill="#f97316" name="Account Takeover" />
            <Bar dataKey="identityTheft" fill="#38bdf8" name="Identity Theft" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* === GRAPH VIEW INTEGRATION START === */}
      <div className="mb-6">
        <GraphView /> 
      </div>
      {/* === GRAPH VIEW INTEGRATION END === */}

      {/* Search and Filter */}
      
      <div className="aegis-panel rounded-2xl p-4 border border-slate-800/70">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Customer ID, or Name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select className="px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500">
            <option>All Types</option>
            <option>Card Fraud</option>
            <option>Account Takeover</option>
            <option>Identity Theft</option>
            <option>Payment Fraud</option>
          </select>
          <select className="px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500">
            <option>All Statuses</option>
            <option>Blocked</option>
            <option>Under Investigation</option>
            <option>Pending Review</option>
          </select>
        </div>
      </div>

      {/* All Fraud Alerts List */}
      <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
        <h3 className="text-lg font-semibold text-white mb-4">All Detected Frauds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formattedAlerts.map((fraud) => (
            <FraudCard key={fraud.id} fraud={fraud} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FraudAlerts;

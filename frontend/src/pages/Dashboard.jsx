import React, { useEffect, useMemo, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingDown, ArrowUpRight, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import MetricCard from '../components/MetricCard';
import FraudCard from '../components/FraudCard';
import BackendTest from '../components/BackendTest';
import { dashboardMetrics, fraudDetectionPosture, fraudTrendData, monitoredAccounts, recentFraudAlerts } from '../data/mockData';
import { accountsService, dashboardService, fraudService } from '../services/api';
import { usePresentationMode } from '../utils/presentationMode';

const Dashboard = () => {
  const [presentationMode] = usePresentationMode();
  const [metrics, setMetrics] = useState(null);
  const [fraudTrends, setFraudTrends] = useState([]);
  const [detectionPosture, setDetectionPosture] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [monitoredSummary, setMonitoredSummary] = useState([]);
  const [showBrief, setShowBrief] = useState(false);
  const [showScenario, setShowScenario] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('card_testing');
  const [scenarioResult, setScenarioResult] = useState(null);
  const [briefCopied, setBriefCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (presentationMode) {
        if (!isMounted) {
          return;
        }
        setMetrics(dashboardMetrics);
        setFraudTrends(fraudTrendData);
        setDetectionPosture(fraudDetectionPosture);
        setRecentAlerts(recentFraudAlerts);
        setMonitoredSummary(monitoredAccounts);
        return;
      }

      const [
        metricsData,
        trendsData,
        postureData,
        alertsData,
        accountsData,
      ] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getFraudTrends(),
        dashboardService.getDetectionPosture(),
        fraudService.getRecentAlerts(6),
        accountsService.getMonitoredAccounts(),
      ]);

      if (!isMounted) return;
      setMetrics(metricsData);
      setFraudTrends(trendsData || []);
      setDetectionPosture(postureData || []);
      setRecentAlerts(alertsData || []);
      setMonitoredSummary(accountsData || []);
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [presentationMode]);

  const riskIndex = useMemo(() => {
    if (!detectionPosture.length) return 86;
    const totalScore = detectionPosture.reduce((sum, item) => sum + (item.score || 0), 0);
    return Math.round(totalScore / detectionPosture.length);
  }, [detectionPosture]);

  const totalAccounts = useMemo(() => {
    return monitoredSummary.reduce((sum, account) => sum + (account.count || 0), 0);
  }, [monitoredSummary]);

  const modelsTotal = useMemo(() => {
    return detectionPosture.length || 12;
  }, [detectionPosture]);

  const modelsOnline = useMemo(() => {
    if (!detectionPosture.length) {
      return 12;
    }
    const onlineCount = detectionPosture.filter((model) => (model.score || 0) >= 75).length;
    return onlineCount || detectionPosture.length;
  }, [detectionPosture]);

  const responseSlaMinutes = useMemo(() => {
    if (!recentAlerts.length) {
      return 2.4;
    }
    const avgRisk = recentAlerts.reduce((sum, alert) => {
      const score = alert.risk_score ?? alert.riskScore ?? 0;
      return sum + score;
    }, 0) / recentAlerts.length;
    const scaled = 4.8 - (avgRisk / 100) * 2.4;
    return Number(Math.max(1.4, scaled).toFixed(1));
  }, [recentAlerts]);

  const handoffMinutes = useMemo(() => {
    if (!recentAlerts.length) {
      return 12;
    }
    const latest = recentAlerts[0];
    if (latest.created_at) {
      const deltaMs = Date.now() - new Date(latest.created_at).getTime();
      if (!Number.isNaN(deltaMs)) {
        return Math.max(1, Math.round(deltaMs / 60000));
      }
    }
    if (latest.time) {
      const match = latest.time.match(/(\d+)\s*min/i);
      if (match) {
        return Number(match[1]);
      }
    }
    return 12;
  }, [recentAlerts]);

  const escalationCount = useMemo(() => {
    return recentAlerts.filter((alert) =>
      ['Under Investigation', 'Pending Review'].includes(alert.status)
    ).length;
  }, [recentAlerts]);

  const formattedAlerts = useMemo(() => {
    return recentAlerts.map((alert) => ({
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
  }, [recentAlerts]);

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') {
      return '--';
    }
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const liveSignals = useMemo(() => {
    return formattedAlerts.slice(0, 4).map((alert, index) => {
      const riskScore = alert.riskScore || 0;
      let severity = 'low';
      if (riskScore >= 90) severity = 'critical';
      else if (riskScore >= 75) severity = 'high';
      else if (riskScore >= 60) severity = 'medium';
      return {
        id: alert.id || index,
        title: `${alert.type} signal`,
        detail: `${alert.customer} · ${formatCurrency(alert.amount)}`,
        severity,
        time: alert.time,
      };
    });
  }, [formattedAlerts]);

  const modelHealth = useMemo(() => {
    if (!detectionPosture.length) {
      return [];
    }
    return detectionPosture.slice(0, 4).map((model) => {
      const score = model.score || 0;
      const latency = Math.max(80, Math.round(180 - score));
      const drift = score >= 85 ? 'Stable' : score >= 70 ? 'Moderate' : 'High';
      return {
        name: model.category,
        score,
        latency: `${latency}ms`,
        drift,
      };
    });
  }, [detectionPosture]);

  const driftAlerts = useMemo(() => {
    if (!detectionPosture.length) {
      return 0;
    }
    return detectionPosture.filter((model) => (model.score || 0) < 80).length;
  }, [detectionPosture]);

  const responsePlaybooks = useMemo(() => {
    if (!recentAlerts.length) {
      return [];
    }
    const typeCounts = recentAlerts.reduce((acc, alert) => {
      const type = alert.type || 'Unknown Fraud';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => {
        const eta = Math.max(8, Math.round(30 - count * 2));
        return {
          title: `${type} Response`,
          coverage: `${count} cases`,
          description: `Auto-triage for ${type.toLowerCase()} patterns`,
          eta: `${eta}m`,
        };
      });
  }, [recentAlerts]);

  const fraudDetectionRate = metrics?.fraudDetectionRate ?? 0;
  const suspiciousTransactions = metrics?.suspiciousTransactions ?? 0;
  const confirmedFrauds = metrics?.confirmedFrauds ?? 0;
  const falsePositiveRate = metrics?.falsePositiveRate ?? 0;
  const topAlertType = useMemo(() => {
    if (!recentAlerts.length) {
      return 'Card Testing';
    }
    const counts = recentAlerts.reduce((acc, alert) => {
      const type = alert.type || 'Unknown Fraud';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const [topType] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return topType || 'Card Testing';
  }, [recentAlerts]);

  const briefSummary = useMemo(() => {
    return [
      `AEGIS Command Brief · ${new Date().toLocaleString()}`,
      `Risk Index: ${riskIndex}`,
      `Fraud Detection Rate: ${fraudDetectionRate}%`,
      `Suspicious Transactions: ${suspiciousTransactions}`,
      `Confirmed Frauds: ${confirmedFrauds}`,
      `False Positive Rate: ${falsePositiveRate}%`,
      `Top Alert Type: ${topAlertType}`,
      `Escalations: ${escalationCount}`,
      `Avg Response SLA: ${responseSlaMinutes}m`,
      `Last Handoff: ${handoffMinutes}m ago`,
    ].join('\n');
  }, [
    riskIndex,
    fraudDetectionRate,
    suspiciousTransactions,
    confirmedFrauds,
    falsePositiveRate,
    topAlertType,
    escalationCount,
    responseSlaMinutes,
    handoffMinutes,
  ]);

  const scenarioOptions = [
    {
      id: 'card_testing',
      label: 'Card testing surge',
      description: 'Rapid low-value burst across new cards',
      fraudMultiplier: 1.35,
      slaDelta: 0.6,
      riskDelta: 4,
    },
    {
      id: 'account_takeover',
      label: 'Account takeover wave',
      description: 'Credential stuffing + device anomalies',
      fraudMultiplier: 1.5,
      slaDelta: 0.9,
      riskDelta: 6,
    },
    {
      id: 'merchant_breach',
      label: 'Merchant breach',
      description: 'Compromised merchant ecosystem',
      fraudMultiplier: 1.25,
      slaDelta: 0.4,
      riskDelta: 3,
    },
  ];

  const handleCopyBrief = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(briefSummary);
      }
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 1600);
    } catch (error) {
      setBriefCopied(false);
    }
  };

  const handleRunScenario = () => {
    const scenario = scenarioOptions.find((option) => option.id === selectedScenario);
    if (!scenario) {
      return;
    }
    const projectedSuspicious = Math.round(suspiciousTransactions * scenario.fraudMultiplier);
    const projectedBlocked = Math.round(confirmedFrauds * scenario.fraudMultiplier);
    const projectedRate = Math.min(99, Math.max(70, fraudDetectionRate - scenario.slaDelta * 2));
    const projectedRisk = Math.min(99, riskIndex + scenario.riskDelta);
    const projectedSla = Number((responseSlaMinutes + scenario.slaDelta).toFixed(1));

    setScenarioResult({
      scenario: scenario.label,
      suspicious: projectedSuspicious,
      blocked: projectedBlocked,
      detectionRate: projectedRate,
      riskIndex: projectedRisk,
      responseSla: projectedSla,
    });
  };

  const getSignalColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-rose-300 bg-rose-500/10 border-rose-500/30';
      case 'high':
        return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
      case 'medium':
        return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6 aegis-fade" style={{ animationDelay: '0.05s' }}>
        <div className="aegis-panel rounded-3xl p-6 border border-slate-800/70 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
          </div>
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AEGIS Command Center</p>
                <h1 className="text-3xl font-bold text-white mt-2">Fraud Detection Operations</h1>
                <p className="text-slate-400 mt-2 max-w-xl">
                  Live monitoring across high-value accounts, high-risk merchants, and real-time transaction flows.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-200 text-sm"
                  onClick={() => setShowBrief(true)}
                >
                  Generate Brief
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-cyan-500/90 hover:bg-cyan-500 text-white text-sm font-semibold flex items-center gap-2"
                  onClick={() => setShowScenario(true)}
                >
                  <Zap className="w-4 h-4" />
                  Run Scenario
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="aegis-panel-soft rounded-2xl p-4">
                <p className="text-xs text-slate-400">Risk Surface Index</p>
                <p className="text-2xl font-semibold text-amber-300">{riskIndex}</p>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-amber-400 to-rose-400 h-2 rounded-full" style={{ width: `${riskIndex}%` }} />
                </div>
              </div>
              <div className="aegis-panel-soft rounded-2xl p-4">
                <p className="text-xs text-slate-400">Active Coverage</p>
                <p className="text-2xl font-semibold text-cyan-300">{totalAccounts.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Accounts monitored</p>
              </div>
              <div className="aegis-panel-soft rounded-2xl p-4">
                <p className="text-xs text-slate-400">Models Online</p>
                <p className="text-2xl font-semibold text-emerald-300">{modelsOnline}/{modelsTotal}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {driftAlerts ? `${driftAlerts} drift alerts` : 'No drift alerts'}
                </p>
              </div>
              <div className="aegis-panel-soft rounded-2xl p-4">
                <p className="text-xs text-slate-400">Response SLA</p>
                <p className="text-2xl font-semibold text-rose-300">{responseSlaMinutes}m</p>
                <p className="text-xs text-slate-500 mt-1">Avg. case resolution</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <BackendTest />
          <div className="aegis-panel-soft rounded-2xl p-5 border border-slate-800/70">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">On-call Analyst</p>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-lg font-semibold text-white">Kavya Mehta</p>
                <p className="text-sm text-slate-400">Fraud Ops Lead</p>
              </div>
              <button className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-200 text-sm">
                Ping
              </button>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Last handoff {handoffMinutes}m ago · Escalations {escalationCount}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 aegis-fade" style={{ animationDelay: '0.1s' }}>
        <MetricCard
          title="Fraud Detection Rate"
          value={`${fraudDetectionRate}%`}
          icon={Shield}
          color="cyan"
          subtitle="System effectiveness"
          trend={2.3}
        />
        <MetricCard
          title="Suspicious Transactions"
          value={suspiciousTransactions.toLocaleString()}
          icon={AlertTriangle}
          color="red"
          subtitle="Flagged today"
          trend={-5.2}
        />
        <MetricCard
          title="Confirmed Frauds"
          value={confirmedFrauds}
          icon={CheckCircle}
          color="yellow"
          subtitle="After investigation"
          trend={-12.5}
        />
        <MetricCard
          title="False Positive Rate"
          value={`${falsePositiveRate}%`}
          icon={TrendingDown}
          color="green"
          subtitle="Legitimate flagged"
          trend={-3.1}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 aegis-fade" style={{ animationDelay: '0.15s' }}>
        {/* Fraud Activity Chart */}
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <h3 className="text-lg font-semibold text-white mb-4">Fraud Activity (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fraudTrends}>
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
              <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} name="Total Frauds" />
              <Line type="monotone" dataKey="blocked" stroke="#22c55e" strokeWidth={2} name="Blocked" />
              <Line type="monotone" dataKey="cardFraud" stroke="#f59e0b" strokeWidth={2} name="Card Fraud" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud Detection Posture Radar */}
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <h3 className="text-lg font-semibold text-white mb-4">Detection Capabilities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={detectionPosture}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis stroke="#94a3b8" />
              <Radar name="Score" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operations Pulse */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 aegis-fade" style={{ animationDelay: '0.2s' }}>
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Live Signals</h3>
            <span className="text-xs text-slate-400">Last 30 minutes</span>
          </div>
          <div className="space-y-3">
            {liveSignals.map((signal) => (
              <div key={signal.id} className="flex items-start justify-between gap-3 bg-slate-900/60 border border-slate-800/70 rounded-xl p-3">
                <div>
                  <p className="text-sm text-white font-medium">{signal.title}</p>
                  <p className="text-xs text-slate-400">{signal.detail}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getSignalColor(signal.severity)}`}>
                    {signal.severity}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{signal.time}</p>
                </div>
              </div>
            ))}
            {!liveSignals.length && (
              <div className="text-xs text-slate-500">No live signals available.</div>
            )}
          </div>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Model Health</h3>
            <span className="text-xs text-slate-400">Drift + latency</span>
          </div>
          <div className="space-y-4">
            {modelHealth.map((model) => (
              <div key={model.name} className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{model.name}</p>
                  <span className="text-xs text-slate-400">{model.latency}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400">Confidence</span>
                  <span className="text-xs text-emerald-300">{model.score}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full" style={{ width: `${model.score}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-2">Drift: {model.drift}</div>
              </div>
            ))}
            {!modelHealth.length && (
              <div className="text-xs text-slate-500">No model telemetry available.</div>
            )}
          </div>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Response Playbooks</h3>
            <button className="text-xs text-cyan-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {responsePlaybooks.map((playbook) => (
              <div key={playbook.title} className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{playbook.title}</p>
                  <span className="text-xs text-amber-300">{playbook.coverage}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{playbook.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">{playbook.eta}</span>
                  <button className="text-xs text-cyan-300">Run</button>
                </div>
              </div>
            ))}
            {!responsePlaybooks.length && (
              <div className="text-xs text-slate-500">No playbooks generated.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Fraud Alerts */}
      <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Fraud Alerts</h3>
          <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formattedAlerts.slice(0, 3).map((fraud) => (
            <FraudCard key={fraud.id} fraud={fraud} />
          ))}
        </div>
      </div>

      {showBrief && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setShowBrief(false)}
        >
          <div
            className="aegis-panel rounded-2xl p-6 border border-slate-800/70 max-w-2xl w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Command Brief</p>
                <h3 className="text-xl font-semibold text-white mt-1">Executive Summary</h3>
              </div>
              <button
                className="text-xs text-slate-400 hover:text-white"
                onClick={() => setShowBrief(false)}
              >
                Close
              </button>
            </div>
            <pre className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 whitespace-pre-wrap">
              {briefSummary}
            </pre>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Snapshot from live telemetry · {new Date().toLocaleTimeString()}
              </span>
              <button
                className="px-3 py-2 rounded-lg bg-cyan-500/90 hover:bg-cyan-500 text-white text-xs font-semibold"
                onClick={handleCopyBrief}
              >
                {briefCopied ? 'Copied' : 'Copy Summary'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScenario && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setShowScenario(false)}
        >
          <div
            className="aegis-panel rounded-2xl p-6 border border-slate-800/70 max-w-3xl w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario Lab</p>
                <h3 className="text-xl font-semibold text-white mt-1">Run Response Simulation</h3>
              </div>
              <button
                className="text-xs text-slate-400 hover:text-white"
                onClick={() => setShowScenario(false)}
              >
                Close
              </button>
            </div>
            <div className="grid md:grid-cols-[1fr_1.2fr] gap-4">
              <div className="space-y-3">
                {scenarioOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`w-full text-left p-3 rounded-xl border ${
                      selectedScenario === option.id
                        ? 'border-cyan-500/60 bg-cyan-500/10'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                    onClick={() => {
                      setSelectedScenario(option.id);
                      setScenarioResult(null);
                    }}
                  >
                    <p className="text-sm text-white font-semibold">{option.label}</p>
                    <p className="text-xs text-slate-400">{option.description}</p>
                  </button>
                ))}
                <button
                  className="w-full px-4 py-2 rounded-lg bg-cyan-500/90 hover:bg-cyan-500 text-white text-sm font-semibold"
                  onClick={handleRunScenario}
                >
                  Simulate Impact
                </button>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Projected Impact</p>
                {scenarioResult ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="aegis-panel-soft rounded-xl p-3 border border-slate-800/70">
                      <p className="text-xs text-slate-400">Suspicious Transactions</p>
                      <p className="text-lg font-semibold text-amber-300">{scenarioResult.suspicious}</p>
                    </div>
                    <div className="aegis-panel-soft rounded-xl p-3 border border-slate-800/70">
                      <p className="text-xs text-slate-400">Blocked Frauds</p>
                      <p className="text-lg font-semibold text-emerald-300">{scenarioResult.blocked}</p>
                    </div>
                    <div className="aegis-panel-soft rounded-xl p-3 border border-slate-800/70">
                      <p className="text-xs text-slate-400">Detection Rate</p>
                      <p className="text-lg font-semibold text-cyan-300">{scenarioResult.detectionRate}%</p>
                    </div>
                    <div className="aegis-panel-soft rounded-xl p-3 border border-slate-800/70">
                      <p className="text-xs text-slate-400">Response SLA</p>
                      <p className="text-lg font-semibold text-rose-300">{scenarioResult.responseSla}m</p>
                    </div>
                    <div className="aegis-panel-soft rounded-xl p-3 border border-slate-800/70 col-span-2">
                      <p className="text-xs text-slate-400">Risk Index</p>
                      <p className="text-lg font-semibold text-amber-300">{scenarioResult.riskIndex}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Select a scenario and run the simulation.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

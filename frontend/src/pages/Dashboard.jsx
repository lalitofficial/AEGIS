import React from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import MetricCard from '../components/MetricCard';
import FraudCard from '../components/FraudCard';
import { dashboardMetrics, recentFraudAlerts, fraudTrendData, fraudDetectionPosture } from '../data/mockData';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Fraud Detection Dashboard</h1>
        <p className="text-slate-400">Real-time overview of fraud detection and prevention</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Fraud Detection Rate"
          value={`${dashboardMetrics.fraudDetectionRate}%`}
          icon={Shield}
          color="cyan"
          subtitle="System effectiveness"
          trend={2.3}
        />
        <MetricCard
          title="Suspicious Transactions"
          value={dashboardMetrics.suspiciousTransactions.toLocaleString()}
          icon={AlertTriangle}
          color="red"
          subtitle="Flagged today"
          trend={-5.2}
        />
        <MetricCard
          title="Confirmed Frauds"
          value={dashboardMetrics.confirmedFrauds}
          icon={CheckCircle}
          color="yellow"
          subtitle="After investigation"
          trend={-12.5}
        />
        <MetricCard
          title="False Positive Rate"
          value={`${dashboardMetrics.falsePositiveRate}%`}
          icon={TrendingDown}
          color="green"
          subtitle="Legitimate flagged"
          trend={-3.1}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud Activity Chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Fraud Activity (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fraudTrendData}>
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
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Detection Capabilities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={fraudDetectionPosture}>
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

      {/* Recent Fraud Alerts */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Fraud Alerts</h3>
          <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentFraudAlerts.slice(0, 3).map((fraud) => (
            <FraudCard key={fraud.id} fraud={fraud} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
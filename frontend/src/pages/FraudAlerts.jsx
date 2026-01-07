import React from 'react';
import { AlertTriangle, Shield, Activity, Search, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import FraudCard from '../components/FraudCard';
import { recentFraudAlerts, fraudTrendData, fraudTypeDistribution, triageQueue } from '../data/mockData';
import GraphView from '../components/GraphView'; // <-- NEW IMPORT

const FraudAlerts = () => {
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
          <p className="text-3xl font-bold text-white">18</p>
          <p className="text-sm text-slate-500 mt-1">Currently being reviewed</p>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-slate-400">Blocked Today</span>
          </div>
          <p className="text-3xl font-bold text-white">1,247</p>
          <p className="text-sm text-slate-500 mt-1">98.6% success rate</p>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <span className="text-slate-400">Pending Review</span>
          </div>
          <p className="text-3xl font-bold text-white">5</p>
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
            {triageQueue.map((item) => (
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
          <BarChart data={fraudTrendData}>
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
          {recentFraudAlerts.map((fraud) => (
            <FraudCard key={fraud.id} fraud={fraud} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FraudAlerts;

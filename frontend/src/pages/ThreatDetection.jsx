import React from 'react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ThreatCard from '../components/ThreatCard';
import { recentThreats, threatTrendData } from '../data/mockData';

const ThreatDetection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Threat Detection</h1>
        <p className="text-slate-400">Monitor and analyze security threats in real-time</p>
      </div>

      {/* Threat Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-slate-400">Active Threats</span>
          </div>
          <p className="text-3xl font-bold text-white">18</p>
          <p className="text-sm text-slate-500 mt-1">Being monitored</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-slate-400">Blocked Today</span>
          </div>
          <p className="text-3xl font-bold text-white">1,247</p>
          <p className="text-sm text-slate-500 mt-1">98.6% success rate</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-yellow-400" />
            <span className="text-slate-400">Under Investigation</span>
          </div>
          <p className="text-3xl font-bold text-white">5</p>
          <p className="text-sm text-slate-500 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Threat Types Chart */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Threat Distribution by Type</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={threatTrendData}>
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
            <Bar dataKey="malware" fill="#f59e0b" name="Malware" />
            <Bar dataKey="phishing" fill="#8b5cf6" name="Phishing" />
            <Bar dataKey="ddos" fill="#ef4444" name="DDoS" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* All Threats List */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">All Detected Threats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentThreats.map((threat) => (
            <ThreatCard key={threat.id} threat={threat} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThreatDetection;
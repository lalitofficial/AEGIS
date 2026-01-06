import React from 'react';
import { FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { complianceFrameworks } from '../data/mockData';

const Compliance = () => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Compliant': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'Needs Review': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'Non-Compliant': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Compliant': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'Needs Review': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'Non-Compliant': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Compliance Management</h1>
        <p className="text-slate-400">Monitor compliance across security frameworks and regulations</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span className="text-slate-400">Frameworks Monitored</span>
          </div>
          <p className="text-3xl font-bold text-white">{complianceFrameworks.length}</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-slate-400">Compliant</span>
          </div>
          <p className="text-3xl font-bold text-green-400">4</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-yellow-500/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <span className="text-slate-400">Needs Review</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">1</p>
        </div>
      </div>

      {/* Compliance Scores Chart */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Compliance Framework Scores</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={complianceFrameworks} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="score" fill="#06b6d4" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complianceFrameworks.map((framework) => (
          <div key={framework.name} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-cyan-500/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{framework.name}</h3>
                  <p className="text-sm text-slate-400">Last audit: {framework.lastAudit}</p>
                </div>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Compliance Score</span>
                <span className={`text-2xl font-bold ${
                  framework.score >= 90 ? 'text-green-400' : 
                  framework.score >= 80 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {framework.score}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    framework.score >= 90 ? 'bg-green-400' : 
                    framework.score >= 80 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${framework.score}%` }}
                ></div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {getStatusIcon(framework.status)}
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(framework.status)}`}>
                {framework.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Requirements */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Compliance Activities</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">SOC 2 Audit Completed</p>
                <p className="text-sm text-slate-400">All controls passed - Nov 1, 2024</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">3 days ago</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white font-medium">HIPAA Review Required</p>
                <p className="text-sm text-slate-400">3 controls need attention</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">1 week ago</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">PCI DSS Certification Renewed</p>
                <p className="text-sm text-slate-400">Valid until Oct 28, 2025</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">1 week ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compliance;
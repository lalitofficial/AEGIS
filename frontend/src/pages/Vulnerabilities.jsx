import React from 'react';
import { Shield, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { vulnerabilityData } from '../data/mockData';

const Vulnerabilities = () => {
  const totalVulnerabilities = vulnerabilityData.reduce((sum, item) => sum + item.count, 0);

  const vulnerabilityDetails = [
    { 
      id: 1, 
      cve: 'CVE-2024-1234', 
      title: 'Remote Code Execution in Apache Server', 
      severity: 'Critical', 
      cvss: 9.8,
      affectedAssets: 12,
      status: 'Open',
      discovered: '2024-12-01'
    },
    { 
      id: 2, 
      cve: 'CVE-2024-5678', 
      title: 'SQL Injection in Web Application', 
      severity: 'High', 
      cvss: 8.2,
      affectedAssets: 5,
      status: 'In Progress',
      discovered: '2024-11-28'
    },
    { 
      id: 3, 
      cve: 'CVE-2024-9012', 
      title: 'Cross-Site Scripting (XSS) Vulnerability', 
      severity: 'Medium', 
      cvss: 6.1,
      affectedAssets: 18,
      status: 'Open',
      discovered: '2024-11-25'
    },
    { 
      id: 4, 
      cve: 'CVE-2024-3456', 
      title: 'Privilege Escalation in OS Kernel', 
      severity: 'Critical', 
      cvss: 9.3,
      affectedAssets: 8,
      status: 'Patched',
      discovered: '2024-11-20'
    },
    { 
      id: 5, 
      cve: 'CVE-2024-7890', 
      title: 'Weak Authentication Mechanism', 
      severity: 'High', 
      cvss: 7.5,
      affectedAssets: 24,
      status: 'Open',
      discovered: '2024-12-03'
    },
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'Low': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Patched': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'Open': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Vulnerability Management</h1>
        <p className="text-slate-400">Track and remediate security vulnerabilities</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Total Vulnerabilities</p>
          <p className="text-3xl font-bold text-white">{totalVulnerabilities}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-red-500/20">
          <p className="text-slate-400 text-sm mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-400">8</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-orange-500/20">
          <p className="text-slate-400 text-sm mb-1">High</p>
          <p className="text-3xl font-bold text-orange-400">23</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-yellow-500/20">
          <p className="text-slate-400 text-sm mb-1">Medium</p>
          <p className="text-3xl font-bold text-yellow-400">45</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vulnerabilityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ severity, count }) => `${severity}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {vulnerabilityData.map((entry, index) => (
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

        {/* Bar Chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Vulnerabilities by Severity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vulnerabilityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="severity" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vulnerability Details Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Vulnerability Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">CVE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">CVSS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Affected Assets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Discovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {vulnerabilityDetails.map((vuln) => (
                <tr key={vuln.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-cyan-400 font-mono text-sm">{vuln.cve}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-200 text-sm">{vuln.title}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-200 text-sm font-semibold">{vuln.cvss}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-slate-200 text-sm">{vuln.affectedAssets}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(vuln.status)}
                      <span className="text-slate-300 text-sm">{vuln.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-400 text-sm">{vuln.discovered}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vulnerabilities;
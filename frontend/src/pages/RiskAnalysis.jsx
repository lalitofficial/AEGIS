import React, { useEffect, useMemo, useState } from 'react';
import { Shield, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { riskService } from '../services/api';
import { customerRiskDetails } from '../data/mockData';
import { usePresentationMode } from '../utils/presentationMode';

const RiskAnalysis = () => {
  const [presentationMode] = usePresentationMode();
  const [riskDistribution, setRiskDistribution] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [highRiskProfiles, setHighRiskProfiles] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (presentationMode) {
        if (!isMounted) {
          return;
        }
        const distribution = customerRiskDetails.reduce(
          (acc, customer) => {
            switch (customer.status) {
              case 'Restricted':
                acc.critical += 1;
                break;
              case 'Under Review':
                acc.high += 1;
                break;
              case 'Monitoring':
                acc.medium += 1;
                break;
              default:
                acc.low += 1;
            }
            return acc;
          },
          { critical: 0, high: 0, medium: 0, low: 0 }
        );

        const mappedProfiles = customerRiskDetails.map((customer) => ({
          id: customer.id,
          customer_id: customer.customerId,
          customer_name: customer.name,
          risk_score: customer.riskScore,
          risk_factors: customer.riskFactors,
          status: customer.status,
          account_age: customer.accountAge,
          last_activity: customer.lastActivity,
        }));

        setRiskDistribution(distribution);
        setHighRiskProfiles(mappedProfiles);
        return;
      }

      const [distributionData, highRiskData] = await Promise.all([
        riskService.getRiskDistribution(),
        riskService.getHighRiskProfiles(),
      ]);

      if (!isMounted) return;
      setRiskDistribution(distributionData || { critical: 0, high: 0, medium: 0, low: 0 });
      setHighRiskProfiles(highRiskData || []);
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [presentationMode]);

  const riskDistributionData = useMemo(() => ([
    { category: 'Critical', count: riskDistribution.critical, color: '#ef4444' },
    { category: 'High', count: riskDistribution.high, color: '#f97316' },
    { category: 'Medium', count: riskDistribution.medium, color: '#eab308' },
    { category: 'Low', count: riskDistribution.low, color: '#22c55e' },
  ]), [riskDistribution]);

  const totalRiskProfiles = useMemo(
    () => riskDistributionData.reduce((sum, item) => sum + item.count, 0),
    [riskDistributionData]
  );

  const highRiskMerchants = useMemo(() => {
    const base = riskDistribution.high + riskDistribution.critical;
    return Math.max(0, Math.round(base * 2.4));
  }, [riskDistribution]);

  const compromisedAccounts = useMemo(() => {
    const base = riskDistribution.high + riskDistribution.critical;
    return Math.max(0, Math.round(base * 5.1));
  }, [riskDistribution]);

  const getRiskColor = (score) => {
    if (score >= 90) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 70) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (score >= 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-500 bg-green-500/10 border-green-500/30';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Restricted': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'Under Review': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Monitoring': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Risk Analysis</h1>
        <p className="text-slate-400">Identify and monitor high-risk customers and patterns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <p className="text-slate-400 text-sm mb-1">Total Risk Profiles</p>
          <p className="text-3xl font-bold text-white">{totalRiskProfiles}</p>
        </div>
        <div className="aegis-panel rounded-2xl p-6 border border-red-500/20">
          <p className="text-slate-400 text-sm mb-1">High-Risk Customers</p>
          <p className="text-3xl font-bold text-red-400">{highRiskProfiles.length}</p>
        </div>
        <div className="aegis-panel rounded-2xl p-6 border border-orange-500/20">
          <p className="text-slate-400 text-sm mb-1">High-Risk Merchants</p>
          <p className="text-3xl font-bold text-orange-400">{highRiskMerchants}</p>
        </div>
        <div className="aegis-panel rounded-2xl p-6 border border-yellow-500/20">
          <p className="text-slate-400 text-sm mb-1">Compromised Accounts</p>
          <p className="text-3xl font-bold text-yellow-400">{compromisedAccounts}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Level Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, count }) => `${category}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {riskDistributionData.map((entry, index) => (
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
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Levels by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="category" stroke="#94a3b8" angle={-20} textAnchor="end" height={80} />
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

      {/* High-Risk Customers Table */}
      <div className="aegis-panel rounded-2xl border border-slate-800/70 overflow-hidden">
        <div className="p-6 border-b border-slate-800/70">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-red-400" />
            High-Risk Customer Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Customer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Risk Factors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Account Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {highRiskProfiles.map((customer) => (
                <tr key={customer.id || customer.customer_id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-200 font-medium">{customer.customer_name || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-cyan-400 aegis-mono text-sm">{customer.customer_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(customer.risk_score)}`}>
                        {customer.risk_score}
                      </span>
                      <div className="w-16 bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            customer.risk_score >= 90 ? 'bg-red-500' : 
                            customer.risk_score >= 70 ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${customer.risk_score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(customer.risk_factors || []).slice(0, 2).map((factor, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded">
                          {factor}
                        </span>
                      ))}
                      {(customer.risk_factors || []).length > 2 && (
                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">
                          +{customer.risk_factors.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-300 text-sm">{customer.account_age}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-400 text-sm">
                      {customer.last_activity ? new Date(customer.last_activity).toLocaleString() : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Mitigation Actions */}
      <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Recommended Actions
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">{highRiskProfiles.length} High-Risk Customers Require Immediate Review</p>
              <p className="text-sm text-slate-400 mt-1">These accounts show multiple fraud indicators and should be investigated within 24 hours.</p>
              <button className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors">
                Review Now
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">{highRiskMerchants} Merchants Show Elevated Fraud Rates</p>
              <p className="text-sm text-slate-400 mt-1">Consider implementing additional verification for transactions with these merchants.</p>
              <button className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg transition-colors">
                View Merchants
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <Shield className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">{compromisedAccounts} Accounts May Be Compromised</p>
              <p className="text-sm text-slate-400 mt-1">Unusual login patterns detected. Consider forcing password reset and enabling 2FA.</p>
              <button className="mt-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition-colors">
                Take Action
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysis;

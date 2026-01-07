import React, { useEffect, useMemo, useState } from 'react';
import { Database, CreditCard, Briefcase, Smartphone, TrendingUp, CheckCircle, AlertTriangle, XCircle, DollarSign } from 'lucide-react';
import { accountsService } from '../services/api';
import { monitoredAccounts as mockMonitoredAccounts } from '../data/mockData';
import { usePresentationMode } from '../utils/presentationMode';

const MonitoredAccounts = () => {
  const [presentationMode] = usePresentationMode();
  const [monitoredAccounts, setMonitoredAccounts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      if (presentationMode) {
        if (!isMounted) {
          return;
        }
        setMonitoredAccounts(mockMonitoredAccounts);
        return;
      }

      const data = await accountsService.getMonitoredAccounts();
      if (!isMounted) return;
      setMonitoredAccounts(data || []);
    };

    loadAccounts();
    return () => {
      isMounted = false;
    };
  }, [presentationMode]);

  const totalAccounts = useMemo(
    () => monitoredAccounts.reduce((sum, account) => sum + (account.count || 0), 0),
    [monitoredAccounts]
  );
  const totalClean = useMemo(
    () => monitoredAccounts.reduce((sum, account) => sum + (account.clean || 0), 0),
    [monitoredAccounts]
  );
  const totalFlagged = useMemo(
    () => monitoredAccounts.reduce((sum, account) => sum + (account.flagged || 0), 0),
    [monitoredAccounts]
  );

  const getStatusIcon = (status) => {
    switch(status) {
      case 'healthy': return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'warning':
      case 'watch':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'critical': return <XCircle className="w-6 h-6 text-red-400" />;
      default: return null;
    }
  };

  const getAccountIcon = (name) => {
    if (name.includes('Checking')) return Database;
    if (name.includes('Business')) return Briefcase;
    if (name.includes('Credit')) return CreditCard;
    if (name.includes('Merchant')) return TrendingUp;
    if (name.includes('High-Value')) return DollarSign;
    return Smartphone;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Monitored Accounts</h1>
        <p className="text-slate-400">Track and monitor all customer accounts for fraudulent activity</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-cyan-400" />
            <span className="text-slate-400">Total Accounts</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalAccounts.toLocaleString()}</p>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-slate-400">Clean Accounts</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{totalClean.toLocaleString()}</p>
          <p className="text-sm text-slate-500 mt-1">
            {totalAccounts ? ((totalClean / totalAccounts) * 100).toFixed(1) : '0.0'}% of total
          </p>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-slate-400">Flagged Accounts</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{totalFlagged}</p>
          <p className="text-sm text-slate-500 mt-1">Require attention</p>
        </div>
      </div>

      {/* Account Categories List */}
      <div className="space-y-4">
        {monitoredAccounts.map((account) => {
          const AccountIcon = getAccountIcon(account.name);
          const cleanRate = account.count ? ((account.clean / account.count) * 100).toFixed(1) : '0.0';
          
          return (
            <div key={account.name} className="aegis-panel rounded-2xl p-6 border border-slate-800/70 hover:border-cyan-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {getStatusIcon(account.status)}
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <AccountIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                      <p className="text-sm text-slate-400">Last scan: {account.lastScan}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-400">{cleanRate}%</p>
                  <p className="text-sm text-slate-400">Clean Rate</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-slate-900/60 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Total</p>
                  <p className="text-xl font-bold text-white">{account.count.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-slate-400 text-sm mb-1">Clean</p>
                  <p className="text-xl font-bold text-green-400">{account.clean.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-slate-400 text-sm mb-1">Flagged</p>
                  <p className="text-xl font-bold text-red-400">{account.flagged}</p>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-slate-400 text-sm mb-1">Transactions (30d)</p>
                  <p className="text-xl font-bold text-amber-300">{account.transactionVolume}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden mb-4">
                <div 
                  className="bg-gradient-to-r from-green-500 to-cyan-500 h-3 transition-all duration-500"
                  style={{ width: `${cleanRate}%` }}
                ></div>
              </div>

              {/* Status Badge and Actions */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  account.status === 'healthy' ? 'text-green-400 bg-green-500/10 border border-green-500/30' :
                  account.status === 'warning' || account.status === 'watch' ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/30' :
                  'text-red-400 bg-red-500/10 border border-red-500/30'
                }`}>
                  {(account.status || 'healthy').replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                    View Details
                  </button>
                  {account.flagged > 0 && (
                    <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition-colors">
                      Review Flagged ({account.flagged})
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monitoring Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Activity Trends */}
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Account Activity Trends
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">New Accounts (Today)</span>
              <span className="text-green-400 font-bold">+127</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Closed Accounts (Today)</span>
              <span className="text-red-400 font-bold">-18</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Suspended (Active)</span>
              <span className="text-red-400 font-bold">38</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Under Investigation</span>
              <span className="text-yellow-400 font-bold">92</span>
            </div>
          </div>
        </div>

        {/* High-Priority Alerts */}
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            High-Priority Alerts
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-red-400 font-semibold text-sm">Critical Alert</span>
                <span className="text-xs text-slate-400">5 min ago</span>
              </div>
              <p className="text-slate-300 text-sm">11 high-value accounts showing suspicious login patterns</p>
            </div>
            
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-orange-400 font-semibold text-sm">High Priority</span>
                <span className="text-xs text-slate-400">15 min ago</span>
              </div>
              <p className="text-slate-300 text-sm">22 credit card accounts with unusual transaction velocity</p>
            </div>
            
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-yellow-400 font-semibold text-sm">Medium Priority</span>
                <span className="text-xs text-slate-400">1 hour ago</span>
              </div>
              <p className="text-slate-300 text-sm">50 business accounts require KYC documentation update</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Monitoring Settings */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <Database className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-white mb-2">Monitoring Configuration</h4>
            <p className="text-sm text-slate-300 mb-4">
              All accounts are continuously monitored using real-time fraud detection algorithms. 
              High-value accounts have enhanced monitoring with manual review requirements.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-900/60 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Scan Frequency</p>
                <p className="text-white font-semibold">Every 15 minutes</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Risk Models Active</p>
                <p className="text-white font-semibold">12 ML Models</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Coverage</p>
                <p className="text-white font-semibold">100% of accounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Account Actions */}
      <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Account Actions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium">Account Suspended - CUST-45632</p>
                <p className="text-sm text-slate-400">Multiple fraudulent transactions detected</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">2 min ago</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-medium">Enhanced Monitoring Enabled - CUST-78921</p>
                <p className="text-sm text-slate-400">Unusual login pattern from new device</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">15 min ago</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Account Verified - CUST-12398</p>
                <p className="text-sm text-slate-400">Customer identity confirmed via KYC process</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">1 hour ago</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">Batch Scan Completed</p>
                <p className="text-sm text-slate-400">25,487 accounts scanned - 92 flagged for review</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">2 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoredAccounts;

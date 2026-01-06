import React from 'react';
import { AlertTriangle, IndianRupee } from 'lucide-react';

const FraudCard = ({ fraud }) => {
  const getRiskColor = (score) => {
    if (score >= 90) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 70) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (score >= 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-500 bg-green-500/10 border-green-500/30';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Blocked': return 'text-red-400 bg-red-500/10';
      case 'Under Investigation': return 'text-yellow-400 bg-yellow-500/10';
      case 'Pending Review': return 'text-orange-400 bg-orange-500/10';
      case 'Approved with Warning': return 'text-green-400 bg-green-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-cyan-500/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <span className="font-semibold text-white">{fraud.type}</span>
            <p className="text-xs text-slate-400 font-mono">{fraud.transactionId}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(fraud.riskScore)}`}>
          Risk: {fraud.riskScore}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Amount:</span>
          <span className="text-green-400 font-bold flex items-center gap-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-base"></span>
            {fraud.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">Customer:</span>
          <span className="text-slate-300">{fraud.customer}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Customer ID:</span>
          <span className="text-slate-300 font-mono text-xs">{fraud.customerId}</span>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="mb-3">
        <p className="text-xs text-slate-400 mb-1">Risk Indicators:</p>
        <div className="flex flex-wrap gap-1">
          {fraud.indicators.map((indicator, index) => (
            <span key={index} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded">
              {indicator}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(fraud.status)}`}>
          {fraud.status}
        </span>
        <span className="text-xs text-slate-400">{fraud.time}</span>
      </div>
    </div>
  );
};

export default FraudCard;
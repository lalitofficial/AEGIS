import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ThreatCard = ({ threat }) => {
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'Low': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-cyan-500/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="font-semibold text-white">{threat.type}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(threat.severity)}`}>
          {threat.severity}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Source:</span>
          <span className="text-slate-300 font-mono text-xs">{threat.source}</span>
        </div>
        {threat.target && (
          <div className="flex justify-between">
            <span className="text-slate-400">Target:</span>
            <span className="text-slate-300">{threat.target}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-400">Status:</span>
          <span className="text-green-400 font-medium">{threat.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Time:</span>
          <span className="text-slate-300">{threat.time}</span>
        </div>
      </div>
    </div>
  );
};

export default ThreatCard;
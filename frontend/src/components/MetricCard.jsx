import React from 'react';

const MetricCard = ({ title, value, icon: Icon, color = 'cyan', subtitle, trend }) => {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-6 border ${colorClasses[color].split(' ').slice(1).join(' ')} hover:border-opacity-50 transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color].split(' ')[0]}`}>
          <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[2]}`} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <div>
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold ${colorClasses[color].split(' ')[2]}`}>{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
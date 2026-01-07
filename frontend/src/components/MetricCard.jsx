import React from 'react';

const MetricCard = ({ title, value, icon: Icon, color = 'cyan', subtitle, trend }) => {
  const colorClasses = {
    cyan: { icon: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-300' },
    red: { icon: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-300' },
    green: { icon: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300' },
    yellow: { icon: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300' },
    blue: { icon: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-300' },
  };
  const palette = colorClasses[color] || colorClasses.cyan;

  return (
    <div className={`aegis-panel rounded-2xl p-6 border ${palette.border} hover:border-opacity-70 transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${palette.icon}`}>
          <Icon className={`w-6 h-6 ${palette.text}`} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <div>
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold ${palette.text}`}>{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default MetricCard;

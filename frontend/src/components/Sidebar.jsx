import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shield, AlertTriangle, FileText, Database, Activity } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { path: '/fraud-alerts', label: 'Fraud Triage', icon: AlertTriangle },
    { path: '/risk-analysis', label: 'Risk Signals', icon: Shield },
    { path: '/compliance', label: 'Compliance', icon: FileText },
    { path: '/monitored-accounts', label: 'Account Watchlist', icon: Database },
  ];

  return (
    <aside className={`fixed left-0 top-16 h-full bg-slate-950/70 border-r border-slate-800/60 backdrop-blur-xl transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-0'
    } overflow-hidden z-40`}>
      <nav className="p-4 h-full flex flex-col">
        <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-4">Operations</div>
        <ul className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-200 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 aegis-panel-soft rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <Activity className="w-4 h-4 text-cyan-300" />
            Pulse Status
          </div>
          <div className="text-xs text-slate-400">Active investigations</div>
          <div className="text-2xl font-semibold text-amber-300">18</div>
          <div className="mt-3 text-xs text-slate-400">AI confidence</div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2 w-[78%]" />
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

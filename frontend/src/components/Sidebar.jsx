import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shield, AlertTriangle, FileText, Database } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  
const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/fraud-alerts', label: 'Fraud Alerts', icon: AlertTriangle },         // New
  { path: '/risk-analysis', label: 'Risk Analysis', icon: Shield },             // New
  { path: '/compliance', label: 'Compliance', icon: FileText },
  { path: '/monitored-accounts', label: 'Monitored Accounts', icon: Database }, // New
];

  return (
    <aside className={`fixed left-0 top-16 h-full bg-slate-800 border-r border-slate-700 transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-0'
    } overflow-hidden z-40`}>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
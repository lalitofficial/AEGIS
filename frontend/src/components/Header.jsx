import React from 'react';
import { Shield, Menu, Bell, Settings, User, Search, Zap } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-slate-950/70 border-b border-slate-800/60 fixed top-0 left-0 right-0 z-50 backdrop-blur-xl">
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800/70 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 aegis-glow">
                <Shield className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-cyan-300 aegis-text-glow">AEGIS</h1>
                <p className="text-xs text-slate-400">Risk Intelligence Command Center</p>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden lg:flex flex-1 max-w-xl items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions, accounts, cases..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900/70 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Right side - Status and Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="aegis-chip px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest">
                Active
              </span>
              <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-full px-3 py-1">
                <Zap className="w-4 h-4 text-amber-300" />
                <span className="text-xs text-slate-300">Risk Index</span>
                <span className="text-sm font-semibold text-amber-300 aegis-mono">86</span>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-full px-3 py-1">
                <span className="text-xs text-slate-300">Latency</span>
                <span className="text-sm font-semibold text-cyan-300 aegis-mono">142ms</span>
              </div>
            </div>
            
            <button className="px-4 py-2 rounded-lg bg-cyan-500/90 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
              Create Case
            </button>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

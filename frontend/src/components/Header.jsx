import React from 'react';
import { Shield, Menu, Bell, Settings, User } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 fixed top-0 left-0 right-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-cyan-400">AEGIS</h1>
                <p className="text-xs text-slate-400">Fraud Detection Platform</p>
              </div>
            </div>
          </div>

          {/* Right side - Status and Actions */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-slate-400">Detection Status</div>
              <div className="text-lg font-bold text-green-400">ACTIVE</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-400">Monitored Accounts</div>
              <div className="text-lg font-bold text-cyan-400">25,487</div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
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
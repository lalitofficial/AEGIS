import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FraudAlerts from './pages/FraudAlerts';
import RiskAnalysis from './pages/RiskAnalysis';
import Compliance from './pages/Compliance';
import MonitoredAccounts from './pages/MonitoredAccounts';
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="min-h-screen text-white aegis-shell">
        <div className="aegis-orb orb-1" aria-hidden="true" />
        <div className="aegis-orb orb-2" aria-hidden="true" />
        <div className="aegis-orb orb-3" aria-hidden="true" />
        <div className="aegis-grid" aria-hidden="true" />
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex relative z-10">
          <Sidebar isOpen={sidebarOpen} />
          
          <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} mt-16`}>
            <div className="p-6">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/fraud-alerts" element={<FraudAlerts />} />
                <Route path="/risk-analysis" element={<RiskAnalysis />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/monitored-accounts" element={<MonitoredAccounts />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

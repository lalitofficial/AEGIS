import React, { useEffect, useRef, useState } from 'react';
import { Shield, Menu, Bell, Settings, User, Search, Zap } from 'lucide-react';
import { dashboardService, fraudService } from '../services/api';
import { fraudDetectionPosture, recentFraudAlerts } from '../data/mockData';
import { usePresentationMode } from '../utils/presentationMode';
import { useUiSettings } from '../utils/uiSettings';

const Header = ({ toggleSidebar }) => {
  const [presentationMode, setPresentationMode] = usePresentationMode();
  const [uiSettings, setUiSettings, resetUiSettings] = useUiSettings();
  const [riskIndex, setRiskIndex] = useState(86);
  const [latencyMs, setLatencyMs] = useState(null);
  const [alertItems, setAlertItems] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const alertsRef = useRef(null);
  const profileRef = useRef(null);
  const settingsRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target)) {
        setShowAlerts(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const computeRiskIndex = (posture) => {
      if (!posture || posture.length === 0) {
        return 86;
      }
      const totalScore = posture.reduce((sum, item) => sum + (item.score || 0), 0);
      return Math.round(totalScore / posture.length);
    };

    const computeAlertCount = (alerts) => {
      const active = (alerts || []).filter((alert) =>
        ['Under Investigation', 'Pending Review'].includes(alert.status)
      );
      return active.length || (alerts || []).length;
    };

    const loadHeaderData = async () => {
      if (presentationMode) {
        if (!isMounted) {
          return;
        }
        setRiskIndex(computeRiskIndex(fraudDetectionPosture));
        setLatencyMs(Math.floor(120 + Math.random() * 60));
        setAlertItems(recentFraudAlerts);
        setAlertCount(computeAlertCount(recentFraudAlerts));
        return;
      }

      const [{ latencyMs: measuredLatency }, postureData, alertsData] = await Promise.all([
        dashboardService.getMetricsWithLatency(),
        dashboardService.getDetectionPosture(),
        fraudService.getRecentAlerts(6),
      ]);

      if (!isMounted) {
        return;
      }
      setLatencyMs(measuredLatency);
      setRiskIndex(computeRiskIndex(postureData));
      setAlertItems(alertsData || []);
      setAlertCount(computeAlertCount(alertsData || []));
    };

    loadHeaderData();
    return () => {
      isMounted = false;
    };
  }, [presentationMode]);

  const formatAlertTime = (alert) => {
    if (alert.time) {
      return alert.time;
    }
    if (alert.created_at) {
      return new Date(alert.created_at).toLocaleTimeString();
    }
    return 'Just now';
  };

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    const query = searchQuery.toLowerCase();
    return (alertItems || []).filter((alert) => {
      const type = (alert.type || '').toLowerCase();
      const customer = (alert.customer_name || alert.customer || '').toLowerCase();
      const transaction = (alert.transaction_id || alert.transactionId || '').toLowerCase();
      return type.includes(query) || customer.includes(query) || transaction.includes(query);
    });
  }, [searchQuery, alertItems]);

  const accentOptions = [
    { id: 'cyan', label: 'Cyan' },
    { id: 'emerald', label: 'Emerald' },
    { id: 'amber', label: 'Amber' },
    { id: 'rose', label: 'Rose' },
    { id: 'violet', label: 'Violet' },
  ];

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
            <div className="relative w-full" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions, accounts, cases..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900/70 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
              />
              {showSearch && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-slate-950 border border-slate-800 rounded-xl shadow-xl p-3 z-50">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Search Results</div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium">{alert.type || 'Fraud Alert'}</span>
                          <span className="text-xs text-slate-400">{formatAlertTime(alert)}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {(alert.customer_name || alert.customer || 'Unknown')} · {alert.status || 'Pending'}
                        </p>
                      </div>
                    ))}
                    {!searchResults.length && (
                      <div className="text-xs text-slate-400">No matches found.</div>
                    )}
                  </div>
                </div>
              )}
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
                <span className="text-sm font-semibold text-amber-300 aegis-mono">{riskIndex}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-full px-3 py-1">
                <span className="text-xs text-slate-300">Latency</span>
                <span className="text-sm font-semibold text-cyan-300 aegis-mono">
                  {latencyMs ? `${latencyMs}ms` : '--'}
                </span>
              </div>
            </div>
            
            <button className="px-4 py-2 rounded-lg bg-cyan-500/90 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
              Create Case
            </button>
            
            <div className="flex items-center gap-2">
              <div className="relative" ref={alertsRef}>
                <button
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors relative"
                  onClick={() => {
                    setShowAlerts((prev) => !prev);
                    setShowProfile(false);
                  }}
                  aria-expanded={showAlerts}
                >
                  <Bell className="w-5 h-5" />
                  {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {alertCount}
                    </span>
                  )}
                </button>
                {showAlerts && (
                  <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-800 rounded-xl shadow-xl p-3 z-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Alerts</span>
                      <span className="text-xs text-slate-400">{alertCount} active</span>
                    </div>
                    <div className="space-y-2">
                      {(alertItems || []).slice(0, 4).map((alert) => (
                        <div key={alert.id} className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white font-medium">{alert.type || 'Fraud Alert'}</span>
                            <span className="text-xs text-slate-400">{formatAlertTime(alert)}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {(alert.customer_name || alert.customer || 'Unknown')} · {alert.status || 'Pending'}
                          </p>
                        </div>
                      ))}
                      {!alertItems?.length && (
                        <div className="text-xs text-slate-500">No alerts available.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative" ref={settingsRef}>
                <button
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors"
                  onClick={() => {
                    setShowSettings((prev) => !prev);
                    setShowAlerts(false);
                    setShowProfile(false);
                  }}
                  aria-expanded={showSettings}
                >
                  <Settings className="w-5 h-5" />
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-800 rounded-xl shadow-xl p-4 z-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">UI Settings</span>
                      <button
                        className="text-xs text-slate-400 hover:text-white"
                        onClick={resetUiSettings}
                      >
                        Reset
                      </button>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Accent</p>
                        <div className="flex flex-wrap gap-2">
                          {accentOptions.map((option) => (
                            <button
                              key={option.id}
                              className={`px-3 py-1 rounded-full border text-xs ${
                                uiSettings.accent === option.id
                                  ? 'border-cyan-300 text-cyan-200'
                                  : 'border-slate-700 text-slate-400'
                              }`}
                              onClick={() => setUiSettings({ accent: option.id })}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Presentation Mode</p>
                          <p className="text-xs text-slate-500">Force demo data</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={presentationMode}
                          onChange={(event) => setPresentationMode(event.target.checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Background Grid</p>
                          <p className="text-xs text-slate-500">Toggle the tactical grid</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={uiSettings.showGrid}
                          onChange={(event) => setUiSettings({ showGrid: event.target.checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Floating Orbs</p>
                          <p className="text-xs text-slate-500">Ambient visuals</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={uiSettings.showOrbs}
                          onChange={(event) => setUiSettings({ showOrbs: event.target.checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Reduce Motion</p>
                          <p className="text-xs text-slate-500">Disable animations</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={uiSettings.motion === 'reduce'}
                          onChange={(event) =>
                            setUiSettings({ motion: event.target.checked ? 'reduce' : 'normal' })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">High Contrast</p>
                          <p className="text-xs text-slate-500">Sharper panels</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={uiSettings.contrast === 'high'}
                          onChange={(event) =>
                            setUiSettings({ contrast: event.target.checked ? 'high' : 'default' })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Scanlines</p>
                          <p className="text-xs text-slate-500">Retro diagnostics overlay</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={uiSettings.scanlines}
                          onChange={(event) => setUiSettings({ scanlines: event.target.checked })}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Panel Opacity</span>
                          <span>{Math.round(uiSettings.panelOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.65"
                          max="0.95"
                          step="0.01"
                          value={uiSettings.panelOpacity}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setUiSettings({
                              panelOpacity: value,
                              panelSoftOpacity: Math.max(0.5, value - 0.15),
                            });
                          }}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Font Scale</span>
                          <span>{uiSettings.fontScale.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.9"
                          max="1.1"
                          step="0.02"
                          value={uiSettings.fontScale}
                          onChange={(event) => setUiSettings({ fontScale: Number(event.target.value) })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Glow Intensity</span>
                          <span>{uiSettings.glowIntensity.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.06"
                          max="0.35"
                          step="0.01"
                          value={uiSettings.glowIntensity}
                          onChange={(event) => setUiSettings({ glowIntensity: Number(event.target.value) })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Corner Radius</span>
                          <span>{uiSettings.radius}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="32"
                          step="2"
                          value={uiSettings.radius}
                          onChange={(event) => setUiSettings({ radius: Number(event.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative" ref={profileRef}>
                <button
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors"
                  onClick={() => {
                    setShowProfile((prev) => !prev);
                    setShowAlerts(false);
                  }}
                  aria-expanded={showProfile}
                >
                  <User className="w-5 h-5" />
                </button>
                {showProfile && (
                  <div className="absolute right-0 mt-3 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-xl p-3 z-50">
                    <div className="text-xs text-slate-500">Signed in</div>
                    <div className="text-sm text-white font-medium mt-1">AEGIS Analyst</div>
                    <div className="mt-3 space-y-2">
                      <button className="w-full text-left text-xs text-slate-300 hover:text-white">
                        View profile
                      </button>
                      <button className="w-full text-left text-xs text-slate-300 hover:text-white">
                        Settings
                      </button>
                      <button className="w-full text-left text-xs text-slate-300 hover:text-white">
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

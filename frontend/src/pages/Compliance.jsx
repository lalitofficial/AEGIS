import React, { useEffect, useMemo, useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, Clock, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { complianceService } from '../services/api';
import { complianceFrameworks as mockFrameworks } from '../data/mockData';
import { usePresentationMode } from '../utils/presentationMode';

const Compliance = () => {
  const [presentationMode] = usePresentationMode();
  const [frameworks, setFrameworks] = useState([]);
  const [activities, setActivities] = useState([]);

  const mockActivities = [
    {
      id: 1,
      activity: 'KYC Documentation Completed',
      description: 'All new customer verifications processed - Dec 1, 2024',
      status: 'completed',
      date: '2024-12-01',
    },
    {
      id: 2,
      activity: 'AML Transaction Monitoring Active',
      description: 'Suspicious activity reports filed for Nov 2024',
      status: 'completed',
      date: '2024-11-28',
    },
    {
      id: 3,
      activity: 'SOX Audit Review Required',
      description: 'Financial controls need quarterly assessment',
      status: 'pending',
      date: '2024-11-20',
    },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (presentationMode) {
        if (!isMounted) {
          return;
        }
        setFrameworks(mockFrameworks);
        setActivities(mockActivities);
        return;
      }

      const [frameworkData, activityData] = await Promise.all([
        complianceService.getFrameworks(),
        complianceService.getActivities(),
      ]);

      if (!isMounted) return;
      setFrameworks(frameworkData || []);
      setActivities(activityData || []);
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [presentationMode]);

  const compliantCount = useMemo(
    () => frameworks.filter((framework) => framework.status === 'Compliant').length,
    [frameworks]
  );
  const reviewCount = useMemo(
    () => frameworks.filter((framework) => framework.status === 'Needs Review').length,
    [frameworks]
  );

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const items = [];

    frameworks.forEach((framework) => {
      const auditValue = framework.last_audit || framework.lastAudit;
      const auditDate = auditValue ? new Date(auditValue) : null;
      if (!auditDate || Number.isNaN(auditDate.getTime())) {
        return;
      }
      const dueDate = new Date(auditDate);
      dueDate.setDate(dueDate.getDate() + 90);
      const daysRemaining = Math.max(1, Math.ceil((dueDate - now) / 86400000));
      items.push({
        label: `${framework.name} review`,
        daysRemaining,
      });
    });

    activities
      .filter((activity) => activity.status !== 'completed')
      .forEach((activity) => {
        const activityDate = activity.date ? new Date(activity.date) : null;
        const daysRemaining = activityDate && !Number.isNaN(activityDate.getTime())
          ? Math.max(1, Math.ceil((activityDate - now) / 86400000))
          : 14;
        items.push({
          label: activity.activity,
          daysRemaining,
        });
      });

    return items
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 3);
  }, [frameworks, activities]);

  const formattedFrameworks = useMemo(() => {
    return frameworks.map((framework) => ({
      ...framework,
      lastAudit: framework.last_audit || framework.lastAudit || 'N/A',
    }));
  }, [frameworks]);
  const getStatusColor = (status) => {
    switch(status) {
      case 'Compliant': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'Needs Review': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'Non-Compliant': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Compliant': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'Needs Review': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'Non-Compliant': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Regulatory Compliance</h1>
        <p className="text-slate-400">Monitor compliance across financial regulations and security frameworks</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span className="text-slate-400">Frameworks Monitored</span>
          </div>
          <p className="text-3xl font-bold text-white">{frameworks.length}</p>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-slate-400">Compliant</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{compliantCount}</p>
        </div>

        <div className="aegis-panel rounded-2xl p-6 border border-yellow-500/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <span className="text-slate-400">Needs Review</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{reviewCount}</p>
        </div>
      </div>

      {/* Compliance Scores Chart */}
      <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
        <h3 className="text-lg font-semibold text-white mb-4">Compliance Framework Scores</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={formattedFrameworks} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="score" fill="#06b6d4" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formattedFrameworks.map((framework) => (
          <div key={framework.id || framework.name} className="aegis-panel rounded-2xl p-6 border border-slate-800/70 hover:border-cyan-500/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Shield className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{framework.name}</h3>
                  <p className="text-xs text-slate-400">{framework.description}</p>
                </div>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Compliance Score</span>
                <span className={`text-2xl font-bold ${
                  framework.score >= 90 ? 'text-green-400' : 
                  framework.score >= 80 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {framework.score}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    framework.score >= 90 ? 'bg-green-400' : 
                    framework.score >= 80 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${framework.score}%` }}
                ></div>
              </div>
            </div>

            {/* Status and Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(framework.status)}
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(framework.status)}`}>
                  {framework.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">Last audit: {framework.lastAudit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Activities */}
      <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Compliance Activities</h3>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id || activity.activity} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                {activity.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                )}
                <div>
                  <p className="text-white font-medium">{activity.activity}</p>
                  <p className="text-sm text-slate-400">{activity.description}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">
                {activity.date ? new Date(activity.date).toLocaleDateString() : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory Requirements Alert */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-white mb-2">Upcoming Compliance Deadlines</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {upcomingDeadlines.map((deadline) => {
                let color = 'bg-green-400';
                if (deadline.daysRemaining <= 15) {
                  color = 'bg-yellow-400';
                } else if (deadline.daysRemaining <= 30) {
                  color = 'bg-cyan-400';
                }
                return (
                  <li key={deadline.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${color} rounded-full`}></span>
                    {deadline.label} - Due in {deadline.daysRemaining} days
                  </li>
                );
              })}
              {upcomingDeadlines.length === 0 && (
                <li className="text-slate-400">No upcoming deadlines recorded.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compliance;

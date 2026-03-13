import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, CheckCircle2, BookMarked, Database, Plus, ChevronRight, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { researchApi } from '@/api/client';

const STATUS_STYLES = {
  pending:   'text-amber-400 bg-amber-400/10 border border-amber-400/20',
  running:   'text-blue-400 bg-blue-400/10 border border-blue-400/20',
  completed: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  failed:    'text-red-400 bg-red-400/10 border border-red-400/20',
};

function MetricCard({ label, value, icon: Icon, color, bg, loading }) {
  return (
    <div data-testid={`metric-${label.toLowerCase().replace(' ', '-')}`}
      className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
      </div>
      <p style={{ fontFamily: 'Manrope, sans-serif' }}
        className={`text-2xl font-bold ${loading ? 'text-slate-700 animate-pulse' : 'text-white'}`}>
        {loading ? '—' : value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, h] = await Promise.all([researchApi.getStats(), researchApi.getHistory()]);
        setStats(s.data);
        setHistory(h.data.slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = [
    { label: 'Total Runs',    value: stats?.total_runs ?? 0,          icon: BarChart2,    color: 'text-indigo-400',  bg: 'bg-indigo-400/10' },
    { label: 'Success Rate',  value: stats ? `${stats.success_rate}%` : '0%', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Templates',     value: stats?.templates_count ?? 0,      icon: BookMarked,   color: 'text-purple-400',  bg: 'bg-purple-400/10' },
    { label: 'Total Results', value: stats?.total_results ?? 0,        icon: Database,     color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Manrope, sans-serif' }}
          className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
        <p className="text-slate-400 mt-1 text-sm">Your automated research operations at a glance.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => <MetricCard key={m.label} {...m} loading={loading} />)}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-semibold text-white">Recent Research Runs</h2>
            <button onClick={() => navigate('/history')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight size={12} />
            </button>
          </div>

          <div data-testid="recent-research-list" className="divide-y divide-slate-800">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex gap-3">
                  <div className="flex-1">
                    <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : history.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <Clock size={28} className="mx-auto mb-3 text-slate-700" />
                <p className="text-sm font-medium text-slate-400">No research runs yet</p>
                <p className="text-xs text-slate-600 mt-1">Start your first research task to see results here.</p>
              </div>
            ) : (
              history.map((task) => (
                <div key={task.id}
                  data-testid={`history-item-${task.id}`}
                  onClick={() => navigate(`/results/${task.id}`)}
                  className="p-4 hover:bg-slate-800/40 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-200 truncate">{task.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLES[task.status] || STATUS_STYLES.pending}`}>
                      {task.status === 'running' && <Loader2 size={10} className="inline mr-1 animate-spin" />}
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-500">{task.config?.platforms?.slice(0, 2).join(', ')}</span>
                    {task.total_results > 0 && (
                      <span className="text-xs text-slate-600">• {task.total_results} results</span>
                    )}
                    <span className="text-xs text-slate-700 ml-auto">
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick start */}
          <div data-testid="quick-start-card"
            onClick={() => navigate('/research')}
            className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-6 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-600/15 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-indigo-500/30">
              <Plus size={20} className="text-white" />
            </div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-semibold text-white mb-1">New Research</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Build and run a new automated research task with AI-generated prompts.</p>
          </div>

          {/* Tip */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-1">Pro Tip</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Save your best configurations as templates for quick reuse. Access them anytime from the Templates tab.
                </p>
              </div>
            </div>
          </div>

          {/* Platform icons */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Supported Platforms</p>
            <div className="flex flex-wrap gap-1.5">
              {['Web', 'Reddit', 'GitHub', 'LinkedIn', 'Discord', 'Twitter', 'Product Hunt', 'HN'].map(p => (
                <span key={p} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

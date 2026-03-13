import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, Clock, Trash2, ExternalLink, ChevronRight } from 'lucide-react';
import { researchApi } from '@/api/client';

const STATUS_STYLES = {
  pending:   'text-amber-400 bg-amber-400/10 border border-amber-400/20',
  running:   'text-blue-400 bg-blue-400/10 border border-blue-400/20',
  completed: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  failed:    'text-red-400 bg-red-400/10 border border-red-400/20',
};

const STATUS_ICONS = {
  pending:   Clock,
  running:   Loader2,
  completed: CheckCircle2,
  failed:    AlertTriangle,
};

export default function History() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const { data } = await researchApi.getHistory();
      setTasks(data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await researchApi.deleteTask(id);
      setTasks(ts => ts.filter(t => t.id !== id));
      toast.success('Research deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const statuses = ['all', 'completed', 'running', 'pending', 'failed'];
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const counts = {
    all: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    running: tasks.filter(t => t.status === 'running').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-white tracking-tight">Research History</h1>
        <p className="text-slate-400 text-sm mt-1">All previous research runs with their results and status.</p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map(s => (
          <button key={s}
            data-testid={`filter-${s}`}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter === s
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filter === s ? 'bg-indigo-500/20' : 'bg-slate-800'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-1/2 mb-3" />
              <div className="h-3 bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-12 text-center">
          <Clock size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No research runs found</p>
          <p className="text-xs text-slate-600 mt-1">
            {filter !== 'all' ? `No ${filter} tasks.` : 'Start your first research task.'}
          </p>
          <button onClick={() => navigate('/research')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition-colors">
            New Research
          </button>
        </div>
      ) : (
        <div className="space-y-3" data-testid="history-list">
          {filtered.map((task) => {
            const StatusIcon = STATUS_ICONS[task.status] || Clock;
            const isRunning = task.status === 'running';
            return (
              <div key={task.id}
                data-testid={`history-task-${task.id}`}
                onClick={() => navigate(`/results/${task.id}`)}
                className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 hover:border-slate-700 cursor-pointer transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-emerald-500/10' :
                      task.status === 'failed' ? 'bg-red-500/10' :
                      task.status === 'running' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                    }`}>
                      <StatusIcon size={14}
                        className={
                          task.status === 'completed' ? 'text-emerald-400' :
                          task.status === 'failed' ? 'text-red-400' :
                          task.status === 'running' ? 'text-blue-400 animate-spin' : 'text-amber-400'
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 style={{ fontFamily: 'Manrope, sans-serif' }}
                          className="text-sm font-semibold text-white">{task.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status] || STATUS_STYLES.pending}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <div className="flex gap-1.5">
                          {task.config?.platforms?.slice(0, 3).map(p => (
                            <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">{p}</span>
                          ))}
                        </div>
                        {task.config?.niches?.slice(0, 2).map(n => (
                          <span key={n} className="text-xs text-slate-500">{n}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {task.total_results > 0 && (
                          <span className="text-xs text-emerald-400 font-medium">{task.total_results} results</span>
                        )}
                        <span className="text-xs text-slate-600">
                          {new Date(task.created_at).toLocaleString()}
                        </span>
                        {task.completed_at && (
                          <span className="text-xs text-slate-700">
                            Completed: {new Date(task.completed_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      data-testid={`delete-task-${task.id}`}
                      onClick={(e) => handleDelete(e, task.id)}
                      disabled={deleting === task.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                      {deleting === task.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Trash2 size={12} />}
                    </button>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Download, Search, ChevronUp, ChevronDown, ExternalLink, Copy, Loader2,
  AlertTriangle, CheckCircle2, ArrowLeft, Filter, X, Tag
} from 'lucide-react';
import { researchApi } from '@/api/client';

const STATUS_CONFIG = {
  pending:   { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', label: 'Pending' },
  running:   { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   label: 'Researching...' },
  completed: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', label: 'Completed' },
  failed:    { color: 'text-red-400 bg-red-400/10 border-red-400/20',      label: 'Failed' },
};

const ENGAGEMENT_COLORS = {
  'Low':       'text-slate-400 bg-slate-400/10',
  'Medium':    'text-yellow-400 bg-yellow-400/10',
  'High':      'text-emerald-400 bg-emerald-400/10',
  'Very High': 'text-indigo-400 bg-indigo-400/10',
};

function ScoreBadge({ score, max = 10 }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400">{score}/{max}</span>
    </div>
  );
}

export default function Results() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortKey, setSortKey] = useState('relevance_score');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchTask = useCallback(async () => {
    try {
      const { data } = await researchApi.getTask(taskId);
      setTask(data);
      return data.status;
    } catch {
      setError('Research task not found.');
      return 'failed';
    }
  }, [taskId]);

  useEffect(() => {
    let timer;
    const poll = async () => {
      const status = await fetchTask();
      if (status === 'pending' || status === 'running') {
        timer = setTimeout(poll, 3000);
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [fetchTask]);

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 size={30} className="text-indigo-400 animate-spin" />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const results = task.results || [];

  // Platforms for filter
  const allPlatforms = [...new Set(results.map(r => r.platform))];

  // Filter + search + sort
  const filtered = results
    .filter(r => {
      if (platformFilter !== 'all' && r.platform !== platformFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1;
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string') return av.localeCompare(bv) * v;
      return (av - bv) * v;
    });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />;
  };

  const isProcessing = task.status === 'pending' || task.status === 'running';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate('/history')}
              className="mt-0.5 text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 style={{ fontFamily: 'Manrope, sans-serif' }}
                  className="text-xl font-bold text-white">{task.title}</h1>
                <span data-testid="task-status"
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusCfg.color}`}>
                  {isProcessing && <Loader2 size={10} className="inline mr-1 animate-spin" />}
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {task.config?.platforms?.map(p => (
                  <span key={p} className="text-xs text-slate-500">{p}</span>
                ))}
                {task.total_results > 0 && (
                  <span className="text-xs text-slate-600">• {task.total_results} results</span>
                )}
                <span className="text-xs text-slate-700">
                  {new Date(task.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Export buttons */}
          {task.status === 'completed' && results.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {['json', 'csv', 'xlsx'].map(fmt => (
                <button key={fmt}
                  data-testid={`export-${fmt}`}
                  onClick={() => { researchApi.exportTask(taskId, fmt); toast.success(`Exporting as ${fmt.toUpperCase()}...`); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700">
                  <Download size={12} />
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div data-testid="processing-state" className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
              <Loader2 size={28} className="text-indigo-400 animate-spin" />
            </div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-lg font-semibold text-white mb-2">
              {task.status === 'pending' ? 'Queuing Research...' : 'AI is Researching...'}
            </h3>
            <p className="text-sm text-slate-400">Gemini is analyzing platforms and collecting results.</p>
            <p className="text-xs text-slate-600 mt-2">This may take 30 seconds to 3 minutes.</p>
          </div>
        </div>
      )}

      {/* Failed state */}
      {task.status === 'failed' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Research Failed</p>
            <p className="text-sm text-slate-500 mt-1">{task.error || 'An unexpected error occurred.'}</p>
            <button onClick={() => navigate('/research')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {task.status === 'completed' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filter bar */}
          <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-3 flex-shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                data-testid="results-search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search results..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X size={12} />
                </button>
              )}
            </div>

            {allPlatforms.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter size={13} className="text-slate-500" />
                <select
                  data-testid="platform-filter"
                  value={platformFilter}
                  onChange={e => setPlatformFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
                  <option value="all">All Platforms</option>
                  {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <span className="text-xs text-slate-500 ml-auto">
              {filtered.length} of {results.length} results
            </span>
          </div>

          {/* Table */}
          {results.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 size={36} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Research completed</p>
                <p className="text-xs text-slate-600 mt-1">No results were returned by the AI.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider w-8">#</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-300"
                      onClick={() => toggleSort('title')}>
                      Title <SortIcon col="title" />
                    </th>
                    <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-300 w-28"
                      onClick={() => toggleSort('platform')}>
                      Platform <SortIcon col="platform" />
                    </th>
                    <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider w-32">Category</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-300 w-28"
                      onClick={() => toggleSort('relevance_score')}>
                      Relevance <SortIcon col="relevance_score" />
                    </th>
                    <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-300 w-24"
                      onClick={() => toggleSort('confidence_score')}>
                      Confidence <SortIcon col="confidence_score" />
                    </th>
                    <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider w-28">Engagement</th>
                    <th className="px-4 py-3 text-center text-slate-500 font-semibold uppercase tracking-wider w-16">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <React.Fragment key={i}>
                      <tr
                        data-testid={`result-row-${i}`}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        className="border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3 text-slate-600">{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className="text-slate-200 font-medium line-clamp-1 block max-w-xs">{r.title}</span>
                          {r.tags?.slice(0, 2).map(t => (
                            <span key={t} className="inline-flex items-center gap-0.5 mr-1 mt-1 text-xs text-slate-600">
                              <Tag size={9} />#{t}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{r.platform}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{r.category}</td>
                        <td className="px-4 py-3">
                          <ScoreBadge score={r.relevance_score} max={10} />
                        </td>
                        <td className="px-4 py-3 text-slate-400">{r.confidence_score}%</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${ENGAGEMENT_COLORS[r.engagement_level] || 'text-slate-400 bg-slate-800'}`}>
                            {r.engagement_level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.url && r.url !== '#' && (
                            <a href={r.url} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center justify-center">
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </td>
                      </tr>
                      {expandedRow === i && (
                        <tr className="border-b border-slate-800/60 bg-slate-900/40">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <p className="text-xs font-medium text-slate-300 mb-1">Description</p>
                                <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-xs text-slate-500 mb-1">Source Type</p>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">{r.source_type}</span>
                                <div className="mt-2">
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(r.url); toast.success('URL copied!'); }}
                                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors ml-auto">
                                    <Copy size={11} /> Copy URL
                                  </button>
                                </div>
                              </div>
                            </div>
                            {r.tags?.length > 0 && (
                              <div className="flex gap-1.5 mt-3 flex-wrap">
                                {r.tags.map(t => (
                                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

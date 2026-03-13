import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, BookMarked, Zap, Globe, MessageSquare } from 'lucide-react';
import { templatesApi } from '@/api/client';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const { data } = await templatesApi.getAll();
      setTemplates(data);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await templatesApi.delete(id);
      setTemplates(ts => ts.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setDeleting(null);
    }
  };

  const handleUse = (template) => {
    navigate('/research', { state: { config: template.config } });
  };

  // Preset templates to show when empty
  const PRESETS = [
    {
      name: 'Find Client Leads',
      description: 'Discover potential clients actively seeking services in your niche.',
      config: { platforms: ['Reddit', 'LinkedIn', 'Twitter'], niches: ['Lead Generation', 'Freelancing'], depth: 'deep', output_format: 'lead_list', dataset_size: 50 },
    },
    {
      name: 'Discover Communities',
      description: 'Map out active online communities around a specific topic.',
      config: { platforms: ['Reddit', 'Discord', 'Facebook Groups'], niches: ['Marketing', 'SaaS'], depth: 'standard', output_format: 'table', dataset_size: 25 },
    },
    {
      name: 'Competitor Research',
      description: 'Analyze what competitors are building and how they position.',
      config: { platforms: ['Product Hunt', 'Hacker News', 'GitHub'], niches: ['SaaS', 'AI Automation'], depth: 'deep', output_format: 'report', dataset_size: 30 },
    },
    {
      name: 'Market Research',
      description: 'Understand market trends, pain points, and emerging opportunities.',
      config: { platforms: ['Reddit', 'Twitter', 'LinkedIn'], niches: ['Ecommerce', 'SaaS'], depth: 'exhaustive', output_format: 'json', dataset_size: 100 },
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-white tracking-tight">Templates</h1>
          <p className="text-slate-400 text-sm mt-1">Saved research configurations for quick reuse.</p>
        </div>
        <button onClick={() => navigate('/research')}
          data-testid="new-research-btn"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
          <Plus size={15} /> New Research
        </button>
      </div>

      {/* Saved templates */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 animate-pulse h-36" />
          ))}
        </div>
      ) : templates.length > 0 ? (
        <>
          <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <BookMarked size={14} className="text-indigo-400" />
            Saved Templates ({templates.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {templates.map(t => (
              <div key={t.id}
                data-testid={`template-card-${t.id}`}
                className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                    <BookMarked size={14} className="text-indigo-400" />
                  </div>
                  <button
                    data-testid={`delete-template-${t.id}`}
                    onClick={(e) => handleDelete(e, t.id)}
                    disabled={deleting === t.id}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                    {deleting === t.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>

                <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-semibold text-white mb-1">{t.name}</h3>
                {t.description && <p className="text-xs text-slate-500 leading-relaxed mb-3">{t.description}</p>}

                <div className="flex flex-wrap gap-1 mb-4">
                  {t.config?.platforms?.slice(0, 3).map(p => (
                    <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">{p}</span>
                  ))}
                  {t.config?.niches?.slice(0, 2).map(n => (
                    <span key={n} className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{n}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{new Date(t.created_at).toLocaleDateString()}</span>
                  <button
                    data-testid={`use-template-${t.id}`}
                    onClick={() => handleUse(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors">
                    <Zap size={11} /> Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Preset templates */}
      <div>
        <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          Quick Start Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESETS.map((preset) => (
            <div key={preset.name}
              data-testid={`preset-${preset.name.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => navigate('/research', { state: { config: preset.config } })}
              className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-indigo-600/20 transition-colors">
                <Globe size={14} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-semibold text-white mb-1">{preset.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{preset.description}</p>
              <div className="flex flex-wrap gap-1">
                {preset.config.platforms.slice(0, 2).map(p => (
                  <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-600">{p}</span>
                ))}
                <span className="text-xs text-indigo-500">{preset.config.depth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

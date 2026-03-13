import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Globe, MessageSquare, Users, Hash, Linkedin, Github, Twitter, Rocket, TrendingUp,
  ChevronRight, ChevronLeft, Zap, Check, Loader2, BookMarked, Save
} from 'lucide-react';
import { researchApi, templatesApi } from '@/api/client';

const PLATFORMS = [
  { id: 'Web',            icon: Globe },
  { id: 'Reddit',         icon: MessageSquare },
  { id: 'Facebook Groups',icon: Users },
  { id: 'Discord',        icon: Hash },
  { id: 'LinkedIn',       icon: Linkedin },
  { id: 'GitHub',         icon: Github },
  { id: 'Twitter',        icon: Twitter },
  { id: 'Product Hunt',   icon: Rocket },
  { id: 'Hacker News',    icon: TrendingUp },
];

const NICHES = [
  'Lead Generation', 'Ecommerce', 'Web Development', 'AI Automation',
  'SaaS', 'Marketing', 'Freelancing', 'Data Science', 'Cybersecurity',
  'Content Creation', 'SEO', 'Social Media',
];

const DEPTHS = [
  { id: 'quick',     label: 'Quick',     desc: 'Surface-level, fast',    time: '~30s' },
  { id: 'standard',  label: 'Standard',  desc: 'Balanced depth',         time: '~1 min' },
  { id: 'deep',      label: 'Deep',      desc: 'Thorough exploration',   time: '~2 min' },
  { id: 'exhaustive',label: 'Exhaustive',desc: 'Maximum coverage',       time: '~3 min' },
];

const FORMATS = [
  { id: 'json',         label: 'JSON Dataset' },
  { id: 'csv',          label: 'CSV Dataset' },
  { id: 'report',       label: 'Structured Report' },
  { id: 'lead_list',    label: 'Lead List' },
  { id: 'table',        label: 'Table View' },
  { id: 'bullet_summary', label: 'Bullet Summary' },
];

const SIZES = [10, 25, 50, 100, 250];

const PLATFORM_TIPS = {
  'Web':            'general web sources, blogs, and articles',
  'Reddit':         'subreddits, posts, and community threads',
  'Facebook Groups':'community groups and discussions',
  'Discord':        'servers, channels, and communities',
  'LinkedIn':       'companies, groups, and professional profiles',
  'GitHub':         'repositories, projects, and discussions',
  'Twitter':        'accounts, hashtags, and conversations',
  'Product Hunt':   'launches, products, and maker chats',
  'Hacker News':    'submissions, Ask HN, and Show HN',
};

function buildPreview(config) {
  const { platforms, niches, depth, output_format, dataset_size, custom_query } = config;
  if (!platforms.length && !niches.length) {
    return '// Select platforms and niches to preview\n// your AI-generated research prompt...';
  }
  const lines = [
    '// RESEARCH PROMPT PREVIEW',
    '',
    `TASK:`,
    `  topics   → ${niches.join(', ') || '(select niches)'}`,
    `  platforms → ${platforms.join(', ') || '(select platforms)'}`,
    `  depth    → ${depth.toUpperCase()}`,
    `  format   → ${output_format}`,
    `  results  → ${dataset_size} items`,
    '',
  ];
  if (platforms.length) {
    lines.push('SEARCH STRATEGY:');
    platforms.forEach(p => lines.push(`  ✓ ${p} → ${PLATFORM_TIPS[p] || 'relevant sources'}`));
    lines.push('');
  }
  lines.push('QUALITY RULES:');
  lines.push(`  • ${dataset_size} unique, validated results`);
  lines.push(`  • Fields: title, url, platform, description`);
  lines.push(`  • Scores: relevance (≥6/10), confidence (0-100%)`);
  lines.push(`  • Tags, engagement level, source type`);
  lines.push(`  • No duplicates, no hallucinations`);
  if (custom_query) {
    lines.push('');
    lines.push('CUSTOM FOCUS:');
    lines.push(`  "${custom_query}"`);
  }
  lines.push('');
  lines.push('OUTPUT → JSON array, ready for export');
  return lines.join('\n');
}

const DEFAULT_CONFIG = {
  platforms: [], niches: [], depth: 'standard',
  output_format: 'json', dataset_size: 25, custom_query: '',
};

export default function ResearchBuilder() {
  const navigate = useNavigate();
  const location = useLocation();

  const [config, setConfig] = useState(() => ({
    ...DEFAULT_CONFIG,
    ...(location.state?.config || {}),
  }));
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  const togglePlatform = (id) =>
    setConfig(c => ({
      ...c,
      platforms: c.platforms.includes(id)
        ? c.platforms.filter(p => p !== id)
        : [...c.platforms, id],
    }));

  const toggleNiche = (id) =>
    setConfig(c => ({
      ...c,
      niches: c.niches.includes(id)
        ? c.niches.filter(n => n !== id)
        : [...c.niches, id],
    }));

  const canNext = [
    config.platforms.length > 0,
    config.niches.length > 0,
    true,
    true,
  ];

  const handleRun = async () => {
    setRunning(true);
    try {
      const { data } = await researchApi.run({ config });
      toast.success('Research started!');
      navigate(`/results/${data.task_id}`);
    } catch (e) {
      toast.error('Failed to start research. Please try again.');
      setRunning(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) { toast.error('Template name is required'); return; }
    try {
      await templatesApi.save({ name: templateName, description: templateDesc, config });
      toast.success('Template saved!');
      setShowSaveModal(false);
      setTemplateName(''); setTemplateDesc('');
    } catch (e) {
      toast.error('Failed to save template');
    }
  };

  const steps = ['Platforms', 'Topics', 'Parameters', 'Review'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-xl font-bold text-white">Research Builder</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure your automated research task</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <button onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    i === step ? 'text-indigo-400' : i < step ? 'text-emerald-400 cursor-pointer' : 'text-slate-600'
                  }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                    i < step ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : i === step ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                      : 'bg-slate-800 border-slate-700 text-slate-600'
                  }`}>
                    {i < step ? <Check size={10} /> : i + 1}
                  </span>
                  <span className="hidden sm:block">{s}</span>
                </button>
                {i < steps.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Form */}
        <div className="w-2/5 flex flex-col border-r border-slate-800 overflow-y-auto">
          <div className="flex-1 p-6">
            {/* Step 0: Platforms */}
            {step === 0 && (
              <div className="animate-fade-in-up" data-testid="step-platforms">
                <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-semibold text-white mb-1">Select Platforms</h2>
                <p className="text-xs text-slate-500 mb-5">Choose where to search for data. Select all that apply.</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(({ id, icon: Icon }) => {
                    const active = config.platforms.includes(id);
                    return (
                      <button key={id}
                        data-testid={`platform-${id.toLowerCase().replace(/ /g, '-')}`}
                        onClick={() => togglePlatform(id)}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm font-medium transition-all ${
                          active
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}>
                        <Icon size={14} className={active ? 'text-indigo-400' : 'text-slate-500'} />
                        <span className="truncate text-xs">{id}</span>
                        {active && <Check size={10} className="ml-auto text-indigo-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {config.platforms.length === 0 && (
                  <p className="text-xs text-amber-500 mt-3">Select at least one platform to continue.</p>
                )}
              </div>
            )}

            {/* Step 1: Niches */}
            {step === 1 && (
              <div className="animate-fade-in-up" data-testid="step-niches">
                <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-semibold text-white mb-1">Define Research Topic</h2>
                <p className="text-xs text-slate-500 mb-5">Select niches or add a custom research focus.</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {NICHES.map(n => {
                    const active = config.niches.includes(n);
                    return (
                      <button key={n}
                        data-testid={`niche-${n.toLowerCase().replace(/ /g, '-')}`}
                        onClick={() => toggleNiche(n)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}>
                        {active && <Check size={9} className="inline mr-1" />}
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1.5 block">Custom Research Focus (optional)</label>
                  <textarea
                    data-testid="custom-query-input"
                    value={config.custom_query}
                    onChange={e => setConfig(c => ({ ...c, custom_query: e.target.value }))}
                    placeholder="e.g. Find active Discord communities for indie hackers..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Parameters */}
            {step === 2 && (
              <div className="animate-fade-in-up space-y-6" data-testid="step-parameters">
                <div>
                  <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-semibold text-white mb-1">Research Parameters</h2>
                  <p className="text-xs text-slate-500 mb-4">Configure depth, output format, and result count.</p>
                </div>

                {/* Depth */}
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Research Depth</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEPTHS.map(d => (
                      <button key={d.id}
                        data-testid={`depth-${d.id}`}
                        onClick={() => setConfig(c => ({ ...c, depth: d.id }))}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          config.depth === d.id
                            ? 'bg-indigo-600/20 border-indigo-500/40'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                        }`}>
                        <p className={`text-xs font-semibold ${config.depth === d.id ? 'text-indigo-300' : 'text-slate-300'}`}>{d.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{d.time}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Output Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map(f => (
                      <button key={f.id}
                        data-testid={`format-${f.id}`}
                        onClick={() => setConfig(c => ({ ...c, output_format: f.id }))}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          config.output_format === f.id
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}>
                        {config.output_format === f.id && <Check size={9} className="inline mr-1" />}
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dataset size */}
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Dataset Size</label>
                  <div className="flex gap-2 flex-wrap">
                    {SIZES.map(s => (
                      <button key={s}
                        data-testid={`size-${s}`}
                        onClick={() => setConfig(c => ({ ...c, dataset_size: s }))}
                        className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
                          config.dataset_size === s
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="animate-fade-in-up" data-testid="step-review">
                <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-semibold text-white mb-1">Review & Launch</h2>
                <p className="text-xs text-slate-500 mb-5">Confirm your settings and run the research.</p>

                <div className="space-y-3 mb-6">
                  {[
                    { label: 'Platforms', value: config.platforms.join(', ') || '—' },
                    { label: 'Topics', value: config.niches.join(', ') || '—' },
                    { label: 'Depth', value: config.depth },
                    { label: 'Format', value: config.output_format },
                    { label: 'Results', value: `${config.dataset_size} items` },
                    ...(config.custom_query ? [{ label: 'Custom Focus', value: config.custom_query }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
                      <span className="text-xs text-slate-500 w-24 flex-shrink-0 font-medium">{label}</span>
                      <span className="text-xs text-slate-300 font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Save template */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-xs text-slate-400">Save as template for future reuse?</p>
                  <button onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                    <Save size={12} /> Save Template
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="p-5 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium disabled:opacity-30 hover:bg-slate-700 transition-colors">
              <ChevronLeft size={16} /> Back
            </button>

            {step < 3 ? (
              <button
                data-testid="next-step-btn"
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext[step]}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-30 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                data-testid="run-research-btn"
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 animate-pulse-glow">
                {running ? <><Loader2 size={15} className="animate-spin" /> Starting...</> : <><Zap size={15} /> Run Research</>}
              </button>
            )}
          </div>
        </div>

        {/* Right: Prompt Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0f1a]">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Live Prompt Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <pre className="prompt-preview whitespace-pre-wrap">
              {buildPreview(config)}
            </pre>
          </div>
        </div>
      </div>

      {/* Save template modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div data-testid="save-template-modal" className="bg-[#0f172a] border border-slate-700 rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-semibold text-white mb-4">Save as Template</h3>
            <input
              data-testid="template-name-input"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="Template name (required)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 mb-3"
            />
            <input
              value={templateDesc}
              onChange={e => setTemplateDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button data-testid="confirm-save-template" onClick={handleSaveTemplate}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

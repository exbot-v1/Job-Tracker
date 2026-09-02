import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Shield,
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Save,
  Moon,
  Sun,
  Copy,
  ExternalLink,
  Info,
  Globe,
  Radio,
  Power,
  RotateCw,
  Lock,
  Check,
} from 'lucide-react';
import { formatCurrency, formatMinutesDisplay } from '../lib/calculations';
import { isSupabaseConfigured } from '../lib/supabase';

export const SettingsView: React.FC = () => {
  const {
    contract,
    updateContract,
    theme,
    toggleTheme,
    user,
    logout,
    resetToSampleData,
    clearAllVideos,
    exportDataJson,
    importDataJson,
    shareLink,
    createShareLink,
    revokeShareLink,
    regenerateShareLink,
    addToast,
  } = useApp();

  const [name, setName] = useState(contract.name);
  const [monthlyRef, setMonthlyRef] = useState(contract.monthly_reference_minutes);
  const [milestoneMin, setMilestoneMin] = useState(contract.milestone_minutes);
  const [milestonePay, setMilestonePay] = useState(contract.milestone_payment);
  const [totalVal, setTotalVal] = useState(contract.total_contract_value);
  const [totalMin, setTotalMin] = useState(contract.total_required_minutes);
  const [startDate, setStartDate] = useState(contract.start_date);
  const [status, setStatus] = useState(contract.status);

  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [isProcessingShare, setIsProcessingShare] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const isPublicActive = Boolean(shareLink && shareLink.is_active);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = shareLink?.token ? `${origin}/?public=${shareLink.token}` : '';

  const handleCopyPublicLink = async () => {
    if (!publicUrl) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = publicUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setLinkCopied(true);
      addToast({
        type: 'success',
        title: 'Public Link Copied',
        message: 'Permanent read-only employer link copied to clipboard.',
      });
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Could not copy link to clipboard.',
      });
    }
  };

  const handleTogglePublicLink = async () => {
    setIsProcessingShare(true);
    try {
      if (isPublicActive) {
        await revokeShareLink();
      } else {
        await createShareLink();
      }
    } finally {
      setIsProcessingShare(false);
    }
  };

  const handleRegeneratePublicLink = async () => {
    setIsProcessingShare(true);
    try {
      await regenerateShareLink();
    } finally {
      setIsProcessingShare(false);
    }
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContract(true);
    try {
      await updateContract({
        name,
        monthly_reference_minutes: Number(monthlyRef),
        milestone_minutes: Number(milestoneMin),
        milestone_payment: Number(milestonePay),
        total_contract_value: Number(totalVal),
        total_required_minutes: Number(totalMin),
        start_date: startDate,
        status,
      });
    } finally {
      setIsSavingContract(false);
    }
  };

  const handleExport = () => {
    const dataStr = exportDataJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_contract_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Export Complete',
      message: 'Downloaded contract and video records JSON file.',
    });
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const success = importDataJson(importJsonText);
    if (success) {
      setImportJsonText('');
      setShowImportBox(false);
    }
  };

  const copySqlSchema = () => {
    const schema = `-- Video Editing Contract Tracker - Supabase SQL Schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Video Editor',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  monthly_reference_minutes NUMERIC NOT NULL DEFAULT 90,
  milestone_minutes NUMERIC NOT NULL DEFAULT 90,
  milestone_payment NUMERIC NOT NULL DEFAULT 25000,
  total_contract_value NUMERIC NOT NULL DEFAULT 150000,
  total_required_minutes NUMERIC NOT NULL DEFAULT 540,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active'
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own contracts" ON public.contracts FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  youtube_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own videos" ON public.videos FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  milestone_number INTEGER NOT NULL,
  earned_amount NUMERIC NOT NULL DEFAULT 25000,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_date DATE,
  actual_amount_received NUMERIC,
  notes TEXT
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own payments" ON public.payments FOR ALL USING (auth.uid() = user_id);`;

    navigator.clipboard.writeText(schema);
    addToast({
      type: 'success',
      title: 'SQL Schema Copied',
      message: 'PostgreSQL table DDL and RLS security policies copied to clipboard.',
    });
  };

  return (
    <div id="settings-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>Application &amp; Contract Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure contractual parameters, Supabase PostgreSQL synchronization, and backup data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Contract Terms Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Contract Terms Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100">Contract Configuration</h2>
                <p className="text-xs text-slate-400">
                  Dynamic terms governing milestone thresholds and financial calculations
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contract Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Runtime per Milestone (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={milestoneMin}
                    onChange={(e) => setMilestoneMin(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default: 90 minutes</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Payment per Milestone (৳)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={milestonePay}
                    onChange={(e) => setMilestonePay(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default: ৳25,000</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Total Required Runtime (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalMin}
                    onChange={(e) => setTotalMin(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default: 540 minutes (90 × 6)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Total Contract Value (৳)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalVal}
                    onChange={(e) => setTotalVal(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default: ৳150,000</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Monthly Reference Target (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={monthlyRef}
                    onChange={(e) => setMonthlyRef(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Informational pacing target</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Modifying contract terms dynamically recalculates all active milestone percentages and earned amounts based on your recorded video runtimes.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingContract}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingContract ? 'Saving...' : 'Save Contract Terms'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Public View (Employer Link) Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">Public View (Employer Link)</h3>
                    {isPublicActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        <Lock className="w-2.5 h-2.5" /> Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Read-only link for clients to track runtime progress live with zero login.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePublicLink}
                disabled={isProcessingShare}
                className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 self-start sm:self-auto ${
                  isPublicActive
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isPublicActive ? 'Disable Public View' : 'Enable Public View'}</span>
              </button>
            </div>

            {isPublicActive ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono overflow-hidden">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate select-all">{publicUrl}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyPublicLink}
                      className={`py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                        linkCopied
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {linkCopied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                      <span>{linkCopied ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => publicUrl && window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                      <span>Open</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegeneratePublicLink}
                      disabled={isProcessingShare}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Regenerate token"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Click <strong>Enable Public View</strong> to generate a unique token and shareable URL.
              </p>
            )}
          </div>

          {/* Supabase Security & Database Schema Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">Supabase &amp; Data Security</h3>
                  <p className="text-xs text-slate-400">PostgreSQL with Row Level Security (RLS)</p>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  isSupabaseConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                }`}
              >
                {isSupabaseConfigured ? 'Supabase Connected' : 'Local / Offline Sync'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-2">
              <p>
                <strong>Row Level Security (RLS) Enforcement:</strong> In production with Supabase, every user profile, video record, contract, and payment record is secured using PostgreSQL RLS policies (<code className="text-emerald-400">auth.uid() = user_id</code>). No user can inspect or alter data belonging to another account.
              </p>
              <p className="text-slate-400">
                To connect your personal Supabase project, provide <code className="text-slate-300">VITE_SUPABASE_URL</code> and <code className="text-slate-300">VITE_SUPABASE_ANON_KEY</code> in environment variables.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={copySqlSchema}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copy Full Supabase SQL Schema</span>
              </button>

              <span className="text-[11px] text-slate-400">
                Found in <code className="text-slate-300">/supabase_schema.sql</code>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Contract Summary & Data Backup */}
        <div className="lg:col-span-5 space-y-6">
          {/* Contract Summary Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 mb-4">Contract Terms Summary</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950">
                <span className="text-slate-400">Total Contract Value</span>
                <span className="font-bold text-slate-100 font-mono text-sm">
                  {formatCurrency(contract.total_contract_value)}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950">
                <span className="text-slate-400">Required Video Runtime</span>
                <span className="font-bold text-slate-100 font-mono">
                  {contract.total_required_minutes} minutes
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950">
                <span className="text-slate-400">Payment Milestone</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formatCurrency(contract.milestone_payment)}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950">
                <span className="text-slate-400">Runtime per Milestone</span>
                <span className="font-bold text-slate-100 font-mono">
                  {contract.milestone_minutes} minutes
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950">
                <span className="text-slate-400">Reference Monthly Pace</span>
                <span className="font-bold text-slate-100 font-mono">
                  {contract.monthly_reference_minutes} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Theme & User Profile Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Appearance &amp; Account</h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-slate-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span>Theme Mode: {theme === 'dark' ? 'Dark Neutral' : 'Light Mode'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">{user?.name || 'Video Editor'}</p>
                <p className="text-[11px] text-slate-400">{user?.email || 'socialdoodle7@gmail.com'}</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Data Backup & Reset */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-slate-100">Backup &amp; Reset Data</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => setShowImportBox(!showImportBox)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Import JSON</span>
              </button>
            </div>

            {showImportBox && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 animate-in fade-in duration-150">
                <textarea
                  rows={3}
                  placeholder="Paste exported JSON backup content here..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowImportBox(false)}
                    className="px-3 py-1 rounded-lg border border-slate-700 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    Restore
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <button
                onClick={resetToSampleData}
                className="text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample Data</span>
              </button>

              <button
                onClick={clearAllVideos}
                className="text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Videos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

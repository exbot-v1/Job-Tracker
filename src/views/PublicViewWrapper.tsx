import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  RotateCw,
  Power,
  ShieldCheck,
  Radio,
  Eye,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { SharedProgressView } from './SharedProgressView';

export const PublicViewWrapper: React.FC = () => {
  const {
    contract,
    videos,
    payments,
    shareLink,
    createShareLink,
    revokeShareLink,
    regenerateShareLink,
    addToast,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isActive = Boolean(shareLink && shareLink.is_active);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = shareLink?.token ? `${origin}/?public=${shareLink.token}` : '';

  const handleCopy = async () => {
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
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Public Link Copied',
        message: 'Permanent read-only employer link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Could not copy link to clipboard.',
      });
    }
  };

  const handleToggleActive = async () => {
    setIsProcessing(true);
    try {
      if (isActive) {
        await revokeShareLink();
      } else {
        await createShareLink();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerate = async () => {
    setIsProcessing(true);
    try {
      await regenerateShareLink();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPublicInNewTab = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div id="public-view-wrapper" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Owner Control Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-100">Public View (Employer Dashboard)</h1>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Active &amp; Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    <Lock className="w-2.5 h-2.5" /> Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Permanent, read-only link for your client or employer. Auto-syncs your editing progress live with zero login required.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              id="public-view-toggle-btn"
              onClick={handleToggleActive}
              disabled={isProcessing}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                isActive
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/40'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isActive ? 'Disable Public View' : 'Enable Public View'}</span>
            </button>
          </div>
        </div>

        {isActive ? (
          <div className="space-y-3">
            {/* Copyable Public Link */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl text-xs text-slate-200 font-mono overflow-hidden">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate select-all">{publicUrl}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="copy-public-view-link-btn"
                  onClick={handleCopy}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    copied
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied Link!' : 'Copy Public Link'}</span>
                </button>

                <button
                  id="open-public-view-tab-btn"
                  onClick={handleOpenPublicInNewTab}
                  className="py-2.5 px-3.5 rounded-xl bg-[#222631] hover:bg-[#2B3240] border border-[#262B36] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Open in new browser tab / test in incognito"
                >
                  <ExternalLink className="w-4 h-4 text-sky-400" />
                  <span>Open in New Tab</span>
                </button>

                <button
                  id="regen-public-view-link-btn"
                  onClick={handleRegenerate}
                  disabled={isProcessing}
                  className="py-2.5 px-3 rounded-xl bg-[#222631] hover:bg-[#2B3240] border border-[#262B36] text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Generate a new secure token (deactivates old link)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Read-Only Employer Mode:</strong> Viewers cannot edit, delete, or alter any contract data, and have no access to your settings or private dashboard.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#0F1115] border border-dashed border-[#262B36] text-center space-y-2">
            <p className="text-xs text-[#94A3B8]">
              Public View is currently disabled. Enable it to generate a secure link that your client or employer can open at any time without logging in.
            </p>
          </div>
        )}
      </div>

      {/* Live Preview of Public Dashboard */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-xs text-[#94A3B8] font-semibold">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Live Employer Preview (What your client sees):</span>
        </div>

        <div className="rounded-2xl border border-[#262B36] overflow-hidden bg-[#0F1115]">
          <SharedProgressView
            token={shareLink?.token || 'preview'}
            overrideContract={contract}
            overrideVideos={videos}
            overridePayments={payments}
          />
        </div>
      </div>
    </div>
  );
};

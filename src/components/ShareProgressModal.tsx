import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RotateCw,
  Trash2,
  Lock,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export const ShareProgressModal: React.FC = () => {
  const {
    shareLink,
    isShareModalOpen,
    setIsShareModalOpen,
    createShareLink,
    revokeShareLink,
    regenerateShareLink,
    addToast,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isShareModalOpen) return null;

  const isActive = Boolean(shareLink && shareLink.is_active);

  // Construct full share URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = shareLink?.token ? `${origin}/progress/${shareLink.token}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for non-https/iframe contexts
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Link Copied',
        message: 'Share URL copied to your clipboard.',
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

  const handleCreate = async () => {
    setIsProcessing(true);
    try {
      await createShareLink();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async () => {
    setIsProcessing(true);
    try {
      await revokeShareLink();
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

  const handleOpenReport = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id="share-progress-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsShareModalOpen(false);
      }}
    >
      <div
        id="share-progress-modal"
        className="w-full max-w-lg bg-[#161920] border border-[#262B36] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-[#E2E8F0]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#262B36] flex items-center justify-between bg-[#13161C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Share Progress</span>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Inactive
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Read-only progress report for your employer
              </p>
            </div>
          </div>

          <button
            id="close-share-modal-btn"
            onClick={() => setIsShareModalOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#222631] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Create a read-only progress report that you can share with your employer. It provides full visibility into runtime delivered, completed videos, payment milestones reached, and monthly pacing without granting access to your private dashboard.
          </p>

          {!isActive ? (
            /* State 1: No active link */
            <div className="p-5 rounded-xl bg-[#1A1D26] border border-[#262B36] text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#222631] flex items-center justify-center mx-auto text-[#94A3B8]">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">No Active Share Link</h3>
                <p className="text-xs text-[#94A3B8] mt-1 max-w-sm mx-auto">
                  Click below to generate a secure, high-entropy share URL for your employer.
                </p>
              </div>

              <button
                id="create-share-link-btn"
                onClick={handleCreate}
                disabled={isProcessing}
                className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-transform active:scale-95 disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>Create Share Link</span>
              </button>
            </div>
          ) : (
            /* State 2: Active share link exists */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Your progress report is ready to share.</span>
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Auto-syncs live</span>
                </div>

                {/* Copyable URL Input */}
                <div className="flex items-center gap-2">
                  <input
                    id="share-link-url-input"
                    type="text"
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0F1115] border border-[#262B36] text-xs text-slate-200 font-mono select-all focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    id="copy-share-link-btn"
                    onClick={handleCopy}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
                      copied
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-[#222631] hover:bg-[#2B3240] text-slate-200 border border-[#262B36]'
                    }`}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  id="open-report-btn"
                  onClick={handleOpenReport}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#222631] hover:bg-[#2B3240] border border-[#262B36] text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open Report</span>
                </button>

                <button
                  id="regenerate-share-link-btn"
                  onClick={handleRegenerate}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#222631] hover:bg-[#2B3240] border border-[#262B36] text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Revokes previous URL and makes a new one"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Link</span>
                </button>

                <button
                  id="revoke-share-link-btn"
                  onClick={handleRevoke}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Revoke Link</span>
                </button>
              </div>
            </div>
          )}

          {/* Security & Read-Only Guarantee Notice */}
          <div className="p-3.5 rounded-xl bg-[#13161C] border border-[#262B36] flex items-start gap-2.5 text-xs text-[#94A3B8]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-200">Strictly Read-Only & Secure</span>
              <p className="text-[11px] leading-relaxed text-[#64748B]">
                This link allows viewing progress only. Your employer cannot edit or delete videos, change contract rates, view settings, or access your account.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#262B36] bg-[#13161C] flex justify-end">
          <button
            id="close-share-dialog-footer-btn"
            onClick={() => setIsShareModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#222631] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

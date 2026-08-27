import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Plus,
  Clock,
  Calendar,
  Youtube,
  FileText,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  parseDurationToSeconds,
  formatSecondsDigital,
  formatCurrency,
  formatSecondsHuman,
} from '../lib/calculations';

export const AddVideoModal: React.FC = () => {
  const {
    isAddVideoModalOpen,
    setIsAddVideoModalOpen,
    addVideo,
    contract,
    progress,
  } = useApp();

  const [title, setTitle] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset helper buttons
  const presets = ['15:00', '24:30', '30:00', '45:00', '01:00:00'];

  // Live parsed duration
  const parsed = useMemo(() => {
    if (!durationInput.trim()) return null;
    return parseDurationToSeconds(durationInput);
  }, [durationInput]);

  // Live projection of what this video will accomplish
  const projection = useMemo(() => {
    if (!parsed || parsed.error || parsed.seconds <= 0) return null;

    const addedSeconds = parsed.seconds;
    const currentTotalSec = progress.totalCompletedSeconds;
    const newTotalSec = currentTotalSec + addedSeconds;

    const milestoneSec = contract.milestone_minutes * 60;
    const currentMilestones = Math.floor(currentTotalSec / milestoneSec);
    const newMilestones = Math.floor(newTotalSec / milestoneSec);

    const milestonesCrossed = newMilestones - currentMilestones;
    const newEarned = Math.min(contract.total_contract_value, newMilestones * contract.milestone_payment);
    const earnedDelta = milestonesCrossed * contract.milestone_payment;

    const isWillCompleteContract = newTotalSec >= contract.total_required_minutes * 60;

    const newMilestoneSec = newTotalSec % milestoneSec;
    const newMilestoneMin = newMilestoneSec / 60;

    return {
      addedSeconds,
      newTotalSec,
      newTotalMin: newTotalSec / 60,
      milestonesCrossed,
      earnedDelta,
      newEarned,
      isWillCompleteContract,
      newMilestoneMin,
    };
  }, [parsed, progress, contract]);

  if (!isAddVideoModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a video title');
      return;
    }

    const durationResult = parseDurationToSeconds(durationInput);
    if (durationResult.error || durationResult.seconds <= 0) {
      setErrorMsg(durationResult.error || 'Please enter a valid runtime duration (e.g. 00:24:32)');
      return;
    }

    if (!completionDate) {
      setErrorMsg('Please select a completion date');
      return;
    }

    if (youtubeUrl.trim()) {
      try {
        const url = new URL(youtubeUrl.trim());
        if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
          setErrorMsg('Please enter a valid YouTube URL or leave blank');
          return;
        }
      } catch {
        setErrorMsg('Please enter a valid URL (including https://) or leave blank');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await addVideo({
        title: title.trim(),
        duration_seconds: durationResult.seconds,
        completion_date: completionDate,
        youtube_url: youtubeUrl.trim() || null,
        notes: notes.trim() || null,
      });

      // Reset form & close
      setTitle('');
      setDurationInput('');
      setYoutubeUrl('');
      setNotes('');
      setIsAddVideoModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save video');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="add-video-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsAddVideoModalOpen(false)}
    >
      <div
        id="add-video-modal-content"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Add Completed Video</h2>
              <p className="text-xs text-slate-400">Record edited video runtime into your contract</p>
            </div>
          </div>
          <button
            id="close-add-modal-btn"
            onClick={() => setIsAddVideoModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Video Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Video Title <span className="text-emerald-400">*</span>
            </label>
            <input
              id="input-video-title"
              type="text"
              required
              placeholder="e.g. The Rise and Fall of Ancient Rome"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Final Edited Runtime */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Final Edited Runtime (HH:MM:SS or MM:SS) <span className="text-emerald-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {parsed && !parsed.error && parsed.seconds > 0 ? (
                  <span className="text-emerald-400 font-semibold">
                    {formatSecondsDigital(parsed.seconds, true)} ({formatSecondsHuman(parsed.seconds)})
                  </span>
                ) : (
                  'Format: 00:24:32'
                )}
              </span>
            </div>
            <div className="relative">
              <input
                id="input-video-duration"
                type="text"
                required
                placeholder="00:24:32"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 bg-slate-950 border rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                  parsed?.error
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
              <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>

            {/* Quick preset pills */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1">Quick Presets:</span>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDurationInput(p)}
                  className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            {parsed?.error && <p className="text-[11px] text-rose-400 mt-1">{parsed.error}</p>}
          </div>

          {/* Live Dynamic Projection Card */}
          {projection && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" /> Progress Impact
                </span>
                <span className="text-slate-400 font-mono">
                  +{formatSecondsHuman(projection.addedSeconds)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-400">New Contract Total:</span>
                  <p className="font-semibold text-slate-200 font-mono">
                    {formatSecondsDigital(projection.newTotalSec, true)} ({projection.newTotalMin.toFixed(1)} / {contract.total_required_minutes}m)
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Current Milestone:</span>
                  <p className="font-semibold text-slate-200 font-mono">
                    {projection.newMilestoneMin.toFixed(1)} / {contract.milestone_minutes}m
                  </p>
                </div>
              </div>

              {projection.milestonesCrossed > 0 && (
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    🎉 This will unlock {projection.milestonesCrossed} milestone and earn +{formatCurrency(projection.earnedDelta)}!
                  </span>
                </div>
              )}

              {projection.isWillCompleteContract && (
                <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>🏆 Full 540-minute contract completion threshold will be achieved!</span>
                </div>
              )}
            </div>
          )}

          {/* Completion Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Completion Date <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <input
                id="input-video-date"
                type="date"
                required
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* YouTube Link (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                YouTube URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">Can be added or updated later</span>
            </div>
            <div className="relative">
              <input
                id="input-video-youtube"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <Youtube className="w-4 h-4 text-rose-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                id="input-video-notes"
                rows={2}
                placeholder="Details about editing style, motion graphics, audio mastering, revision count..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/80">
          <button
            type="button"
            onClick={() => setIsAddVideoModalOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isSubmitting ? 'Saving...' : 'Add Video to Contract'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

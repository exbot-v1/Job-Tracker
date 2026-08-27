import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Video } from '../types';
import {
  X,
  Save,
  Clock,
  Calendar,
  Youtube,
  AlertCircle,
} from 'lucide-react';
import {
  parseDurationToSeconds,
  formatSecondsDigital,
  formatSecondsHuman,
} from '../lib/calculations';

interface EditVideoModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditVideoModal: React.FC<EditVideoModalProps> = ({ video, isOpen, onClose }) => {
  const { updateVideo } = useApp();

  const [title, setTitle] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDurationInput(formatSecondsDigital(video.duration_seconds, true));
      setCompletionDate(video.completion_date);
      setYoutubeUrl(video.youtube_url || '');
      setNotes(video.notes || '');
      setErrorMsg('');
    }
  }, [video]);

  if (!isOpen || !video) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a video title');
      return;
    }

    const durationResult = parseDurationToSeconds(durationInput);
    if (durationResult.error || durationResult.seconds <= 0) {
      setErrorMsg(durationResult.error || 'Please enter a valid duration (e.g. 00:24:32)');
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
      await updateVideo(video.id, {
        title: title.trim(),
        duration_seconds: durationResult.seconds,
        completion_date: completionDate,
        youtube_url: youtubeUrl.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update video');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-video-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="edit-video-modal-content"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-slate-100">Edit Completed Video</h2>
            <p className="text-xs text-slate-400">Update video details and runtime recalculations</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Video Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Final Runtime (HH:MM:SS or MM:SS)</label>
              <span className="text-[11px] text-slate-400 font-mono">Format: 00:24:32</span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Completion Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* YouTube */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">YouTube URL</label>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>
            <div className="relative">
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <Youtube className="w-4 h-4 text-rose-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
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
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

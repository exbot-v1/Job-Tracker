import React from 'react';
import { Video } from '../types';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { formatSecondsHuman, formatSecondsDigital } from '../lib/calculations';

interface DeleteConfirmDialogProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  video,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !video) return null;

  return (
    <div
      id="delete-video-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="delete-video-modal-content"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-100 mb-2">Delete this completed video?</h3>
          
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 mb-4 text-xs">
            <p className="font-semibold text-slate-200">{video.title}</p>
            <p className="text-slate-400 font-mono mt-1">
              Runtime: {formatSecondsDigital(video.duration_seconds, true)} ({formatSecondsHuman(video.duration_seconds)}) • Date: {video.completion_date}
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Deleting this video will reduce your total completed editing runtime by{' '}
            <strong className="text-rose-400">{formatSecondsHuman(video.duration_seconds)}</strong>. This will automatically recalculate your current 90-minute milestone progress and may affect earned milestones and contract completion.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              id="cancel-delete-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-btn"
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

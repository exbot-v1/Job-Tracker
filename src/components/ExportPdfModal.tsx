import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  FileDown,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Calendar,
  Clock,
  Film,
} from 'lucide-react';
import { generateEditingStatusPDF } from '../lib/pdfExport';
import { getCurrentEditingPeriodDetails, formatMinutesDisplay } from '../lib/calculations';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({ isOpen, onClose }) => {
  const { contract, videos, payments, addToast } = useApp();

  const [clientName, setClientName] = useState('Client / Employer');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const period = getCurrentEditingPeriodDetails(videos, contract, payments);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      await generateEditingStatusPDF({
        contract,
        videos,
        payments,
        clientOrEmployerName: clientName.trim() || 'Client / Employer',
        reportTitle: 'VIDEO EDITING PROGRESS REPORT',
      });

      addToast({
        type: 'success',
        title: 'PDF Report Exported',
        message: 'Your official editing time progress report has been downloaded.',
      });
      onClose();
    } catch (err: any) {
      console.error('PDF export failed:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Could not generate PDF. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      id="export-pdf-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="export-pdf-modal-content"
        className="w-full max-w-lg bg-[#161920] border border-[#262B36] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#262B36] flex items-center justify-between bg-[#13161C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Export Editing Status PDF</h2>
              <p className="text-xs text-[#94A3B8]">Official runtime progress report for employers</p>
            </div>
          </div>
          <button
            id="close-export-pdf-btn"
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-slate-200 hover:bg-[#222631] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Privacy Note banner */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-200">Pure Editing Time Progress Report</p>
              <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                Contains only video runtimes, period milestones, dates, and thumbnails. Absolutely no payment amounts, salary details, or bank records are included.
              </p>
            </div>
          </div>

          {/* Report Snapshot Details */}
          <div className="p-4 rounded-xl bg-[#0F1115] border border-[#262B36] space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#262B36]">
              <span className="text-[#94A3B8]">Target Block:</span>
              <span className="font-bold text-slate-100 font-mono">
                90-Minute Editing Period ({period.progressPercentage.toFixed(1)}%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Period Start Date:</span>
                <span className="font-semibold text-slate-200">{period.startDateFormatted}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Completed in Block:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {period.completedFormatted}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Remaining in Block:</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {period.remainingFormatted}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Contributing Videos:</span>
                <span className="font-semibold text-slate-200">{period.contributions.length} videos</span>
              </div>
            </div>
          </div>

          {/* Client / Employer Recipient Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Client or Employer Name (Optional)
            </label>
            <input
              id="input-pdf-client-name"
              type="text"
              placeholder="e.g. Acme Media Corp / John Doe"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262B36] flex items-center justify-end gap-3 bg-[#13161C]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#262B36] hover:bg-[#222631] text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            id="download-pdf-submit-btn"
            type="button"
            onClick={handleExport}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 stroke-[2.5]" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

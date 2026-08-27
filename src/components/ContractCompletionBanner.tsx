import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency, formatMinutesDisplay, formatSecondsHuman } from '../lib/calculations';

export const ContractCompletionBanner: React.FC = () => {
  const { progress, contract, triggerMilestoneCelebration } = useApp();

  if (!progress.isContractCompleted) return null;

  return (
    <div
      id="contract-completion-banner"
      className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 shadow-xl shadow-emerald-950/30 relative overflow-hidden"
    >
      {/* Subtle decorative glow */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-emerald-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Contract Goal Achieved
              </span>
              <span className="text-xs text-slate-400 font-medium">All 6 Payment Milestones Unlocked</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
              Contract Completed: {formatCurrency(contract.total_contract_value)} Total Earned
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
              You have completed all {contract.total_required_minutes} required minutes of edited video runtime! You can continue recording videos, manage your payment receipts, or archive completed work.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          <button
            id="celebrate-again-btn"
            onClick={() => triggerMilestoneCelebration('Contract Victory!')}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Celebrate</span>
          </button>
        </div>
      </div>

      {progress.postContractMinutes > 0 && (
        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300/90 font-medium">
          <Clock className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            Post-Contract Work: <strong>{formatSecondsHuman(progress.postContractSeconds)}</strong> ({formatMinutesDisplay(progress.postContractMinutes)}) recorded beyond the initial 540-minute contractual scope.
          </span>
        </div>
      )}
    </div>
  );
};

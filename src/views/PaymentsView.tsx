import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EditingCycle, CycleVideoContribution } from '../types';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatMinutesDisplay } from '../lib/calculations';
import { YouTubeThumbnail } from '../components/YouTubeThumbnail';
import { useYouTubeMetadata } from '../lib/youtube';

const CycleContributionItem: React.FC<{
  c: CycleVideoContribution;
  cycleNumber: number;
  idx: number;
}> = ({ c, cycleNumber, idx }) => {
  const { metadata } = useYouTubeMetadata(c.youtubeUrl);
  const displayTitle = (c.youtubeUrl && metadata?.title) ? metadata.title : c.videoTitle;

  let contributionDesc = `Full ${c.originalDurationFormatted}`;
  if (c.carryoverToNextCycleSeconds > 0 && c.countedInPreviousCyclesSeconds > 0) {
    contributionDesc = `Split: ${c.contributionFormatted} used here (${c.carryoverToNextCycleFormatted} carried over to Cycle ${cycleNumber + 1})`;
  } else if (c.carryoverToNextCycleSeconds > 0) {
    contributionDesc = `Split: ${c.contributionFormatted} used here (${c.carryoverToNextCycleFormatted} carried over to Cycle ${cycleNumber + 1})`;
  } else if (c.isFromPreviousCycle) {
    contributionDesc = `Carryover: ${c.contributionFormatted} used here (remaining from Cycle ${cycleNumber - 1})`;
  }

  return (
    <div
      key={`${c.videoId}-${idx}`}
      className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <YouTubeThumbnail
          youtubeUrl={c.youtubeUrl}
          title={displayTitle}
          className="w-14 h-9 rounded-md shrink-0"
        />
        <div className="min-w-0">
          {c.youtubeUrl ? (
            <a
              href={c.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-xs sm:text-sm text-slate-200 hover:text-emerald-400 transition-colors truncate block"
              title={`Watch "${displayTitle}" on YouTube`}
            >
              {displayTitle}
            </a>
          ) : (
            <div className="font-bold text-xs sm:text-sm text-slate-200 truncate">
              {displayTitle}
            </div>
          )}
          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
            <span>Completed: {c.completionDate}</span>
            <span>•</span>
            <span>Total runtime: {c.originalDurationFormatted}</span>
          </div>
        </div>
      </div>

      <div className="text-left sm:text-right shrink-0">
        <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${
          c.carryoverToNextCycleSeconds > 0
            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            : c.isFromPreviousCycle
            ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
            : 'bg-slate-800 text-slate-200'
        }`}>
          {contributionDesc}
        </span>
      </div>
    </div>
  );
};

export const PaymentsView: React.FC = () => {
  const {
    contract,
    editingCyclesSummary,
  } = useApp();

  const [expandedCycles, setExpandedCycles] = useState<Record<number, boolean>>({
    1: true, // Default open cycle 1
  });

  const toggleCycleExpanded = (cycleNumber: number) => {
    setExpandedCycles((prev) => ({
      ...prev,
      [cycleNumber]: !prev[cycleNumber],
    }));
  };

  const cycles = editingCyclesSummary.cycles;

  // Average Completion Time per Cycle
  const averageCompletionDays = useMemo(() => {
    const completedWithDuration = cycles.filter(
      (c) => c.status === 'completed' && c.durationDays !== null && c.durationDays !== undefined
    );
    if (completedWithDuration.length === 0) return null;
    const totalDays = completedWithDuration.reduce((sum, c) => sum + (c.durationDays || 0), 0);
    return (totalDays / completedWithDuration.length).toFixed(1);
  }, [cycles]);

  // Total Paid
  const totalPaid = editingCyclesSummary.totalPaidAmount;

  // Pending / Remaining Contract Value
  const pendingOrRemaining = Math.max(0, contract.total_contract_value - totalPaid);

  return (
    <div id="payments-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Banknote className="w-6 h-6 text-emerald-400" />
            <span>Payment Tracking &amp; Milestones</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic 90-minute cycle payments • Each completed milestone immediately triggers payment
          </p>
        </div>
      </div>

      {/* Top 5 Payment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Paid */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Paid</span>
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {editingCyclesSummary.completedCyclesCount} completed cycles
          </p>
        </div>

        {/* Pending / In Progress */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Pending / Remaining</span>
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {formatCurrency(pendingOrRemaining)}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {editingCyclesSummary.totalCyclesCount - editingCyclesSummary.completedCyclesCount} cycles pending completion
          </p>
        </div>

        {/* Total Contract Value */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Contract</span>
              <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">
              {formatCurrency(contract.total_contract_value)}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {contract.total_required_minutes}m total contract scope
          </p>
        </div>

        {/* Completed Cycles */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Completed Cycles</span>
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Layers className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">
              {editingCyclesSummary.completedCyclesCount} <span className="text-sm font-semibold text-slate-400">/ {editingCyclesSummary.totalCyclesCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {editingCyclesSummary.contractProgressPercentage.toFixed(0)}% runtime achieved
          </p>
        </div>

        {/* Avg Completion Time */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Avg Cycle Time</span>
              <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
                <Calendar className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">
              {averageCompletionDays ? `${averageCompletionDays}d` : '—'}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Average days per 90m cycle
          </p>
        </div>
      </div>

      {/* Cycles List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Milestone / Cycle Payments</span>
            <span className="text-xs font-normal text-slate-400">({contract.milestone_minutes} mins per cycle)</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const allOpen: Record<number, boolean> = {};
                cycles.forEach((c) => { allOpen[c.cycleNumber] = true; });
                setExpandedCycles(allOpen);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Expand All
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setExpandedCycles({})}
              className="text-xs text-slate-400 hover:text-slate-300 font-medium transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {cycles.map((cycle) => {
            const isExpanded = Boolean(expandedCycles[cycle.cycleNumber]);
            const isPaid = cycle.isPaid;
            const isInProgress = cycle.status === 'in_progress';
            const isUpcoming = cycle.status === 'upcoming';

            return (
              <div
                key={cycle.cycleNumber}
                id={`cycle-card-${cycle.cycleNumber}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isPaid
                    ? 'bg-slate-900 border-slate-800'
                    : isInProgress
                    ? 'bg-slate-900/90 border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : 'bg-slate-900/50 border-slate-800/60 opacity-80'
                }`}
              >
                {/* Main Header / Summary Row */}
                <div
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/20 transition-colors select-none"
                  onClick={() => toggleCycleExpanded(cycle.cycleNumber)}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      aria-label="Toggle cycle details"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0 transition-colors mt-0.5 sm:mt-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-100">
                          Cycle {cycle.cycleNumber} — {cycle.targetMinutes} Minutes
                        </h3>

                        {/* Status Badge */}
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            PAID
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                            IN PROGRESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            <Lock className="w-3 h-3" />
                            UPCOMING
                          </span>
                        )}
                      </div>

                      {/* Timeline info: Start, Completion, Duration */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                        {cycle.startDateFormatted && (
                          <span>
                            Started: <span className="text-slate-300">{cycle.startDateFormatted}</span>
                          </span>
                        )}
                        {cycle.completedAtDateFormatted && (
                          <span>
                            • Completed: <span className="text-slate-300">{cycle.completedAtDateFormatted}</span>
                          </span>
                        )}
                        {cycle.durationLabel && (
                          <span className="text-purple-300 font-semibold">
                            • {cycle.durationLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side stats & action */}
                  <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-slate-400">Cycle Payment</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                        {formatCurrency(cycle.paymentAmount)}
                      </div>
                    </div>

                    <div className="text-left md:text-right min-w-[90px]">
                      <div className="text-xs text-slate-400">Runtime</div>
                      <div className="text-sm font-bold font-mono text-slate-200">
                        {cycle.completedMinutes.toFixed(1)} / {cycle.targetMinutes}m
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar within Cycle */}
                <div className="px-5 pb-3">
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPaid ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${cycle.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Video Breakdown */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-950/70 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                      <span>Videos Contributing to Cycle {cycle.cycleNumber} ({cycle.contributions.length})</span>
                      <span>Contribution</span>
                    </div>

                    {cycle.contributions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800/50">
                        No videos logged in this cycle yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {cycle.contributions.map((c, idx) => (
                          <CycleContributionItem
                            key={`${c.videoId}-${idx}`}
                            c={c}
                            cycleNumber={cycle.cycleNumber}
                            idx={idx}
                          />
                        ))}
                      </div>
                    )}

                    {/* Cycle Payment Status & Receipt Details if Available */}
                    {cycle.paymentRecord && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-300">
                            Recorded Payment Date: <strong className="text-slate-100">{cycle.paymentRecord.payment_date || cycle.completedAtDate || 'Auto-cleared'}</strong>
                          </span>
                        </div>
                        {cycle.paymentRecord.notes && (
                          <span className="text-slate-400 italic">
                            "{cycle.paymentRecord.notes}"
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

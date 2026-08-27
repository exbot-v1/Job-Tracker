import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MilestoneInfo } from '../types';
import {
  Trophy,
  CheckCircle2,
  Clock,
  Banknote,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  formatCurrency,
  formatMinutesDisplay,
  formatSecondsDigital,
  formatSecondsHuman,
} from '../lib/calculations';
import { PaymentModal } from '../components/PaymentModal';

export const MilestonesView: React.FC = () => {
  const {
    contract,
    progress,
    milestones,
  } = useApp();

  const [selectedMilestoneForPayment, setSelectedMilestoneForPayment] = useState<MilestoneInfo | null>(null);

  return (
    <div id="milestones-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-emerald-400" />
            <span>Contract Payment Milestones</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            6 Earning Milestones • Every {contract.milestone_minutes}m block = {formatCurrency(contract.milestone_payment)} salary milestone
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Earned: </span>
            <span className="font-bold text-emerald-400 font-mono">
              {formatCurrency(progress.earnedAmount)}
            </span>
            <span className="text-slate-400"> / {formatCurrency(contract.total_contract_value)}</span>
          </div>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong>Milestones are purely cumulative:</strong> Unused minutes from each video carry forward across months until the next 90-minute threshold is crossed. Calendar months do not reset or define your payment eligibility.
        </div>
      </div>

      {/* Milestones Vertical Roadmap / Cards Grid */}
      <div className="space-y-4">
        {milestones.map((m) => {
          const isCurrent = m.status === 'current';
          const isCompleted = m.status === 'completed';

          return (
            <div
              key={m.milestoneNumber}
              id={`milestone-card-${m.milestoneNumber}`}
              className={`p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden ${
                isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : isCurrent
                  ? 'bg-slate-900 border-sky-500/40 shadow-xl ring-1 ring-sky-500/30'
                  : 'bg-slate-900/60 border-slate-800/80 opacity-75'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                        : isCurrent
                        ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-400/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{m.milestoneNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-100">
                        Milestone {m.milestoneNumber} — {formatCurrency(m.cumulativePayment)}
                      </h2>

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed &amp; Earned
                        </span>
                      )}

                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> In Progress
                        </span>
                      )}

                      {!isCompleted && !isCurrent && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Threshold requirement: {m.thresholdMinutes} minutes of cumulative edited runtime
                    </p>
                  </div>
                </div>

                {/* Right side Payment action & badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isCompleted && (
                    <button
                      id={`milestone-payment-btn-${m.milestoneNumber}`}
                      onClick={() => setSelectedMilestoneForPayment(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        m.paymentRecord?.payment_status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>
                        {m.paymentRecord?.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                      </span>
                    </button>
                  )}

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Milestone Salary</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      +{formatCurrency(m.milestonePayment)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-slate-200 font-semibold">
                    {isCompleted
                      ? `${m.thresholdMinutes} / ${m.thresholdMinutes} minutes`
                      : `${formatMinutesDisplay(Math.min(m.thresholdMinutes, progress.totalCompletedMinutes))} / ${m.thresholdMinutes} minutes`}
                  </span>
                  <span className="font-mono font-bold text-slate-300">
                    {m.progressPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? 'bg-emerald-400'
                        : isCurrent
                        ? 'bg-sky-400'
                        : 'bg-slate-700'
                    }`}
                    style={{ width: `${m.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Footer Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="text-slate-400">
                  {isCompleted ? (
                    <span className="text-emerald-400 font-medium">
                      ✓ Earned {formatCurrency(m.milestonePayment)}.
                    </span>
                  ) : isCurrent ? (
                    <span className="text-sky-300 font-medium">
                      {formatMinutesDisplay(m.remainingMinutes)} ({formatSecondsDigital(m.remainingSeconds, false)}) needed to unlock this ৳25,000 payment.
                    </span>
                  ) : (
                    <span>
                      {formatMinutesDisplay(m.remainingMinutes)} needed from total contract progress.
                    </span>
                  )}
                </div>

                {m.paymentRecord && (
                  <div className="text-slate-400 text-[11px]">
                    {m.paymentRecord.payment_status === 'paid' ? (
                      <span>
                        Received on {m.paymentRecord.payment_date} ({formatCurrency(m.paymentRecord.actual_amount_received ?? m.milestonePayment)})
                      </span>
                    ) : (
                      <span className="text-amber-400">
                        Awaiting client payment clearance
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Update Modal */}
      <PaymentModal
        milestone={selectedMilestoneForPayment}
        isOpen={Boolean(selectedMilestoneForPayment)}
        onClose={() => setSelectedMilestoneForPayment(null)}
      />
    </div>
  );
};

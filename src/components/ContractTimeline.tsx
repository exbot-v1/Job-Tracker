import React from 'react';
import {
  Trophy,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { MilestoneInfo, Contract } from '../types';
import { formatMinutesDisplay, formatSecondsDigital, formatCurrency } from '../lib/calculations';

interface ContractTimelineProps {
  milestones: MilestoneInfo[];
  contract: Contract;
  showFinancials?: boolean; // Can be turned off for public view
}

export const ContractTimeline: React.FC<ContractTimelineProps> = ({
  milestones,
  contract,
  showFinancials = true,
}) => {
  return (
    <div
      id="contract-timeline-section"
      className="p-6 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#262B36]">
        <div>
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Milestone Roadmap
          </span>
          <h3 className="text-lg font-bold text-slate-100 mt-0.5">Contract Timeline</h3>
        </div>
        <p className="text-xs text-[#94A3B8]">
          6 sequential 90-minute blocks • Total {contract.total_required_minutes}m target
        </p>
      </div>

      {/* Timeline Grid (6 Steps) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {milestones.map((m) => {
          const isCompleted = m.status === 'completed';
          const isCurrent = m.status === 'current';
          const isUpcoming = m.status === 'upcoming';

          return (
            <div
              key={m.milestoneNumber}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                isCompleted
                  ? 'bg-[#111318] border-emerald-500/30'
                  : isCurrent
                  ? 'bg-[#141824] border-sky-500/40 ring-1 ring-sky-500/20 shadow-lg shadow-sky-950/30'
                  : 'bg-[#111318]/70 border-[#262B36]/60 opacity-80'
              }`}
            >
              {/* Step indicator top */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Block #{m.milestoneNumber}
                  </span>
                  {isCompleted ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : isCurrent ? (
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-[#1C212C] text-[#64748B] flex items-center justify-center">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-slate-100 font-mono">
                  {m.thresholdMinutes}m Target
                </div>
                <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                  {formatSecondsDigital(m.completedSeconds, true)} / 90m
                </div>
              </div>

              {/* Progress Bar inside card */}
              <div className="my-3 space-y-1">
                <div className="w-full bg-[#1C212C] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-400' : isCurrent ? 'bg-sky-400' : 'bg-[#262B36]'
                    }`}
                    style={{ width: `${m.progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#94A3B8]">
                  <span>{m.progressPercentage.toFixed(0)}%</span>
                  {isCompleted ? (
                    <span className="text-emerald-400 font-semibold">Done</span>
                  ) : isCurrent ? (
                    <span className="text-sky-400 font-semibold">Active</span>
                  ) : (
                    <span className="text-[#64748B]">Upcoming</span>
                  )}
                </div>
              </div>

              {/* Footer info: Financial (if enabled) or Runtime */}
              <div className="pt-2 border-t border-[#262B36]/60 text-[11px]">
                {showFinancials ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Payout:</span>
                    <span className={`font-bold font-mono ${isCompleted ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {formatCurrency(m.milestonePayment)}
                    </span>
                  </div>
                ) : (
                  <div className="text-[#94A3B8] text-[10px]">
                    {isCompleted ? 'Milestone Reached' : `${formatMinutesDisplay(m.remainingMinutes)} remaining`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

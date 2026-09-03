import React from 'react';
import {
  Film,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  Youtube,
  ArrowRight,
  Info,
  CheckCircle2,
  CornerDownRight,
} from 'lucide-react';
import { CurrentEditingPeriodDetails, formatMinutesDisplay, formatSecondsDigital } from '../lib/calculations';
import { YouTubeThumbnail } from './YouTubeThumbnail';

interface CurrentEditingActivityProps {
  period: CurrentEditingPeriodDetails;
  onAddVideoClick?: () => void;
}

export const CurrentEditingActivity: React.FC<CurrentEditingActivityProps> = ({
  period,
  onAddVideoClick,
}) => {
  return (
    <div
      id="current-editing-activity-section"
      className="p-6 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Active 90-Minute Block
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#222631] text-emerald-300 border border-emerald-500/20">
              Period #{period.cycleNumber}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1">Current Editing Activity</h3>
        </div>

        {/* Start Date Banner */}
        <div className="flex items-center gap-2 text-xs bg-[#111318] px-3 py-1.5 rounded-xl border border-[#262B36] text-[#94A3B8] self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Period Started:{' '}
            <strong className="text-slate-200">{period.startDateFormatted}</strong>
          </span>
        </div>
      </div>

      {/* Video list or Empty State */}
      {period.contributions.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#111318] border border-dashed border-[#262B36] space-y-2.5">
          <Film className="w-8 h-8 text-[#64748B] mx-auto" />
          <p className="text-sm font-semibold text-slate-200">No videos contributing to this 90m block yet</p>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            When you add completed video runtimes, they will appear here and fill this milestone block.
          </p>
          {onAddVideoClick && (
            <button
              onClick={onAddVideoClick}
              className="mt-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95"
            >
              + Add First Video to Period
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {period.contributions.map((contrib) => {
            return (
              <div
                key={contrib.videoId}
                className="p-3.5 sm:p-4 rounded-xl bg-[#111318] border border-[#262B36] hover:border-[#384252] transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <YouTubeThumbnail
                    youtubeUrl={contrib.youtubeUrl}
                    title={contrib.videoTitle}
                    className="w-20 h-13 rounded-lg"
                    showPlayBadge={Boolean(contrib.youtubeUrl)}
                  />

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {contrib.isFromPreviousCycle && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <CornerDownRight className="w-3 h-3 text-amber-400" />
                          FROM PREVIOUS CYCLE
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate max-w-md">
                        {contrib.videoTitle}
                      </h4>
                      {contrib.youtubeUrl && (
                        <a
                          href={contrib.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#94A3B8] hover:text-rose-400 text-xs inline-flex items-center gap-1 transition-colors"
                          title="Watch on YouTube"
                        >
                          <Youtube className="w-3.5 h-3.5 text-rose-500" />
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#94A3B8] flex-wrap font-mono">
                      <span>Total: <strong className="text-slate-200">{contrib.originalDurationFormatted}</strong></span>
                      <span>•</span>
                      <span>Counted in Period #{period.cycleNumber}: <strong className="text-emerald-400 font-bold">{contrib.contributionFormatted}</strong></span>
                      {contrib.isFromPreviousCycle && contrib.countedInPreviousCyclesSeconds > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">({contrib.countedInPreviousCyclesFormatted} in previous cycle)</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Date: <strong className="text-slate-300 font-sans">{contrib.completionDate}</strong></span>
                    </div>

                    {/* Boundary Split info if carrying forward to next cycle */}
                    {contrib.carryoverToNextCycleSeconds > 0 && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 mt-1">
                        <Info className="w-3 h-3 shrink-0 text-sky-400" />
                        <span>
                          {contrib.contributionFormatted} counted in Period #{period.cycleNumber} • Carryover to Next Cycle: <strong className="font-mono text-sky-300 font-bold">{contrib.carryoverToNextCycleFormatted}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Runtime Contribution Tag */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#262B36]">
                  <span className="text-[11px] text-[#94A3B8] block sm:text-right">Credited to Period:</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">
                    +{contrib.contributionFormatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer bar with strict carryover terms */}
      <div className="pt-3 border-t border-[#262B36] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-[#111318] border border-[#262B36]/60">
          <span className="text-[#94A3B8] text-[11px] block">Starting Carryover:</span>
          <span className={`font-bold font-mono text-sm ${period.startingCarryoverSeconds > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
            {period.startingCarryoverFormatted}
          </span>
          <span className="text-[10px] text-[#64748B] block">
            {period.startingCarryoverSeconds > 0 ? 'From previous cycle' : 'None'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#111318] border border-[#262B36]/60">
          <span className="text-[#94A3B8] text-[11px] block">New Video Runtime:</span>
          <span className="font-bold text-slate-100 font-mono text-sm">
            {period.newVideoRuntimeFormatted}
          </span>
          <span className="text-[10px] text-[#64748B] block">
            Completed in this period
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#111318] border border-[#262B36]/60">
          <span className="text-[#94A3B8] text-[11px] block">Current Progress:</span>
          <span className="font-bold text-emerald-400 font-mono text-sm">
            {period.completedFormatted} / 90:00
          </span>
          <span className="text-[10px] text-emerald-500/70 block">
            {period.progressPercentage.toFixed(1)}% of 90m
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#111318] border border-[#262B36]/60">
          <span className="text-[#94A3B8] text-[11px] block">Remaining:</span>
          <span className="font-bold text-slate-200 font-mono text-sm">
            {period.remainingFormatted}
          </span>
          <span className="text-[10px] text-[#64748B] block">
            To reach 90:00 milestone
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#111318] border border-[#262B36]/60 col-span-2 sm:col-span-1">
          <span className="text-[#94A3B8] text-[11px] block">Carryover to Next Cycle:</span>
          <span className={`font-bold font-mono text-sm ${period.carryoverToNextCycleSeconds > 0 ? 'text-sky-400' : 'text-slate-400'}`}>
            {period.carryoverToNextCycleFormatted}
          </span>
          <span className="text-[10px] text-[#64748B] block">
            {period.carryoverToNextCycleSeconds > 0 ? 'Exceeds 90m block' : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};

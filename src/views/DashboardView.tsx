import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Trophy,
  Banknote,
  Film,
  TrendingUp,
  Calendar,
  Sparkles,
  Info,
  Share2,
} from 'lucide-react';
import {
  formatCurrency,
  formatMinutesDisplay,
  formatSecondsDigital,
} from '../lib/calculations';
import { CircularProgress } from '../components/CircularProgress';
import { ContractCompletionBanner } from '../components/ContractCompletionBanner';
import { EditVideoModal } from '../components/EditVideoModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { Video } from '../types';

export const DashboardView: React.FC = () => {
  const {
    contract,
    videos,
    progress,
    monthlyStats,
    analytics,
    currentMonthPace,
    setIsAddVideoModalOpen,
    setIsShareModalOpen,
    deleteVideo,
  } = useApp();

  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);

  // Current month stat
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthStat = monthlyStats.find((m) => m.monthKey === currentMonthKey);
  const currentMonthMinutes = currentMonthStat ? currentMonthStat.totalMinutes : 0;
  const currentMonthVideosCount = currentMonthStat ? currentMonthStat.videoCount : 0;
  const currentMonthLabel = currentMonthStat?.monthLabel || now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div id="dashboard-view" className="space-y-8 animate-in fade-in duration-200">
      {/* Contract Completion Celebration Banner if reached */}
      <ContractCompletionBanner />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#262B36]/60">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {contract.name}
            </h1>
            {progress.isContractCompleted ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Contract Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <Clock className="w-3.5 h-3.5" /> Contract Active
              </span>
            )}
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Runtime-based contract • Every {contract.milestone_minutes}m = {formatCurrency(contract.milestone_payment)} • Scope: {contract.total_required_minutes}m ({formatCurrency(contract.total_contract_value)})
          </p>
        </div>

        {/* Action Buttons: Share Progress & Add Completed Video */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            id="dashboard-share-progress-btn"
            onClick={() => setIsShareModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-[#1A1D26] hover:bg-[#222631] border border-[#262B36] text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
            title="Create and manage read-only progress report for your employer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share Progress</span>
          </button>

          <button
            id="dashboard-add-video-btn"
            onClick={() => setIsAddVideoModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Completed Video</span>
          </button>
        </div>
      </div>

      {/* Main Hero Progress Cards - 3 Core Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Most Important Card: Current Payment Milestone */}
        <div
          id="current-milestone-card"
          className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-[#161920] border border-emerald-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Milestone Pace
                </span>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">
                  Current Payment Milestone
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-mono">
                #{progress.currentMilestoneNumber} of {progress.totalMilestonesCount}
              </span>
            </div>

            <div className="flex items-center gap-6 my-3">
              <CircularProgress
                percentage={progress.currentMilestoneProgressPercentage}
                size={128}
                strokeWidth={11}
                colorClass={progress.isContractCompleted ? 'stroke-emerald-400' : 'stroke-emerald-500'}
                bgColorClass="stroke-[#222631]"
              >
                <span className="text-xl font-extrabold text-slate-100 tracking-tight font-mono">
                  {progress.currentMilestoneProgressPercentage.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#94A3B8] font-medium">of 90m block</span>
              </CircularProgress>

              <div className="space-y-1.5 min-w-0">
                <div className="text-2xl font-black text-slate-100 tracking-tight font-mono">
                  {formatMinutesDisplay(progress.minutesIntoCurrentMilestone)} / {contract.milestone_minutes}m
                </div>
                <p className="text-xs text-[#94A3B8]">
                  {formatSecondsDigital(progress.secondsIntoCurrentMilestone, true)} completed into current block
                </p>

                {progress.isContractCompleted ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Contract Goal Completed!
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-emerald-400">
                    {formatMinutesDisplay(progress.minutesUntilNextMilestone)} ({formatSecondsDigital(progress.secondsUntilNextMilestone, false)}) remaining
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#262B36] flex items-center justify-between text-xs">
            <span className="text-[#94A3B8]">Next milestone payout:</span>
            <span className="font-bold text-emerald-400 text-sm font-mono">
              +{formatCurrency(contract.milestone_payment)}
            </span>
          </div>
        </div>

        {/* 2. Total Contract Progress Card */}
        <div
          id="total-contract-card"
          className="lg:col-span-4 p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> Overall Scope
                </span>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">
                  Total Contract Progress
                </h2>
              </div>
              <span className="text-xs font-mono text-sky-300 font-bold px-2 py-0.5 rounded bg-[#222631] border border-[#262B36]">
                {progress.completedMilestonesCount} / {progress.totalMilestonesCount}
              </span>
            </div>

            <div className="my-3 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-100 font-mono">
                  {formatMinutesDisplay(progress.totalCompletedMinutes)} / {contract.total_required_minutes}m
                </span>
                <span className="text-sm font-extrabold text-sky-400 font-mono">
                  {progress.contractProgressPercentage.toFixed(1)}%
                </span>
              </div>

              {/* Main Contract Progress Bar */}
              <div className="w-full bg-[#0F1115] rounded-full h-3 overflow-hidden p-0.5 border border-[#262B36]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    progress.isContractCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-sky-500 to-emerald-400'
                  }`}
                  style={{ width: `${progress.contractProgressPercentage}%` }}
                />
              </div>

              {/* Financial summary */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#94A3B8]">Total Earned:</span>
                <span className="font-extrabold text-slate-100 text-sm font-mono">
                  {formatCurrency(progress.earnedAmount)} <span className="text-[#94A3B8] font-normal">/ {formatCurrency(contract.total_contract_value)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3.5 border-t border-[#262B36] grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#94A3B8] text-[11px] block">Remaining Runtime:</span>
              <p className="font-semibold text-slate-200 font-mono text-xs">
                {formatMinutesDisplay(progress.minutesRemaining)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[#94A3B8] text-[11px] block">Remaining Money:</span>
              <p className="font-semibold text-slate-200 font-mono text-xs">
                {formatCurrency(progress.moneyRemaining)}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Monthly Production / Reference Month */}
        <div
          id="current-month-card"
          className="lg:col-span-3 p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" /> Monthly Reference
              </span>
              <span className="text-[10px] text-[#94A3B8] bg-[#222631] px-2 py-0.5 rounded font-medium border border-[#262B36]">
                Pace Guide
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100">{currentMonthLabel}</h2>
          </div>

          <div className="my-3 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {formatMinutesDisplay(currentMonthMinutes)}
              </span>
              <span className="text-xs font-bold text-slate-300 font-mono">
                {Math.round((currentMonthMinutes / contract.monthly_reference_minutes) * 100)}% of 90m
              </span>
            </div>

            {/* Pace indicator badge */}
            <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
              currentMonthPace.status === 'ahead'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : currentMonthPace.status === 'on_track'
                ? 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
                : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
            }`}>
              <TrendingUp className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="leading-tight text-[11px] font-medium">{currentMonthPace.message}</span>
            </div>

            <p className="text-[11px] text-[#94A3B8]">
              {currentMonthVideosCount} {currentMonthVideosCount === 1 ? 'video' : 'videos'} produced this month.
            </p>
          </div>

          <div className="pt-3 border-t border-[#262B36] text-[10px] text-[#64748B] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            <span>Unused minutes carry forward indefinitely across months.</span>
          </div>
        </div>
      </div>

      {/* Supporting Statistics Grid */}
      <div id="quick-stats-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-[#161920] border border-[#262B36]">
          <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-1">
            <Film className="w-3.5 h-3.5" />
            <span>Videos Done</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">{videos.length}</div>
          <div className="text-[10px] text-[#64748B]">Completed files</div>
        </div>

        <div className="p-4 rounded-xl bg-[#161920] border border-[#262B36]">
          <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Total Runtime</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">{formatMinutesDisplay(progress.totalCompletedMinutes)}</div>
          <div className="text-[10px] text-[#64748B]">{progress.totalCompletedFormatted}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#161920] border border-[#262B36]">
          <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Milestones</span>
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">{progress.completedMilestonesCount} / 6</div>
          <div className="text-[10px] text-[#64748B]">90m blocks reached</div>
        </div>

        <div className="p-4 rounded-xl bg-[#161920] border border-[#262B36]">
          <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-1">
            <Banknote className="w-3.5 h-3.5" />
            <span>Total Earned</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">{formatCurrency(progress.earnedAmount)}</div>
          <div className="text-[10px] text-[#64748B]">of {formatCurrency(contract.total_contract_value)}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#161920] border border-[#262B36]">
          <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Avg Monthly</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">{formatMinutesDisplay(analytics.averageMonthlyMinutes)}</div>
          <div className="text-[10px] text-[#64748B]">{analytics.activeMonthsCount} active {analytics.activeMonthsCount === 1 ? 'month' : 'months'}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#161920] border border-[#262B36]">
          <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-1">
            <Play className="w-3.5 h-3.5" />
            <span>Avg Duration</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">{analytics.averageVideoDurationFormatted}</div>
          <div className="text-[10px] text-[#64748B]">Per video</div>
        </div>
      </div>

      {/* Edit & Delete Dialog Modals */}
      <EditVideoModal
        video={editingVideo}
        isOpen={Boolean(editingVideo)}
        onClose={() => setEditingVideo(null)}
      />

      <DeleteConfirmDialog
        video={deletingVideo}
        isOpen={Boolean(deletingVideo)}
        onClose={() => setDeletingVideo(null)}
        onConfirm={() => {
          if (deletingVideo) deleteVideo(deletingVideo.id);
        }}
      />
    </div>
  );
};

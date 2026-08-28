import React, { useState, useEffect } from 'react';
import {
  Film,
  CheckCircle2,
  Clock,
  Trophy,
  Banknote,
  Calendar,
  ExternalLink,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
  Video as VideoIcon,
  Loader2,
} from 'lucide-react';
import {
  formatCurrency,
  formatMinutesDisplay,
  formatSecondsDigital,
  calculateContractProgress,
  calculateMilestones,
  calculateMonthlyStats,
  calculateAnalytics,
} from '../lib/calculations';
import { CircularProgress } from '../components/CircularProgress';
import { Contract, Video, PaymentRecord, ShareLink } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_CONTRACT } from '../lib/sampleData';

interface SharedProgressViewProps {
  token: string;
}

export const SharedProgressView: React.FC<SharedProgressViewProps> = ({ token }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [reportContract, setReportContract] = useState<Contract>(DEFAULT_CONTRACT);
  const [reportVideos, setReportVideos] = useState<Video[]>([]);
  const [reportPayments, setReportPayments] = useState<PaymentRecord[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      setIsLoading(true);

      if (!token) {
        if (isMounted) {
          setIsValidToken(false);
          setIsLoading(false);
        }
        return;
      }

      if (isSupabaseConfigured && supabase) {
        try {
          // 1. Try secure RPC
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_shared_progress_report', {
            p_token: token,
          });

          if (!rpcError && rpcData && rpcData.contract) {
            if (isMounted) {
              const contractObj: Contract = {
                id: rpcData.contract.id,
                user_id: '',
                name: rpcData.contract.title || 'Video Editing Contract',
                monthly_reference_minutes: rpcData.contract.monthly_reference_minutes || 90,
                milestone_minutes: rpcData.contract.milestone_runtime_minutes || 90,
                milestone_payment: Number(rpcData.contract.milestone_amount) || 25000,
                total_contract_value: Number(rpcData.contract.total_contract_amount) || 150000,
                total_required_minutes: rpcData.contract.total_runtime_minutes || 540,
                start_date: rpcData.contract.start_date || new Date().toISOString().split('T')[0],
                status: rpcData.contract.status || 'active',
                created_at: rpcData.contract.created_at,
                updated_at: rpcData.contract.updated_at,
              };

              const videosList: Video[] = Array.isArray(rpcData.videos)
                ? rpcData.videos.map((v: any) => ({
                    id: v.id,
                    user_id: '',
                    contract_id: v.contract_id || contractObj.id,
                    title: v.title,
                    duration_seconds: Number(v.duration_seconds),
                    completion_date: v.completed_at || v.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                    completed_at: v.completed_at,
                    youtube_url: v.youtube_url,
                    notes: v.notes,
                    created_at: v.created_at || '',
                    updated_at: v.updated_at || '',
                  }))
                : [];

              const paymentsList: PaymentRecord[] = Array.isArray(rpcData.payments)
                ? rpcData.payments.map((p: any) => ({
                    id: p.id,
                    user_id: '',
                    contract_id: p.contract_id || contractObj.id,
                    milestone_number: p.milestone_number,
                    milestone_minutes: p.runtime_threshold_minutes || p.milestone_number * 90,
                    earned_amount: Number(p.amount) || 25000,
                    payment_status: p.paid ? 'paid' : 'pending',
                    earned: p.earned,
                    paid: p.paid,
                    payment_date: p.payment_date,
                    actual_amount_received: p.actual_amount_received ? Number(p.actual_amount_received) : null,
                    notes: p.notes,
                    created_at: p.created_at || '',
                    updated_at: p.updated_at || '',
                  }))
                : [];

              setReportContract(contractObj);
              setReportVideos(videosList);
              setReportPayments(paymentsList);
              setIsValidToken(true);
              setLastRefreshed(
                new Date().toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              );
              setIsLoading(false);
              return;
            }
          }

          // 2. Direct fallback query if RPC is not deployed yet
          const { data: linkRow, error: linkErr } = await supabase
            .from('share_links')
            .select('*')
            .eq('token', token)
            .eq('is_active', true)
            .maybeSingle();

          if (linkErr || !linkRow) {
            if (isMounted) {
              setIsValidToken(false);
              setIsLoading(false);
            }
            return;
          }

          // Fetch contract
          const { data: contractRow } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', linkRow.contract_id)
            .maybeSingle();

          // Fetch videos
          const { data: videosRows } = await supabase
            .from('videos')
            .select('*')
            .eq('contract_id', linkRow.contract_id)
            .order('completed_at', { ascending: false });

          // Fetch payments
          const { data: paymentsRows } = await supabase
            .from('payments')
            .select('*')
            .eq('contract_id', linkRow.contract_id)
            .order('milestone_number', { ascending: true });

          if (isMounted) {
            if (contractRow) {
              setReportContract({
                id: contractRow.id,
                user_id: contractRow.user_id,
                name: contractRow.title || 'Video Editing Contract',
                monthly_reference_minutes: contractRow.monthly_reference_minutes || 90,
                milestone_minutes: contractRow.milestone_runtime_minutes || 90,
                milestone_payment: Number(contractRow.milestone_amount) || 25000,
                total_contract_value: Number(contractRow.total_contract_amount) || 150000,
                total_required_minutes: contractRow.total_runtime_minutes || 540,
                start_date: contractRow.start_date || new Date().toISOString().split('T')[0],
                status: contractRow.status || 'active',
                created_at: contractRow.created_at,
                updated_at: contractRow.updated_at,
              });
            }

            if (videosRows) {
              setReportVideos(
                videosRows.map((v) => ({
                  id: v.id,
                  user_id: v.user_id,
                  contract_id: v.contract_id,
                  title: v.title,
                  duration_seconds: Number(v.duration_seconds),
                  completion_date: v.completed_at || v.created_at.split('T')[0],
                  completed_at: v.completed_at,
                  youtube_url: v.youtube_url,
                  notes: v.notes,
                  created_at: v.created_at,
                  updated_at: v.updated_at,
                }))
              );
            }

            if (paymentsRows) {
              setReportPayments(
                paymentsRows.map((p) => ({
                  id: p.id,
                  user_id: p.user_id,
                  contract_id: p.contract_id,
                  milestone_number: p.milestone_number,
                  milestone_minutes: p.runtime_threshold_minutes || p.milestone_number * 90,
                  earned_amount: Number(p.amount) || 25000,
                  payment_status: p.paid ? 'paid' : 'pending',
                  earned: p.earned,
                  paid: p.paid,
                  payment_date: p.payment_date,
                  actual_amount_received: p.actual_amount_received ? Number(p.actual_amount_received) : null,
                  notes: p.notes,
                  created_at: p.created_at,
                  updated_at: p.updated_at,
                }))
              );
            }

            setIsValidToken(true);
            setLastRefreshed(
              new Date().toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            );
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error querying share report from Supabase:', err);
        }
      }

      if (isMounted) {
        setIsValidToken(false);
        setIsLoading(false);
      }
    }

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] flex items-center justify-center p-6 antialiased">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-[#94A3B8] font-medium">Loading Verified Progress Report...</p>
        </div>
      </div>
    );
  }

  // Invalid or Revoked Link Screen
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] flex items-center justify-center p-6 antialiased selection:bg-emerald-500 selection:text-slate-950">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#161920] border border-[#262B36] text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Progress Report Not Available</h1>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            This progress report link is invalid or no longer active. Please contact the video editor to request an updated progress report link.
          </p>
          <div className="pt-2 text-[11px] text-[#64748B] flex items-center justify-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Read-Only Access System</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate live dynamic metrics using pure calculations
  const progress = calculateContractProgress(reportVideos, reportContract);
  const milestones = calculateMilestones(reportVideos, reportContract, reportPayments);
  const monthlyStats = calculateMonthlyStats(reportVideos, reportContract);
  const analytics = calculateAnalytics(reportVideos, reportContract);

  // Total paid calculation
  const totalPaidAmount = reportPayments
    .filter((p) => p.payment_status === 'paid' || p.paid === true)
    .reduce((sum, p) => sum + (p.actual_amount_received ?? p.earned_amount), 0);

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Professional Report Navigation Bar */}
      <header className="border-b border-[#262B36] bg-[#13161C]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm tracking-tight">
                  {reportContract.name}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#222631] text-[#94A3B8] border border-[#262B36]">
                  Progress Report
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Official Freelance Production &amp; Milestones Summary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {progress.isContractCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Contract Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> Contract Active
              </span>
            )}
            <span className="text-[11px] text-[#64748B] hidden md:inline">
              Last updated: {lastRefreshed || 'Live'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Report Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Contract Completion Celebration Banner if finished */}
        {progress.isContractCompleted && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  🎉 Contract Scope Fully Completed!
                </h2>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  All {reportContract.total_required_minutes} required minutes of completed video editing delivered ({formatCurrency(reportContract.total_contract_value)} total earned across 6 milestones).
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right shrink-0">
              <div className="text-xl font-black text-emerald-400 font-mono">
                {reportContract.total_required_minutes} / {reportContract.total_required_minutes} min
              </div>
              <div className="text-xs text-[#94A3B8] font-medium">6 of 6 Milestones Reached</div>
            </div>
          </div>
        )}

        {/* Section 1 & 2: Main Progress Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section 1: Overall Contract Progress */}
          <section
            id="shared-contract-progress"
            aria-labelledby="shared-contract-title"
            className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Overall Scope
                  </span>
                  <h2 id="shared-contract-title" className="text-lg font-bold text-slate-100 mt-0.5">
                    Contract Progress
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#222631] text-sky-300 border border-[#2B3240] font-mono">
                  {progress.completedMilestonesCount} / {progress.totalMilestonesCount} Milestones
                </span>
              </div>

              {/* Big metric row */}
              <div className="my-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight">
                    {formatMinutesDisplay(progress.totalCompletedMinutes)} <span className="text-base text-[#94A3B8] font-normal font-sans">/ {reportContract.total_required_minutes} minutes</span>
                  </div>
                  <span className="text-base font-extrabold text-sky-400 font-mono">
                    {progress.contractProgressPercentage.toFixed(1)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#0F1115] rounded-full h-3.5 overflow-hidden p-0.5 border border-[#262B36]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      progress.isContractCompleted
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400'
                    }`}
                    style={{ width: `${progress.contractProgressPercentage}%` }}
                  />
                </div>

                {/* Financial Summary */}
                <div className="flex items-center justify-between text-xs pt-1 text-[#94A3B8]">
                  <span>Total Earned:</span>
                  <span className="font-extrabold text-slate-100 text-sm font-mono">
                    {formatCurrency(progress.earnedAmount)}{' '}
                    <span className="text-[#94A3B8] font-normal">/ {formatCurrency(reportContract.total_contract_value)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sub Metrics Grid */}
            <div className="pt-4 mt-2 border-t border-[#262B36] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#1A1D26] border border-[#262B36]">
                <span className="text-[#94A3B8] text-[11px] block">Completed Runtime</span>
                <span className="font-bold text-slate-100 font-mono text-xs sm:text-sm">
                  {formatMinutesDisplay(progress.totalCompletedMinutes)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1A1D26] border border-[#262B36]">
                <span className="text-[#94A3B8] text-[11px] block">Remaining Runtime</span>
                <span className="font-bold text-slate-100 font-mono text-xs sm:text-sm">
                  {formatMinutesDisplay(progress.minutesRemaining)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1A1D26] border border-[#262B36]">
                <span className="text-[#94A3B8] text-[11px] block">Earned Amount</span>
                <span className="font-bold text-emerald-400 font-mono text-xs sm:text-sm">
                  {formatCurrency(progress.earnedAmount)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1A1D26] border border-[#262B36]">
                <span className="text-[#94A3B8] text-[11px] block">Remaining Amount</span>
                <span className="font-bold text-slate-100 font-mono text-xs sm:text-sm">
                  {formatCurrency(progress.moneyRemaining)}
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Current Payment Milestone */}
          <section
            id="shared-current-milestone"
            aria-labelledby="shared-milestone-title"
            className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-[#161920] border border-emerald-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Milestone Pace
                  </span>
                  <h2 id="shared-milestone-title" className="text-lg font-bold text-slate-100 mt-0.5">
                    Current Payment Milestone
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-mono">
                  #{progress.currentMilestoneNumber} of {progress.totalMilestonesCount}
                </span>
              </div>

              <div className="flex items-center gap-5 my-3">
                <CircularProgress
                  percentage={progress.currentMilestoneProgressPercentage}
                  size={120}
                  strokeWidth={10}
                  colorClass={progress.isContractCompleted ? 'stroke-emerald-400' : 'stroke-emerald-500'}
                  bgColorClass="stroke-[#222631]"
                >
                  <span className="text-lg font-extrabold text-slate-100 tracking-tight font-mono">
                    {progress.currentMilestoneProgressPercentage.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">of 90m block</span>
                </CircularProgress>

                <div className="space-y-1.5 min-w-0">
                  <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                    {formatMinutesDisplay(progress.minutesIntoCurrentMilestone)} / {reportContract.milestone_minutes}m
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    {formatSecondsDigital(progress.secondsIntoCurrentMilestone, true)} completed in this milestone
                  </p>
                  {progress.isContractCompleted ? (
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All milestones reached
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-emerald-400">
                      {formatMinutesDisplay(progress.minutesUntilNextMilestone)} remaining to next payout
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#262B36] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Payment for this milestone:</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  {formatCurrency(reportContract.milestone_payment)}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                90 minutes of completed video runtime is required for each {formatCurrency(reportContract.milestone_payment)} payment milestone. Minutes carry forward automatically.
              </p>
            </div>
          </section>
        </div>

        {/* Section 3: Completed Videos */}
        <section
          id="shared-completed-videos"
          aria-labelledby="shared-videos-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
            <div>
              <h2 id="shared-videos-title" className="text-lg font-bold text-slate-100">
                Completed Videos
              </h2>
              <p className="text-xs text-[#94A3B8]">
                All delivered videos contributing directly to cumulative contract runtime
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1D26] border border-[#262B36] text-xs text-slate-200 font-mono">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">{reportVideos.length} {reportVideos.length === 1 ? 'video' : 'videos'}</span>
              <span>•</span>
              <span className="font-bold text-emerald-400">{formatMinutesDisplay(progress.totalCompletedMinutes)} total</span>
            </div>
          </div>

          {reportVideos.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl border border-dashed border-[#262B36] bg-[#13161C]/50">
              <VideoIcon className="w-10 h-10 text-[#64748B] mx-auto mb-2" />
              <p className="text-xs text-[#94A3B8]">No completed videos recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#262B36] text-[#94A3B8] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Video Title</th>
                    <th className="pb-3 pr-4">Duration</th>
                    <th className="pb-3 pr-4">Completion Date</th>
                    <th className="pb-3 text-right">Reference / Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B36]/60">
                  {reportVideos.map((video, idx) => (
                    <tr key={video.id} className="hover:bg-[#1A1D26]/50 transition-colors">
                      <td className="py-3.5 pr-4 text-[#64748B] font-mono text-[11px]">
                        {reportVideos.length - idx}
                      </td>
                      <td className="py-3.5 pr-4 font-semibold text-slate-200 max-w-xs sm:max-w-md">
                        <div className="truncate">{video.title}</div>
                        {video.notes && (
                          <div className="text-[11px] text-[#64748B] truncate font-normal mt-0.5">
                            {video.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-bold text-slate-200 whitespace-nowrap">
                        {formatSecondsDigital(video.duration_seconds, true)}
                        <span className="text-[11px] text-[#94A3B8] font-normal ml-1.5">
                          ({formatMinutesDisplay(video.duration_seconds / 60)})
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-[#94A3B8] font-mono whitespace-nowrap">
                        {video.completion_date}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {video.youtube_url ? (
                          <a
                            href={video.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold text-xs hover:underline"
                          >
                            <span>Watch on YouTube</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-[#64748B] text-[11px]">
                            YouTube link not available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Video Total Summary Bar */}
          <div className="pt-4 border-t border-[#262B36] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#94A3B8] gap-2">
            <span>
              All runtimes are recorded to exact seconds and aggregated cumulatively.
            </span>
            <div className="font-mono text-slate-200 font-bold">
              Total Contract Runtime: <span className="text-emerald-400">{formatMinutesDisplay(progress.totalCompletedMinutes)}</span> ({progress.totalCompletedFormatted})
            </div>
          </div>
        </section>

        {/* Section 4: Payment History */}
        <section
          id="shared-payment-history"
          aria-labelledby="shared-payments-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
            <div>
              <h2 id="shared-payments-title" className="text-lg font-bold text-slate-100">
                Payment History
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Every 90-minute runtime threshold unlocks an official {formatCurrency(reportContract.milestone_payment)} milestone payout
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-semibold">
                Earned: {formatCurrency(progress.earnedAmount)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#222631] border border-[#262B36] text-[#94A3B8] font-mono font-semibold">
                Paid: {formatCurrency(totalPaidAmount)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#262B36] text-[#94A3B8] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="pb-3 pr-4">Milestone</th>
                  <th className="pb-3 pr-4">Runtime Threshold</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262B36]/60">
                {milestones.map((m) => {
                  const payment = m.paymentRecord;
                  const isPaid = payment?.payment_status === 'paid' || payment?.paid === true;
                  const isEarned = m.isEarned;

                  return (
                    <tr key={m.milestoneNumber} className="hover:bg-[#1A1D26]/50 transition-colors">
                      <td className="py-3.5 pr-4 font-bold text-slate-200">
                        Milestone #{m.milestoneNumber}
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-slate-300">
                        {m.thresholdMinutes} minutes
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-bold text-emerald-400">
                        {formatCurrency(m.milestonePayment)}
                      </td>
                      <td className="py-3.5 pr-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : isEarned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-3 h-3" /> Earned (Pending Payout)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#222631] text-[#94A3B8] border border-[#262B36]">
                            <Clock className="w-3 h-3" /> Upcoming
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right font-mono text-[#94A3B8]">
                        {isPaid && payment?.payment_date ? (
                          <span className="text-slate-200">{payment.payment_date}</span>
                        ) : isEarned ? (
                          <span className="text-amber-400/80 italic text-[11px]">Awaiting settlement</span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-[#13161C] border border-[#262B36] flex items-start gap-2 text-xs text-[#94A3B8]">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-slate-200">Earned vs Paid:</strong> Completing each 90-minute runtime threshold officially marks that milestone as <span className="text-amber-300 font-semibold">Earned</span>. Once the payment transfer is settled, it is recorded as <span className="text-emerald-300 font-semibold">Paid</span>.
            </p>
          </div>
        </section>

        {/* Section 5: Monthly Production */}
        <section
          id="shared-monthly-production"
          aria-labelledby="shared-monthly-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
            <div>
              <h2 id="shared-monthly-title" className="text-lg font-bold text-slate-100">
                Monthly Production
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Monthly editing pace breakdown and carry-over volume
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1A1D26] text-[#94A3B8] border border-[#262B36]">
              Reference target: {reportContract.monthly_reference_minutes}m / mo
            </span>
          </div>

          {monthlyStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#94A3B8]">
              No monthly activity recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#262B36] text-[#94A3B8] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="pb-3 pr-4">Month</th>
                    <th className="pb-3 pr-4 text-center">Videos</th>
                    <th className="pb-3 pr-4">Runtime</th>
                    <th className="pb-3 pr-4">Cumulative Total</th>
                    <th className="pb-3 text-right">Reference Pace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B36]/60">
                  {monthlyStats.map((stat) => (
                    <tr key={stat.monthKey} className="hover:bg-[#1A1D26]/50 transition-colors">
                      <td className="py-3.5 pr-4 font-bold text-slate-200">
                        {stat.monthLabel}
                      </td>
                      <td className="py-3.5 pr-4 text-center font-mono text-slate-300">
                        {stat.videoCount}
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-bold text-slate-200">
                        {formatMinutesDisplay(stat.totalMinutes)}
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-[#94A3B8]">
                        {formatMinutesDisplay(stat.cumulativeContractMinutesAtMonthEnd)}
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-sky-400">
                        {Math.round(stat.percentageOfReference)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#13161C] border border-[#262B36] flex items-start gap-2 text-xs text-[#94A3B8]">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Monthly production is shown for reference. Contract payments are based on cumulative completed video runtime, and unused minutes carry forward between months.
            </p>
          </div>
        </section>

        {/* Section 6: Summary Statistics */}
        <section
          id="shared-summary-stats"
          aria-labelledby="shared-summary-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-4"
        >
          <h2 id="shared-summary-title" className="text-base font-bold text-slate-100">
            Summary Statistics
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Total Videos Completed</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {analytics.totalVideos}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Total Editing Runtime</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {formatMinutesDisplay(analytics.totalMinutes)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Average Video Duration</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {analytics.averageVideoDurationFormatted}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Average Monthly Production</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {formatMinutesDisplay(analytics.averageMonthlyMinutes)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Milestones Completed</span>
              <span className="font-bold text-emerald-400 font-mono text-base mt-1 block">
                {progress.completedMilestonesCount} / 6
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Total Earned</span>
              <span className="font-bold text-emerald-400 font-mono text-base mt-1 block">
                {formatCurrency(progress.earnedAmount)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Total Paid</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {formatCurrency(totalPaidAmount)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Remaining Contract Value</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {formatCurrency(progress.moneyRemaining)}
              </span>
            </div>
          </div>
        </section>

        {/* Footer Notice */}
        <footer className="pt-8 pb-12 border-t border-[#262B36] text-center text-xs text-[#64748B] space-y-2">
          <div className="flex items-center justify-center gap-2 font-medium text-[#94A3B8]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Video Editing Contract Progress Report</span>
          </div>
          <p className="text-[11px]">
            This report is read-only and automatically synchronizes with the video editor’s verified delivery logs.
          </p>
        </footer>
      </main>
    </div>
  );
};

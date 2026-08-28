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
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import {
  formatCurrency,
  formatMinutesDisplay,
  formatSecondsDigital,
  calculateContractProgress,
  calculateMilestones,
  calculateMonthlyStats,
  calculateAnalytics,
  calculateEditingCycles,
} from '../lib/calculations';
import { CircularProgress } from '../components/CircularProgress';
import { Contract, Video, PaymentRecord, ShareLink, EditingCycle, CycleVideoContribution } from '../types';
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
  const [expandedCycles, setExpandedCycles] = useState<Record<number, boolean>>({});

  const toggleCycleExpanded = (cycleNum: number) => {
    setExpandedCycles((prev) => ({
      ...prev,
      [cycleNum]: !prev[cycleNum],
    }));
  };

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
  const cyclesSummary = calculateEditingCycles(reportVideos, reportContract, reportPayments);
  const monthlyStats = calculateMonthlyStats(reportVideos, reportContract);
  const analytics = calculateAnalytics(reportVideos, reportContract);

  const {
    latestCompletedCycle,
    currentInProgressCycle,
    completedCyclesCount,
    totalCyclesCount,
    totalCompletedMinutes,
    contractProgressPercentage,
    totalEarnedAmount,
    totalPaidAmount,
    isContractCompleted,
    remainingRuntimeMinutes,
    remainingContractValue,
    cycles,
  } = cyclesSummary;

  // Helper renderer for video contribution items
  const renderContributionCard = (c: CycleVideoContribution, idx: number) => (
    <div
      key={`${c.videoId}-${c.contributionSeconds}-${idx}`}
      className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#333A4A] transition-colors"
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-100 text-sm truncate">
            {c.videoTitle}
          </span>
          {c.isPartialContribution ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Partial ({formatSecondsDigital(c.contributionSeconds, true)} of {c.originalDurationFormatted} counted)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#222631] text-[#94A3B8] border border-[#2B3240]">
              Full video counted
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] flex-wrap">
          <span>Original duration: <strong className="text-slate-300 font-mono">{c.originalDurationFormatted}</strong></span>
          <span>•</span>
          <span>Completed: <strong className="text-slate-300">{c.completionDate}</strong></span>
          {c.notes && (
            <>
              <span>•</span>
              <span className="text-[#64748B] italic truncate max-w-xs">{c.notes}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#262B36]/60">
        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">Counted in Cycle</span>
          <span className="font-mono font-black text-emerald-400 text-sm">
            {formatSecondsDigital(c.contributionSeconds, true)}
            <span className="text-[11px] font-normal text-[#94A3B8] ml-1">({formatMinutesDisplay(c.contributionMinutes)})</span>
          </span>
        </div>

        {c.youtubeUrl ? (
          <a
            href={c.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
          >
            <span>Watch</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[11px] text-[#64748B] italic">No URL</span>
        )}
      </div>
    </div>
  );

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
                  Employer Progress Report
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Official Freelance Production &amp; 90-Minute Payment Cycles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {isContractCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Contract Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> Contract Active
              </span>
            )}
            <span className="text-[11px] text-[#64748B] hidden md:inline font-mono">
              Live sync: {lastRefreshed || 'Active'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Report Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Contract Completion Celebration Banner if finished */}
        {isContractCompleted && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  Contract Scope Fully Completed!
                </h2>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  All 540 required minutes of completed video editing delivered across all 6 payment cycles ({formatCurrency(reportContract.total_contract_value)} total earned).
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right shrink-0">
              <div className="text-xl font-black text-emerald-400 font-mono">
                540:00 / 540:00 min
              </div>
              <div className="text-xs text-[#94A3B8] font-medium">6 of 6 Cycles Reached</div>
            </div>
          </div>
        )}

        {/* 1. CONTRACT SUMMARY SECTION */}
        <section
          id="shared-contract-summary"
          aria-labelledby="shared-contract-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
            <div>
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Overall Scope
              </span>
              <h2 id="shared-contract-title" className="text-lg font-bold text-slate-100 mt-0.5">
                Contract Summary
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#222631] text-sky-300 border border-[#2B3240] font-mono">
                {completedCyclesCount} / {totalCyclesCount} Payment Cycles Completed
              </span>
            </div>
          </div>

          {/* Big metric row */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight">
                {formatMinutesDisplay(totalCompletedMinutes)}{' '}
                <span className="text-base text-[#94A3B8] font-normal font-sans">
                  / {reportContract.total_required_minutes} minutes ({formatSecondsDigital(cyclesSummary.totalCompletedSeconds, true)})
                </span>
              </div>
              <span className="text-lg font-extrabold text-sky-400 font-mono">
                {contractProgressPercentage.toFixed(1)}%
              </span>
            </div>

            {/* High Contrast Progress Bar */}
            <div className="w-full bg-[#0F1115] rounded-full h-3.5 overflow-hidden p-0.5 border border-[#262B36]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isContractCompleted
                    ? 'bg-emerald-400'
                    : 'bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400'
                }`}
                style={{ width: `${contractProgressPercentage}%` }}
              />
            </div>

            {/* Financial Summary Line */}
            <div className="flex items-center justify-between text-xs pt-1 text-[#94A3B8]">
              <span>Total Contract Earnings:</span>
              <span className="font-extrabold text-slate-100 text-sm font-mono">
                {formatCurrency(totalEarnedAmount)}{' '}
                <span className="text-[#94A3B8] font-normal">/ {formatCurrency(reportContract.total_contract_value)}</span>
              </span>
            </div>
          </div>

          {/* Sub Metrics Grid */}
          <div className="pt-4 border-t border-[#262B36] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Completed Runtime</span>
              <span className="font-bold text-slate-100 font-mono text-sm mt-0.5 block">
                {formatMinutesDisplay(totalCompletedMinutes)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Remaining Runtime</span>
              <span className="font-bold text-slate-100 font-mono text-sm mt-0.5 block">
                {formatMinutesDisplay(remainingRuntimeMinutes)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Total Earned</span>
              <span className="font-bold text-emerald-400 font-mono text-sm mt-0.5 block">
                {formatCurrency(totalEarnedAmount)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Remaining Value</span>
              <span className="font-bold text-slate-100 font-mono text-sm mt-0.5 block">
                {formatCurrency(remainingContractValue)}
              </span>
            </div>
          </div>
        </section>

        {/* 2. LATEST COMPLETED CYCLE (Primary Employer View) */}
        <section
          id="shared-latest-completed-cycle"
          aria-labelledby="shared-latest-cycle-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border-2 border-emerald-500/40 shadow-2xl space-y-6 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262B36]">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Primary Settlement View
              </span>
              <h2 id="shared-latest-cycle-title" className="text-xl font-bold text-slate-100 mt-0.5">
                Latest Completed Cycle
              </h2>
            </div>

            {latestCompletedCycle && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Cycle #{latestCompletedCycle.cycleNumber} Completed
                </span>
              </div>
            )}
          </div>

          {latestCompletedCycle ? (
            <div className="space-y-6">
              {/* Cycle Card Header Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Runtime Target */}
                <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36] space-y-1">
                  <span className="text-[11px] text-[#94A3B8] font-medium block">Completed Cycle Runtime</span>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    90:00 <span className="text-xs text-[#94A3B8] font-normal font-sans">/ 90:00 min</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 100% threshold achieved
                  </span>
                </div>

                {/* Milestone Payout Amount */}
                <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36] space-y-1">
                  <span className="text-[11px] text-[#94A3B8] font-medium block">Cycle Milestone Payout</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {formatCurrency(latestCompletedCycle.paymentAmount)}
                  </div>
                  <span className="text-[11px] text-[#94A3B8]">
                    Earned upon reaching 90-min runtime
                  </span>
                </div>

                {/* Payout Settlement Status */}
                <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36] space-y-1">
                  <span className="text-[11px] text-[#94A3B8] font-medium block">Settlement Status</span>
                  <div>
                    {latestCompletedCycle.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Paid {latestCompletedCycle.paymentDate ? `(${latestCompletedCycle.paymentDate})` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Earned (Pending Settlement)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#94A3B8] block">
                    {latestCompletedCycle.completedAtDate ? `Finished on ${latestCompletedCycle.completedAtDate}` : 'Fully delivered'}
                  </span>
                </div>
              </div>

              {/* Contributing Videos for this Cycle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Videos Contributing to Cycle #{latestCompletedCycle.cycleNumber}</span>
                  </h3>
                  <span className="text-xs text-[#94A3B8] font-mono font-semibold">
                    {latestCompletedCycle.contributions.length} {latestCompletedCycle.contributions.length === 1 ? 'video' : 'videos'} • 90:00 min total
                  </span>
                </div>

                <div className="space-y-2.5">
                  {latestCompletedCycle.contributions.map((contribution, idx) =>
                    renderContributionCard(contribution, idx)
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty state when no cycle has completed yet */
            <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#262B36] bg-[#13161C]/50 space-y-2">
              <Film className="w-10 h-10 text-emerald-400/60 mx-auto" />
              <h3 className="text-sm font-bold text-slate-200">Cycle #1 In Progress</h3>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Completed video editing runtime is accumulating toward the first 90-minute milestone ({formatCurrency(reportContract.milestone_payment)}).
              </p>
            </div>
          )}
        </section>

        {/* 3. CURRENT / IN-PROGRESS CYCLE */}
        {currentInProgressCycle && !isContractCompleted && (
          <section
            id="shared-current-cycle"
            aria-labelledby="shared-current-cycle-title"
            className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-sky-500/30 shadow-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262B36]">
              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" /> Active Production
                </span>
                <h2 id="shared-current-cycle-title" className="text-lg font-bold text-slate-100 mt-0.5">
                  Current Cycle #{currentInProgressCycle.cycleNumber}
                </h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono">
                Status: In Progress
              </span>
            </div>

            {/* Circular Progress & Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 flex items-center justify-center sm:justify-start gap-4">
                <CircularProgress
                  percentage={currentInProgressCycle.progressPercentage}
                  size={110}
                  strokeWidth={9}
                  colorClass="stroke-sky-400"
                  bgColorClass="stroke-[#222631]"
                >
                  <span className="text-lg font-extrabold text-slate-100 font-mono">
                    {currentInProgressCycle.progressPercentage.toFixed(0)}%
                  </span>
                  <span className="text-[9px] text-[#94A3B8]">of 90m block</span>
                </CircularProgress>

                <div className="space-y-1">
                  <div className="text-xl font-black text-slate-100 font-mono">
                    {formatSecondsDigital(currentInProgressCycle.completedSeconds, true)}{' '}
                    <span className="text-xs text-[#94A3B8] font-normal font-sans">/ 90:00</span>
                  </div>
                  <p className="text-xs text-sky-300 font-medium">
                    {formatMinutesDisplay(currentInProgressCycle.remainingMinutes)} remaining
                  </p>
                  <span className="text-[11px] text-[#94A3B8] block">
                    Next payout: <strong className="text-emerald-400 font-mono">{formatCurrency(currentInProgressCycle.paymentAmount)}</strong>
                  </span>
                </div>
              </div>

              <div className="md:col-span-8 p-4 rounded-xl bg-[#1A1D26] border border-[#262B36] text-xs text-[#94A3B8] space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span>Cycle #{currentInProgressCycle.cycleNumber} Threshold</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(currentInProgressCycle.paymentAmount)}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Payment is earned once cumulative runtime reaches 90:00 minutes for this cycle. Leftover minutes from previous videos have automatically carried forward into this cycle.
                </p>
              </div>
            </div>

            {/* Contributing Videos so far in this cycle */}
            <div className="space-y-3 pt-2 border-t border-[#262B36]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Film className="w-4 h-4 text-sky-400" />
                  <span>Videos Contributing so far in Cycle #{currentInProgressCycle.cycleNumber}</span>
                </h3>
                <span className="text-xs text-[#94A3B8] font-mono">
                  {currentInProgressCycle.contributions.length} {currentInProgressCycle.contributions.length === 1 ? 'entry' : 'entries'} • {formatSecondsDigital(currentInProgressCycle.completedSeconds, true)}
                </span>
              </div>

              {currentInProgressCycle.contributions.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#94A3B8] rounded-xl border border-dashed border-[#262B36] bg-[#13161C]/30">
                  No videos recorded for Cycle #{currentInProgressCycle.cycleNumber} yet. Next completed video will start filling this cycle.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentInProgressCycle.contributions.map((contribution, idx) =>
                    renderContributionCard(contribution, idx)
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. COMPLETED CYCLE HISTORY (Collapsible & Employer Friendly) */}
        <section
          id="shared-cycle-history"
          aria-labelledby="shared-history-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
            <div>
              <h2 id="shared-history-title" className="text-lg font-bold text-slate-100">
                Payment Cycle History
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Overview of all 6 payment cycles with expandable video breakdown
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-semibold">
                Earned: {formatCurrency(totalEarnedAmount)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#222631] border border-[#262B36] text-[#94A3B8] font-mono font-semibold">
                Paid: {formatCurrency(totalPaidAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {cycles.map((cycle) => {
              const isExpanded = Boolean(expandedCycles[cycle.cycleNumber]);
              const isCompleted = cycle.status === 'completed';
              const isInProgress = cycle.status === 'in_progress';
              const isUpcoming = cycle.status === 'upcoming';

              return (
                <div
                  key={cycle.cycleNumber}
                  className={`rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-[#161920] border-[#262B36]'
                      : isInProgress
                      ? 'bg-[#161920] border-sky-500/30'
                      : 'bg-[#13161C]/50 border-[#20242E] opacity-75'
                  }`}
                >
                  {/* Cycle Row Header */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isInProgress
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-[#222631] text-[#94A3B8] border border-[#2B3240]'
                        }`}
                      >
                        #{cycle.cycleNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">
                            Cycle #{cycle.cycleNumber}
                          </span>
                          <span className="font-mono text-xs text-slate-300">
                            ({formatSecondsDigital(cycle.completedSeconds, true)} / 90:00)
                          </span>
                        </div>
                        <span className="text-[11px] text-[#94A3B8] block">
                          Milestone payout: <strong className="text-emerald-400 font-mono">{formatCurrency(cycle.paymentAmount)}</strong>
                          {cycle.completedAtDate ? ` • Completed on ${cycle.completedAtDate}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Status Badge */}
                      {cycle.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Paid
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-3 h-3 text-amber-400" /> Earned (Pending)
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          <Clock className="w-3 h-3 text-sky-400" /> In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#222631] text-[#94A3B8] border border-[#2B3240]">
                          Upcoming
                        </span>
                      )}

                      {/* Expand Toggle */}
                      {cycle.contributions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleCycleExpanded(cycle.cycleNumber)}
                          className="px-2.5 py-1 rounded-lg bg-[#222631] hover:bg-[#2B3240] text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>{isExpanded ? 'Hide' : `Videos (${cycle.contributions.length})`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Video List */}
                  {isExpanded && cycle.contributions.length > 0 && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#262B36] space-y-2 bg-[#13161C]/50 rounded-b-xl">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] pb-1">
                        Contributing Videos to Cycle #{cycle.cycleNumber}:
                      </div>
                      {cycle.contributions.map((contribution, idx) =>
                        renderContributionCard(contribution, idx)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-[#13161C] border border-[#262B36] flex items-start gap-2 text-xs text-[#94A3B8]">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-slate-200">Cycle Allocation:</strong> Videos are allocated chronologically. If a video crosses a 90-minute boundary, its runtime is split accurately between consecutive cycles with zero double counting.
            </p>
          </div>
        </section>

        {/* 5. ALL COMPLETED VIDEOS LOG */}
        <section
          id="shared-all-videos"
          aria-labelledby="shared-all-videos-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
            <div>
              <h2 id="shared-all-videos-title" className="text-lg font-bold text-slate-100">
                All Completed Videos
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Chronological list of all delivered video editing projects
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1D26] border border-[#262B36] text-xs text-slate-200 font-mono">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">{reportVideos.length} {reportVideos.length === 1 ? 'video' : 'videos'}</span>
              <span>•</span>
              <span className="font-bold text-emerald-400">{formatMinutesDisplay(totalCompletedMinutes)} total</span>
            </div>
          </div>

          {reportVideos.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#262B36] bg-[#13161C]/50">
              <VideoIcon className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
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
                            <span>Watch</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-[#64748B] text-[11px]">
                            No link
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 6. MONTHLY PRODUCTION (Reference pace preserved) */}
        <section
          id="shared-monthly-production"
          aria-labelledby="shared-monthly-title"
          className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-[#262B36] shadow-xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262B36]">
            <div>
              <h2 id="shared-monthly-title" className="text-lg font-bold text-slate-100">
                Monthly Production Analytics
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Calendar production volume for pacing reference ({reportContract.monthly_reference_minutes}m target)
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1A1D26] text-[#94A3B8] border border-[#262B36]">
              Reference target: {reportContract.monthly_reference_minutes}m / mo
            </span>
          </div>

          {monthlyStats.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#94A3B8]">
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
        </section>

        {/* 7. SUMMARY STATISTICS GRID */}
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
              <span className="text-[#94A3B8] text-[11px] block">Average Monthly Volume</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {formatMinutesDisplay(analytics.averageMonthlyMinutes)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Completed Cycles</span>
              <span className="font-bold text-emerald-400 font-mono text-base mt-1 block">
                {completedCyclesCount} / 6
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Total Earned</span>
              <span className="font-bold text-emerald-400 font-mono text-base mt-1 block">
                {formatCurrency(totalEarnedAmount)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Total Paid</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {formatCurrency(totalPaidAmount)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D26] border border-[#262B36]">
              <span className="text-[#94A3B8] text-[11px] block">Remaining Value</span>
              <span className="font-bold text-slate-100 font-mono text-base mt-1 block">
                {formatCurrency(remainingContractValue)}
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


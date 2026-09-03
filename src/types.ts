export type ContractStatus = 'active' | 'completed' | 'paused';
export type PaymentStatus = 'pending' | 'paid';

export interface Profile {
  id: string;
  user_id?: string;
  name: string;
  display_name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  user_id: string;
  contract_id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  revoked_at?: string | null;
  last_accessed_at?: string | null;
}

export interface SharedReportData {
  contract: Contract;
  videos: Video[];
  payments: PaymentRecord[];
  progress: ContractProgress;
  milestones: MilestoneInfo[];
  monthlyStats: MonthlyStat[];
  analytics: AnalyticsData;
  lastUpdated: string;
  shareLink: ShareLink;
}

export interface Contract {
  id: string;
  user_id: string;
  name: string;
  title?: string;
  monthly_reference_minutes: number; // default 90
  milestone_minutes: number;         // default 90
  milestone_runtime_minutes?: number;
  milestone_payment: number;         // default 25000 (৳)
  milestone_amount?: number;
  total_contract_value: number;      // default 150000 (৳)
  total_contract_amount?: number;
  total_required_minutes: number;    // default 540 (90 * 6)
  total_runtime_minutes?: number;
  start_date: string;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  contract_id: string;
  title: string;
  duration_seconds: number;
  completion_date: string; // YYYY-MM-DD
  completed_at?: string;   // Database column alias
  youtube_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  contract_id: string;
  milestone_number: number;
  milestone_minutes: number;
  runtime_threshold_minutes?: number;
  earned_amount: number;
  amount?: number;
  payment_status: PaymentStatus;
  earned?: boolean;
  earned_at?: string | null;
  paid?: boolean;
  paid_at?: string | null;
  payment_date?: string | null;
  actual_amount_received?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneInfo {
  milestoneNumber: number;
  thresholdMinutes: number;
  thresholdSeconds: number;
  milestonePayment: number;
  cumulativePayment: number;
  status: 'completed' | 'current' | 'upcoming';
  progressPercentage: number;
  completedSeconds: number;
  remainingSeconds: number;
  completedMinutes: number;
  remainingMinutes: number;
  isEarned: boolean;
  paymentRecord?: PaymentRecord;
}

export interface ContractProgress {
  totalCompletedSeconds: number;
  totalCompletedMinutes: number;
  totalCompletedFormatted: string;
  
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  earnedAmount: number;
  
  contractProgressPercentage: number;
  isContractCompleted: boolean;
  
  secondsRemaining: number;
  minutesRemaining: number;
  moneyRemaining: number;
  
  // Current 90-min milestone metrics
  currentMilestoneNumber: number;
  secondsIntoCurrentMilestone: number;
  minutesIntoCurrentMilestone: number;
  secondsUntilNextMilestone: number;
  minutesUntilNextMilestone: number;
  currentMilestoneProgressPercentage: number;
  
  // Post contract
  postContractSeconds: number;
  postContractMinutes: number;
}

export interface MonthlyStat {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "August 2026"
  year: number;
  monthIndex: number; // 0-11
  videoCount: number;
  totalSeconds: number;
  totalMinutes: number;
  percentageOfReference: number;
  averageVideoDurationSeconds: number;
  milestonesCompletedInMonth: number[]; // e.g. [1, 2] if milestone 1 and 2 were crossed in this month
  carryOverMinutesToNextMonth: number;
  cumulativeContractMinutesAtMonthEnd: number;
}

export interface AnalyticsData {
  totalVideos: number;
  totalMinutes: number;
  totalHoursFormatted: string;
  averageMonthlyMinutes: number;
  averageVideoDurationSeconds: number;
  averageVideoDurationFormatted: string;
  longestVideo: Video | null;
  shortestVideo: Video | null;
  highestProductionMonth: MonthlyStat | null;
  activeMonthsCount: number;
  estimatedMonthsRemaining: number | null;
  estimatedMonthsRemainingFormatted: string;
  monthlyStats: MonthlyStat[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface CycleVideoContribution {
  videoId: string;
  videoTitle: string;
  originalDurationSeconds: number;
  originalDurationFormatted: string;
  contributionSeconds: number;
  contributionMinutes: number;
  contributionFormatted: string;
  completionDate: string;
  completedAt?: string;
  youtubeUrl?: string | null;
  notes?: string | null;
  isPartialContribution: boolean;
  partialPercentage: number;
  // Clear cycle boundary & carryover properties
  isFromPreviousCycle: boolean;
  countedInPreviousCyclesSeconds: number;
  countedInPreviousCyclesFormatted: string;
  carryoverToNextCycleSeconds: number;
  carryoverToNextCycleFormatted: string;
  // Compatibility aliases
  extraSecondsToNextPeriod?: number;
  extraFormattedToNextPeriod?: string;
}

export interface EditingCycle {
  cycleNumber: number;
  targetMinutes: number;
  targetSeconds: number;
  // Explicit carryover breakdowns
  startingCarryoverSeconds: number;
  startingCarryoverFormatted: string;
  newVideoRuntimeSeconds: number;
  newVideoRuntimeFormatted: string;
  carryoverToNextCycleSeconds: number;
  carryoverToNextCycleFormatted: string;
  completedSeconds: number;
  completedMinutes: number;
  completedFormatted: string;
  remainingSeconds: number;
  remainingMinutes: number;
  remainingFormatted: string;
  progressPercentage: number;
  status: 'completed' | 'in_progress' | 'upcoming';
  isEarned: boolean;
  isPaid: boolean;
  paymentAmount: number;
  actualAmountReceived?: number | null;
  paymentDate?: string | null;
  paymentRecord?: PaymentRecord;
  contributions: CycleVideoContribution[];
  completedAtDate?: string | null;
}

export interface EditingCyclesSummary {
  cycles: EditingCycle[];
  completedCyclesCount: number;
  totalCyclesCount: number;
  latestCompletedCycle: EditingCycle | null;
  currentInProgressCycle: EditingCycle | null;
  upcomingCycles: EditingCycle[];
  allCompletedCycles: EditingCycle[];
  totalContractSeconds: number;
  totalCompletedSeconds: number;
  totalCompletedMinutes: number;
  totalEarnedAmount: number;
  totalPaidAmount: number;
  contractProgressPercentage: number;
  isContractCompleted: boolean;
  remainingRuntimeMinutes: number;
  remainingContractValue: number;
}

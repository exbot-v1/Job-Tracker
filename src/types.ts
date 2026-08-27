export type ContractStatus = 'active' | 'completed' | 'paused';
export type PaymentStatus = 'pending' | 'paid';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
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
  monthly_reference_minutes: number; // default 90
  milestone_minutes: number;         // default 90
  milestone_payment: number;         // default 25000 (৳)
  total_contract_value: number;      // default 150000 (৳)
  total_required_minutes: number;    // default 540 (90 * 6)
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
  earned_amount: number;
  payment_status: PaymentStatus;
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

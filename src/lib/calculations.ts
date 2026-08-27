import { Contract, Video, ContractProgress, MilestoneInfo, MonthlyStat, AnalyticsData, PaymentRecord } from '../types';

/**
 * Format currency amount with Bangladeshi Taka sign ৳
 */
export function formatCurrency(amount: number): string {
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Parse string duration ("00:24:32", "24:32", "1:30:00") into exact integer seconds
 */
export function parseDurationToSeconds(input: string): { seconds: number; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { seconds: 0, error: 'Duration is required' };
  }

  // Support direct seconds number if provided
  if (/^\d+$/.test(trimmed)) {
    const s = parseInt(trimmed, 10);
    if (s <= 0) return { seconds: 0, error: 'Duration must be greater than 0' };
    return { seconds: s };
  }

  // Regex matching HH:MM:SS or MM:SS
  const parts = trimmed.split(':');
  if (parts.length === 2) {
    // MM:SS
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (isNaN(m) || isNaN(s) || m < 0 || s < 0 || s >= 60) {
      return { seconds: 0, error: 'Invalid format. Use MM:SS (e.g. 24:30) or HH:MM:SS' };
    }
    const total = m * 60 + s;
    if (total <= 0) return { seconds: 0, error: 'Duration must be greater than 0' };
    return { seconds: total };
  } else if (parts.length === 3) {
    // HH:MM:SS
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parseInt(parts[2], 10);
    if (isNaN(h) || isNaN(m) || isNaN(s) || h < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) {
      return { seconds: 0, error: 'Invalid format. Use HH:MM:SS (e.g. 00:24:30)' };
    }
    const total = h * 3600 + m * 60 + s;
    if (total <= 0) return { seconds: 0, error: 'Duration must be greater than 0' };
    return { seconds: total };
  }

  return { seconds: 0, error: 'Invalid format. Please enter as HH:MM:SS or MM:SS (e.g. 00:24:30)' };
}

/**
 * Format total seconds into standard digital display (HH:MM:SS or MM:SS)
 */
export function formatSecondsDigital(totalSeconds: number, forceHours = false): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0 || forceHours) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format total seconds into human-readable duration (e.g. "18m 42s" or "1h 15m 05s" or "75m 05s")
 */
export function formatSecondsHuman(totalSeconds: number, preferMinutes = false): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (preferMinutes) {
    const totalMins = Math.floor(safeSeconds / 60);
    return `${totalMins}m ${seconds}s`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

/**
 * Format minutes into display with 1 decimal or integer (e.g. 74.4 min or 90 min)
 */
export function formatMinutesDisplay(minutes: number): string {
  const rounded = Math.round(minutes * 10) / 10;
  return rounded % 1 === 0 ? `${rounded} min` : `${rounded.toFixed(1)} min`;
}

/**
 * Core Contract Progress calculation
 */
export function calculateContractProgress(videos: Video[], contract: Contract): ContractProgress {
  const totalCompletedSeconds = videos.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
  const totalCompletedMinutes = totalCompletedSeconds / 60;

  const milestoneSeconds = contract.milestone_minutes * 60;
  const totalRequiredSeconds = contract.total_required_minutes * 60;
  const totalMilestonesCount = Math.round(contract.total_required_minutes / contract.milestone_minutes);

  const completedMilestonesCount = Math.floor(totalCompletedSeconds / milestoneSeconds);
  const earnedAmount = Math.min(
    contract.total_contract_value,
    completedMilestonesCount * contract.milestone_payment
  );

  const isContractCompleted = totalCompletedSeconds >= totalRequiredSeconds;
  const contractProgressPercentage = Math.min(100, (totalCompletedSeconds / totalRequiredSeconds) * 100);

  const secondsRemaining = Math.max(0, totalRequiredSeconds - totalCompletedSeconds);
  const minutesRemaining = secondsRemaining / 60;
  const moneyRemaining = Math.max(0, contract.total_contract_value - earnedAmount);

  // Current milestone calculations
  let currentMilestoneNumber = completedMilestonesCount + 1;
  let secondsIntoCurrentMilestone = 0;
  let secondsUntilNextMilestone = milestoneSeconds;

  if (isContractCompleted) {
    currentMilestoneNumber = totalMilestonesCount;
    secondsIntoCurrentMilestone = milestoneSeconds;
    secondsUntilNextMilestone = 0;
  } else {
    secondsIntoCurrentMilestone = totalCompletedSeconds % milestoneSeconds;
    secondsUntilNextMilestone = milestoneSeconds - secondsIntoCurrentMilestone;
  }

  const minutesIntoCurrentMilestone = secondsIntoCurrentMilestone / 60;
  const minutesUntilNextMilestone = secondsUntilNextMilestone / 60;
  const currentMilestoneProgressPercentage = isContractCompleted
    ? 100
    : (secondsIntoCurrentMilestone / milestoneSeconds) * 100;

  // Post contract work
  const postContractSeconds = Math.max(0, totalCompletedSeconds - totalRequiredSeconds);
  const postContractMinutes = postContractSeconds / 60;

  return {
    totalCompletedSeconds,
    totalCompletedMinutes,
    totalCompletedFormatted: formatSecondsDigital(totalCompletedSeconds, true),
    completedMilestonesCount,
    totalMilestonesCount,
    earnedAmount,
    contractProgressPercentage,
    isContractCompleted,
    secondsRemaining,
    minutesRemaining,
    moneyRemaining,
    currentMilestoneNumber,
    secondsIntoCurrentMilestone,
    minutesIntoCurrentMilestone,
    secondsUntilNextMilestone,
    minutesUntilNextMilestone,
    currentMilestoneProgressPercentage,
    postContractSeconds,
    postContractMinutes,
  };
}

/**
 * Calculate milestones 1 to N with their exact status and attached payment records
 */
export function calculateMilestones(
  videos: Video[],
  contract: Contract,
  payments: PaymentRecord[] = []
): MilestoneInfo[] {
  const totalCompletedSeconds = videos.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
  const milestoneSeconds = contract.milestone_minutes * 60;
  const totalMilestonesCount = Math.round(contract.total_required_minutes / contract.milestone_minutes);

  const completedMilestonesCount = Math.floor(totalCompletedSeconds / milestoneSeconds);

  const milestones: MilestoneInfo[] = [];

  for (let i = 1; i <= totalMilestonesCount; i++) {
    const thresholdMinutes = i * contract.milestone_minutes;
    const thresholdSeconds = thresholdMinutes * 60;
    const cumulativePayment = i * contract.milestone_payment;
    const isEarned = totalCompletedSeconds >= thresholdSeconds;

    let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
    if (isEarned) {
      status = 'completed';
    } else if (i === completedMilestonesCount + 1) {
      status = 'current';
    }

    // How many seconds of this specific 90-minute block have been completed
    const startOfMilestoneSeconds = (i - 1) * milestoneSeconds;
    const completedSecondsInMilestone = Math.max(
      0,
      Math.min(milestoneSeconds, totalCompletedSeconds - startOfMilestoneSeconds)
    );

    const progressPercentage = Math.min(100, (completedSecondsInMilestone / milestoneSeconds) * 100);
    const remainingSeconds = Math.max(0, thresholdSeconds - totalCompletedSeconds);

    const paymentRecord = payments.find((p) => p.milestone_number === i);

    milestones.push({
      milestoneNumber: i,
      thresholdMinutes,
      thresholdSeconds,
      milestonePayment: contract.milestone_payment,
      cumulativePayment,
      status,
      progressPercentage,
      completedSeconds: completedSecondsInMilestone,
      remainingSeconds,
      completedMinutes: completedSecondsInMilestone / 60,
      remainingMinutes: remainingSeconds / 60,
      isEarned,
      paymentRecord,
    });
  }

  return milestones;
}

/**
 * Calculate monthly statistics and carry-forward breakdown
 */
export function calculateMonthlyStats(videos: Video[], contract: Contract): MonthlyStat[] {
  if (videos.length === 0) return [];

  // Sort videos by completion_date ascending
  const sortedVideos = [...videos].sort((a, b) => a.completion_date.localeCompare(b.completion_date));

  // Map to hold months in chronological order
  const monthMap = new Map<
    string,
    {
      year: number;
      monthIndex: number;
      videos: Video[];
    }
  >();

  sortedVideos.forEach((v) => {
    const date = new Date(v.completion_date);
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, { year, monthIndex, videos: [] });
    }
    monthMap.get(key)!.videos.push(v);
  });

  const milestoneSeconds = contract.milestone_minutes * 60;
  let cumulativeSeconds = 0;
  let previousMilestonesCount = 0;

  const result: MonthlyStat[] = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  monthMap.forEach((data, monthKey) => {
    const monthSeconds = data.videos.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
    const monthMinutes = monthSeconds / 60;

    const previousCumulativeSeconds = cumulativeSeconds;
    cumulativeSeconds += monthSeconds;

    const currentMilestonesCount = Math.floor(cumulativeSeconds / milestoneSeconds);
    const milestonesCompletedInMonth: number[] = [];

    for (let m = previousMilestonesCount + 1; m <= currentMilestonesCount; m++) {
      milestonesCompletedInMonth.push(m);
    }
    previousMilestonesCount = currentMilestonesCount;

    const carryOverSeconds = cumulativeSeconds % milestoneSeconds;
    const carryOverMinutesToNextMonth = carryOverSeconds / 60;

    const percentageOfReference = (monthMinutes / contract.monthly_reference_minutes) * 100;
    const averageVideoDurationSeconds = data.videos.length > 0 ? monthSeconds / data.videos.length : 0;

    result.push({
      monthKey,
      monthLabel: `${monthNames[data.monthIndex]} ${data.year}`,
      year: data.year,
      monthIndex: data.monthIndex,
      videoCount: data.videos.length,
      totalSeconds: monthSeconds,
      totalMinutes: monthMinutes,
      percentageOfReference,
      averageVideoDurationSeconds,
      milestonesCompletedInMonth,
      carryOverMinutesToNextMonth,
      cumulativeContractMinutesAtMonthEnd: cumulativeSeconds / 60,
    });
  });

  return result;
}

/**
 * Calculate comprehensive analytics
 */
export function calculateAnalytics(videos: Video[], contract: Contract): AnalyticsData {
  const totalVideos = videos.length;
  const totalCompletedSeconds = videos.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
  const totalMinutes = totalCompletedSeconds / 60;

  const monthlyStats = calculateMonthlyStats(videos, contract);
  const activeMonthsCount = monthlyStats.length;

  const averageMonthlyMinutes = activeMonthsCount > 0 ? totalMinutes / activeMonthsCount : 0;
  const averageVideoDurationSeconds = totalVideos > 0 ? totalCompletedSeconds / totalVideos : 0;

  let longestVideo: Video | null = null;
  let shortestVideo: Video | null = null;

  if (videos.length > 0) {
    longestVideo = videos.reduce((prev, curr) =>
      curr.duration_seconds > prev.duration_seconds ? curr : prev
    );
    shortestVideo = videos.reduce((prev, curr) =>
      curr.duration_seconds < prev.duration_seconds ? curr : prev
    );
  }

  let highestProductionMonth: MonthlyStat | null = null;
  if (monthlyStats.length > 0) {
    highestProductionMonth = monthlyStats.reduce((prev, curr) =>
      curr.totalMinutes > prev.totalMinutes ? curr : prev
    );
  }

  // Estimated months remaining based on average production pace
  const minutesRemaining = Math.max(0, contract.total_required_minutes - totalMinutes);
  let estimatedMonthsRemaining: number | null = null;
  let estimatedMonthsRemainingFormatted = 'Not enough data';

  if (minutesRemaining === 0) {
    estimatedMonthsRemainingFormatted = '0 (Contract Completed)';
  } else if (activeMonthsCount >= 1 && averageMonthlyMinutes > 5) {
    estimatedMonthsRemaining = minutesRemaining / averageMonthlyMinutes;
    estimatedMonthsRemainingFormatted = `~${estimatedMonthsRemaining.toFixed(1)} months`;
  }

  const hours = Math.floor(totalCompletedSeconds / 3600);
  const mins = Math.floor((totalCompletedSeconds % 3600) / 60);
  const totalHoursFormatted = `${hours}h ${mins}m`;

  return {
    totalVideos,
    totalMinutes,
    totalHoursFormatted,
    averageMonthlyMinutes,
    averageVideoDurationSeconds,
    averageVideoDurationFormatted: formatSecondsHuman(averageVideoDurationSeconds),
    longestVideo,
    shortestVideo,
    highestProductionMonth,
    activeMonthsCount,
    estimatedMonthsRemaining,
    estimatedMonthsRemainingFormatted,
    monthlyStats,
  };
}

/**
 * Smart Productivity Pace Indicator for the current month
 */
export function calculateMonthlyPace(
  currentMonthMinutes: number,
  referenceTargetMinutes: number,
  currentDate = new Date()
): {
  status: 'ahead' | 'on_track' | 'behind';
  badgeColor: string;
  message: string;
  percentageOfTarget: number;
} {
  const percentageOfTarget = (currentMonthMinutes / referenceTargetMinutes) * 100;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dayOfMonth = currentDate.getDate();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const expectedProgressFraction = dayOfMonth / totalDaysInMonth;
  const expectedMinutesByToday = expectedProgressFraction * referenceTargetMinutes;

  if (currentMonthMinutes >= referenceTargetMinutes) {
    return {
      status: 'ahead',
      badgeColor: 'emerald',
      message: `Completed 100%+ of monthly reference target (${formatMinutesDisplay(currentMonthMinutes)} / ${referenceTargetMinutes}m)`,
      percentageOfTarget,
    };
  }

  const diff = currentMonthMinutes - expectedMinutesByToday;

  if (diff >= 5) {
    return {
      status: 'ahead',
      badgeColor: 'emerald',
      message: `Ahead of monthly reference pace (+${Math.round(diff)} min)`,
      percentageOfTarget,
    };
  } else if (diff >= -10) {
    return {
      status: 'on_track',
      badgeColor: 'sky',
      message: `On track for your ${referenceTargetMinutes}-minute monthly reference target`,
      percentageOfTarget,
    };
  } else {
    return {
      status: 'behind',
      badgeColor: 'amber',
      message: `Behind reference pace (${Math.round(Math.abs(diff))} min below expected date pace)`,
      percentageOfTarget,
    };
  }
}

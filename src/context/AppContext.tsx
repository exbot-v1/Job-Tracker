import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Contract,
  Video,
  PaymentRecord,
  ContractProgress,
  MilestoneInfo,
  MonthlyStat,
  AnalyticsData,
  ToastMessage,
  Profile,
  ShareLink,
} from '../types';
import {
  calculateContractProgress,
  calculateMilestones,
  calculateMonthlyStats,
  calculateAnalytics,
  calculateMonthlyPace,
  formatSecondsDigital,
} from '../lib/calculations';
import { DEFAULT_CONTRACT } from '../lib/sampleData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type NavTab = 'dashboard' | 'videos' | 'milestones' | 'payments' | 'analytics' | 'settings';

interface AppContextType {
  // Navigation & Theme
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth & Profile
  user: Profile | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingData: boolean;
  loginWithSupabase: (email: string, pass: string) => Promise<{ error?: string }>;
  signupWithSupabase: (email: string, pass: string, name: string) => Promise<{ error?: string; message?: string }>;
  logout: () => Promise<void>;

  // Data
  contract: Contract;
  videos: Video[];
  payments: PaymentRecord[];

  // Computed & Derived Metrics
  progress: ContractProgress;
  milestones: MilestoneInfo[];
  monthlyStats: MonthlyStat[];
  analytics: AnalyticsData;
  currentMonthPace: ReturnType<typeof calculateMonthlyPace>;

  // Video Actions
  addVideo: (video: Omit<Video, 'id' | 'user_id' | 'contract_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateVideo: (id: string, updates: Partial<Video>) => Promise<boolean>;
  deleteVideo: (id: string) => Promise<boolean>;

  // Payment Actions
  updatePayment: (milestoneNumber: number, data: Partial<PaymentRecord>) => Promise<boolean>;

  // Contract & Settings
  updateContract: (updates: Partial<Contract>) => Promise<boolean>;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => Promise<boolean>;

  // Share Progress Feature
  shareLink: ShareLink | null;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  createShareLink: () => Promise<ShareLink | null>;
  revokeShareLink: () => Promise<boolean>;
  regenerateShareLink: () => Promise<ShareLink | null>;

  // PDF Export
  isExportPdfModalOpen: boolean;
  setIsExportPdfModalOpen: (open: boolean) => void;

  // UI helpers
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  isAddVideoModalOpen: boolean;
  setIsAddVideoModalOpen: (open: boolean) => void;
  triggerMilestoneCelebration: (title?: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  THEME: 'vtrack_theme_v1',
};

// Cryptographic token generator
function generateSecureToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < array.length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 24; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return token;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);

  // Auth state - strictly Supabase auth (no hardcoded fake user!)
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Core Data state
  const [contract, setContract] = useState<Contract>(DEFAULT_CONTRACT);
  const [videos, setVideos] = useState<Video[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);

  // Sync theme to DOM
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Toast Helpers
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerMilestoneCelebration = useCallback((_title?: string) => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#38bdf8', '#f59e0b', '#818cf8', '#34d399'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Fetch all user data from Supabase
  const loadUserData = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsLoadingData(true);

    try {
      // 1. Fetch Contract
      const { data: contractData, error: contractErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let activeContract: Contract;

      if (!contractData || contractErr) {
        // Create initial default contract for this user in Supabase
        const newContractPayload = {
          user_id: userId,
          title: 'Video Editing Contract',
          status: 'active',
          milestone_runtime_minutes: 90,
          milestone_amount: 25000,
          total_runtime_minutes: 540,
          total_contract_amount: 150000,
          monthly_reference_minutes: 90,
          start_date: new Date().toISOString().split('T')[0],
        };

        const { data: createdContract } = await supabase
          .from('contracts')
          .insert(newContractPayload)
          .select()
          .single();

        if (createdContract) {
          activeContract = {
            id: createdContract.id,
            user_id: createdContract.user_id,
            name: createdContract.title || 'Video Editing Contract',
            monthly_reference_minutes: createdContract.monthly_reference_minutes || 90,
            milestone_minutes: createdContract.milestone_runtime_minutes || 90,
            milestone_payment: Number(createdContract.milestone_amount) || 25000,
            total_contract_value: Number(createdContract.total_contract_amount) || 150000,
            total_required_minutes: createdContract.total_runtime_minutes || 540,
            start_date: createdContract.start_date || new Date().toISOString().split('T')[0],
            status: createdContract.status || 'active',
            created_at: createdContract.created_at,
            updated_at: createdContract.updated_at,
          };
        } else {
          activeContract = {
            ...DEFAULT_CONTRACT,
            user_id: userId,
          };
        }
      } else {
        activeContract = {
          id: contractData.id,
          user_id: contractData.user_id,
          name: contractData.title || 'Video Editing Contract',
          monthly_reference_minutes: contractData.monthly_reference_minutes || 90,
          milestone_minutes: contractData.milestone_runtime_minutes || 90,
          milestone_payment: Number(contractData.milestone_amount) || 25000,
          total_contract_value: Number(contractData.total_contract_amount) || 150000,
          total_required_minutes: contractData.total_runtime_minutes || 540,
          start_date: contractData.start_date || new Date().toISOString().split('T')[0],
          status: contractData.status || 'active',
          created_at: contractData.created_at,
          updated_at: contractData.updated_at,
        };
      }
      setContract(activeContract);

      // 2. Fetch Completed Videos (Strictly for this user and contract)
      const { data: videosData, error: videosErr } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (!videosErr && videosData) {
        const mappedVideos: Video[] = videosData.map((v) => ({
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
        }));
        setVideos(mappedVideos);
      } else {
        setVideos([]);
      }

      // 3. Fetch Payments
      const { data: paymentsData, error: paymentsErr } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('milestone_number', { ascending: true });

      if (!paymentsErr && paymentsData) {
        const mappedPayments: PaymentRecord[] = paymentsData.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          contract_id: p.contract_id,
          milestone_number: p.milestone_number,
          milestone_minutes: p.runtime_threshold_minutes || p.milestone_number * 90,
          earned_amount: Number(p.amount) || 25000,
          payment_status: p.paid ? 'paid' : 'pending',
          earned: p.earned,
          earned_at: p.earned_at,
          paid: p.paid,
          paid_at: p.paid_at,
          payment_date: p.payment_date,
          actual_amount_received: p.actual_amount_received ? Number(p.actual_amount_received) : null,
          notes: p.notes,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        setPayments(mappedPayments);
      } else {
        setPayments([]);
      }

      // 4. Fetch Active Share Link
      const { data: shareData } = await supabase
        .from('share_links')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (shareData) {
        setShareLink({
          id: shareData.id,
          user_id: shareData.user_id,
          contract_id: shareData.contract_id,
          token: shareData.token,
          is_active: shareData.is_active,
          created_at: shareData.created_at,
          revoked_at: shareData.revoked_at,
          last_accessed_at: shareData.last_accessed_at,
        });
      } else {
        setShareLink(null);
      }
    } catch (err) {
      console.error('Error loading Supabase user data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Supabase Auth State Listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoadingAuth(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const prof: Profile = {
          id: session.user.id,
          user_id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Video Editor',
          email: session.user.email,
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
        };
        setUser(prof);
        loadUserData(session.user.id);
      } else {
        setUser(null);
      }
      setIsLoadingAuth(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const prof: Profile = {
          id: session.user.id,
          user_id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Video Editor',
          email: session.user.email,
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
        };
        setUser(prof);
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await loadUserData(session.user.id);
        }
      } else {
        setUser(null);
        setVideos([]);
        setPayments([]);
        setShareLink(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Computed Values using exact contract rules
  const progress = useMemo(() => {
    return calculateContractProgress(videos, contract);
  }, [videos, contract]);

  const milestones = useMemo(() => {
    return calculateMilestones(videos, contract, payments);
  }, [videos, contract, payments]);

  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(videos, contract);
  }, [videos, contract]);

  const analytics = useMemo(() => {
    return calculateAnalytics(videos, contract);
  }, [videos, contract]);

  // Current Month Pace calculation
  const currentMonthPace = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthData = monthlyStats.find((m) => m.monthKey === currentMonthKey);
    const currentMonthMinutes = currentMonthData ? currentMonthData.totalMinutes : 0;
    return calculateMonthlyPace(currentMonthMinutes, contract.monthly_reference_minutes, now);
  }, [monthlyStats, contract.monthly_reference_minutes]);

  // Action: Add Video
  const addVideo = useCallback(
    async (data: Omit<Video, 'id' | 'user_id' | 'contract_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
      if (!user?.id) {
        addToast({
          type: 'error',
          title: 'Not Authenticated',
          message: 'Please sign in to record completed videos.',
        });
        return false;
      }

      const prevCompletedMilestones = progress.completedMilestonesCount;
      const prevIsCompleted = progress.isContractCompleted;

      const completionDate = data.completion_date || new Date().toISOString().split('T')[0];

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: inserted, error } = await supabase
            .from('videos')
            .insert({
              user_id: user.id,
              contract_id: contract.id,
              title: data.title.trim(),
              duration_seconds: data.duration_seconds,
              completed_at: completionDate,
              youtube_url: data.youtube_url?.trim() || null,
              notes: data.notes?.trim() || null,
            })
            .select()
            .single();

          if (error || !inserted) {
            throw new Error(error?.message || 'Database insert failed');
          }

          const newVideo: Video = {
            id: inserted.id,
            user_id: inserted.user_id,
            contract_id: inserted.contract_id,
            title: inserted.title,
            duration_seconds: Number(inserted.duration_seconds),
            completion_date: inserted.completed_at || completionDate,
            completed_at: inserted.completed_at,
            youtube_url: inserted.youtube_url,
            notes: inserted.notes,
            created_at: inserted.created_at,
            updated_at: inserted.updated_at,
          };

          const updatedList = [newVideo, ...videos];
          setVideos(updatedList);

          // Evaluate milestone triggers
          const nextProgress = calculateContractProgress(updatedList, contract);

          if (!prevIsCompleted && nextProgress.isContractCompleted) {
            triggerMilestoneCelebration('Contract Completed!');
            addToast({
              type: 'success',
              title: '🎉 CONTRACT COMPLETED! ৳150,000 Earned',
              message: 'Congratulations! You have completed all 540 required minutes of edited runtime!',
              duration: 7000,
            });
          } else if (nextProgress.completedMilestonesCount > prevCompletedMilestones) {
            const newlyEarnedMilestones = nextProgress.completedMilestonesCount - prevCompletedMilestones;
            triggerMilestoneCelebration('Milestone Earned!');
            addToast({
              type: 'success',
              title: `🎉 ৳${(newlyEarnedMilestones * contract.milestone_payment).toLocaleString()} Earned!`,
              message: `Reached Milestone #${nextProgress.completedMilestonesCount} (${nextProgress.completedMilestonesCount * contract.milestone_minutes} minutes). Extra minutes carried forward!`,
              duration: 6000,
            });
          } else {
            addToast({
              type: 'success',
              title: 'Video Recorded',
              message: `"${newVideo.title}" (${formatSecondsDigital(newVideo.duration_seconds)}) saved successfully.`,
            });
          }

          return true;
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Unable to save video',
            message: err.message || 'Please check your Supabase connection and try again.',
          });
          return false;
        }
      }

      return false;
    },
    [user, contract, videos, progress, addToast, triggerMilestoneCelebration]
  );

  // Action: Update Video
  const updateVideo = useCallback(
    async (id: string, updates: Partial<Video>): Promise<boolean> => {
      if (!user?.id) return false;

      if (isSupabaseConfigured && supabase) {
        try {
          const dbUpdates: Record<string, any> = {};
          if (updates.title !== undefined) dbUpdates.title = updates.title;
          if (updates.duration_seconds !== undefined) dbUpdates.duration_seconds = updates.duration_seconds;
          if (updates.completion_date !== undefined) dbUpdates.completed_at = updates.completion_date;
          if (updates.youtube_url !== undefined) dbUpdates.youtube_url = updates.youtube_url;
          if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
          dbUpdates.updated_at = new Date().toISOString();

          const { error } = await supabase
            .from('videos')
            .update(dbUpdates)
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;

          setVideos((prev) =>
            prev.map((v) => (v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v))
          );

          addToast({
            type: 'info',
            title: 'Video Updated',
            message: 'Changes saved to Supabase and progress updated.',
          });
          return true;
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Update Failed',
            message: err.message || 'Could not update video in Supabase.',
          });
          return false;
        }
      }
      return false;
    },
    [user, addToast]
  );

  // Action: Delete Video
  const deleteVideo = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false;
      const target = videos.find((v) => v.id === id);

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;

          setVideos((prev) => prev.filter((v) => v.id !== id));

          addToast({
            type: 'warning',
            title: 'Video Deleted',
            message: target ? `"${target.title}" was removed.` : 'Video entry removed.',
          });
          return true;
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Delete Failed',
            message: err.message || 'Could not delete video from Supabase.',
          });
          return false;
        }
      }
      return false;
    },
    [user, videos, addToast]
  );

  // Action: Update Payment (Earned vs Paid)
  const updatePayment = useCallback(
    async (milestoneNumber: number, data: Partial<PaymentRecord>): Promise<boolean> => {
      if (!user?.id) return false;

      const thresholdMinutes = milestoneNumber * contract.milestone_minutes;
      const isPaid = data.payment_status === 'paid' || data.paid === true;

      if (isSupabaseConfigured && supabase) {
        try {
          const paymentPayload = {
            contract_id: contract.id,
            user_id: user.id,
            milestone_number: milestoneNumber,
            runtime_threshold_minutes: thresholdMinutes,
            amount: contract.milestone_payment,
            earned: data.earned ?? true,
            earned_at: data.earned_at || new Date().toISOString(),
            paid: isPaid,
            paid_at: isPaid ? (data.paid_at || new Date().toISOString()) : null,
            payment_date: data.payment_date || new Date().toISOString().split('T')[0],
            actual_amount_received: data.actual_amount_received ?? contract.milestone_payment,
            notes: data.notes || null,
            updated_at: new Date().toISOString(),
          };

          const { data: saved, error } = await supabase
            .from('payments')
            .upsert(paymentPayload, { onConflict: 'contract_id,milestone_number' })
            .select()
            .single();

          if (error || !saved) throw error;

          setPayments((prev) => {
            const existingIdx = prev.findIndex((p) => p.milestone_number === milestoneNumber);
            const mappedRecord: PaymentRecord = {
              id: saved.id,
              user_id: saved.user_id,
              contract_id: saved.contract_id,
              milestone_number: saved.milestone_number,
              milestone_minutes: saved.runtime_threshold_minutes,
              earned_amount: Number(saved.amount),
              payment_status: saved.paid ? 'paid' : 'pending',
              earned: saved.earned,
              paid: saved.paid,
              payment_date: saved.payment_date,
              actual_amount_received: saved.actual_amount_received ? Number(saved.actual_amount_received) : null,
              notes: saved.notes,
              created_at: saved.created_at,
              updated_at: saved.updated_at,
            };

            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = mappedRecord;
              return updated;
            }
            return [...prev, mappedRecord];
          });

          addToast({
            type: 'success',
            title: 'Payment Recorded',
            message: `Milestone #${milestoneNumber} marked as ${isPaid ? 'Paid' : 'Pending'}.`,
          });
          return true;
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Payment Update Failed',
            message: err.message || 'Could not update payment record.',
          });
          return false;
        }
      }
      return false;
    },
    [user, contract, addToast]
  );

  // Action: Update Contract
  const updateContract = useCallback(
    async (updates: Partial<Contract>): Promise<boolean> => {
      if (!user?.id) return false;

      if (isSupabaseConfigured && supabase) {
        try {
          const dbUpdates: Record<string, any> = {};
          if (updates.name !== undefined) dbUpdates.title = updates.name;
          if (updates.monthly_reference_minutes !== undefined)
            dbUpdates.monthly_reference_minutes = updates.monthly_reference_minutes;
          if (updates.milestone_minutes !== undefined)
            dbUpdates.milestone_runtime_minutes = updates.milestone_minutes;
          if (updates.milestone_payment !== undefined)
            dbUpdates.milestone_amount = updates.milestone_payment;
          if (updates.total_contract_value !== undefined)
            dbUpdates.total_contract_amount = updates.total_contract_value;
          if (updates.total_required_minutes !== undefined)
            dbUpdates.total_runtime_minutes = updates.total_required_minutes;
          if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date;
          if (updates.status !== undefined) dbUpdates.status = updates.status;
          dbUpdates.updated_at = new Date().toISOString();

          const { error } = await supabase
            .from('contracts')
            .update(dbUpdates)
            .eq('id', contract.id)
            .eq('user_id', user.id);

          if (error) throw error;

          setContract((prev) => ({
            ...prev,
            ...updates,
            updated_at: new Date().toISOString(),
          }));

          addToast({
            type: 'success',
            title: 'Contract Terms Saved',
            message: 'Contract settings updated in Supabase.',
          });
          return true;
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Contract Update Failed',
            message: err.message || 'Could not update contract settings.',
          });
          return false;
        }
      }
      return false;
    },
    [user, contract, addToast]
  );

  // Action: Create Share Link
  const createShareLink = useCallback(async (): Promise<ShareLink | null> => {
    if (!user?.id) {
      addToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to generate share links.',
      });
      return null;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const token = generateSecureToken();

        // 1. Deactivate any previously active links for this user & contract
        await supabase
          .from('share_links')
          .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('is_active', true);

        // 2. Insert new active share link
        const { data: newRow, error } = await supabase
          .from('share_links')
          .insert({
            user_id: user.id,
            contract_id: contract.id,
            token,
            is_active: true,
          })
          .select()
          .single();

        if (error || !newRow) throw error;

        const newLink: ShareLink = {
          id: newRow.id,
          user_id: newRow.user_id,
          contract_id: newRow.contract_id,
          token: newRow.token,
          is_active: newRow.is_active,
          created_at: newRow.created_at,
          revoked_at: newRow.revoked_at,
          last_accessed_at: newRow.last_accessed_at,
        };

        setShareLink(newLink);

        addToast({
          type: 'success',
          title: 'Share Link Created',
          message: 'Read-only employer progress link is active and ready to copy.',
        });

        return newLink;
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Unable to create share link',
          message: err.message || 'Please try again.',
        });
        return null;
      }
    }
    return null;
  }, [user, contract, addToast]);

  // Action: Revoke Share Link
  const revokeShareLink = useCallback(async (): Promise<boolean> => {
    if (!shareLink || !user?.id) return false;

    if (isSupabaseConfigured && supabase) {
      try {
        const revokedAt = new Date().toISOString();
        const { error } = await supabase
          .from('share_links')
          .update({
            is_active: false,
            revoked_at: revokedAt,
          })
          .eq('id', shareLink.id)
          .eq('user_id', user.id);

        if (error) throw error;

        const revoked: ShareLink = {
          ...shareLink,
          is_active: false,
          revoked_at: revokedAt,
        };

        setShareLink(revoked);

        addToast({
          type: 'warning',
          title: 'Share Link Revoked',
          message: 'Previous share link is now disabled. Employer access blocked.',
        });

        return true;
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Revoke Failed',
          message: err.message || 'Could not revoke share link.',
        });
        return false;
      }
    }
    return false;
  }, [shareLink, user, addToast]);

  // Action: Regenerate Share Link
  const regenerateShareLink = useCallback(async (): Promise<ShareLink | null> => {
    return createShareLink();
  }, [createShareLink]);

  // Export Data JSON
  const exportDataJson = useCallback(() => {
    const data = {
      version: '2.0',
      exported_at: new Date().toISOString(),
      user: { id: user?.id, email: user?.email },
      contract,
      videos,
      payments,
    };
    return JSON.stringify(data, null, 2);
  }, [user, contract, videos, payments]);

  // Import Data JSON
  const importDataJson = useCallback(
    async (jsonStr: string): Promise<boolean> => {
      if (!user?.id) return false;
      try {
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed.videos)) {
          throw new Error('Invalid JSON structure. Missing videos array.');
        }

        if (isSupabaseConfigured && supabase) {
          // Bulk insert videos for this user
          const videoRows = parsed.videos.map((v: any) => ({
            user_id: user.id,
            contract_id: contract.id,
            title: v.title,
            duration_seconds: v.duration_seconds,
            completed_at: v.completion_date || v.completed_at || new Date().toISOString().split('T')[0],
            youtube_url: v.youtube_url || null,
            notes: v.notes || null,
          }));

          const { error } = await supabase.from('videos').insert(videoRows);
          if (error) throw error;

          await loadUserData(user.id);

          addToast({
            type: 'success',
            title: 'Data Imported',
            message: `Successfully imported ${videoRows.length} videos into Supabase.`,
          });
          return true;
        }
        return false;
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: err.message || 'Could not parse JSON backup file.',
        });
        return false;
      }
    },
    [user, contract, loadUserData, addToast]
  );

  // Auth Operations
  const loginWithSupabase = useCallback(
    async (email: string, pass: string): Promise<{ error?: string }> => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          error:
            'Authentication is currently unavailable. Please check the application\'s Supabase configuration.',
        };
      }

      setIsLoadingAuth(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (error) {
          setIsLoadingAuth(false);
          return { error: error.message };
        }

        if (data.user) {
          const prof: Profile = {
            id: data.user.id,
            user_id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Video Editor',
            email: data.user.email,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString(),
          };
          setUser(prof);
          await loadUserData(data.user.id);
          setIsLoadingAuth(false);
          addToast({
            type: 'success',
            title: 'Signed In',
            message: `Welcome back, ${prof.name}!`,
          });
        }
        return {};
      } catch (err: any) {
        setIsLoadingAuth(false);
        return { error: err.message || 'Authentication failed' };
      }
    },
    [loadUserData, addToast]
  );

  const signupWithSupabase = useCallback(
    async (email: string, pass: string, name: string): Promise<{ error?: string; message?: string }> => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          error:
            'Authentication is currently unavailable. Please check the application\'s Supabase configuration.',
        };
      }

      setIsLoadingAuth(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              name: name.trim() || email.split('@')[0],
              display_name: name.trim() || email.split('@')[0],
            },
          },
        });

        setIsLoadingAuth(false);

        if (error) {
          return { error: error.message };
        }

        if (data.user) {
          // If Supabase confirms immediately or if email confirmation is disabled
          if (data.session) {
            const prof: Profile = {
              id: data.user.id,
              user_id: data.user.id,
              name: name.trim() || data.user.email?.split('@')[0] || 'Video Editor',
              email: data.user.email,
              created_at: data.user.created_at,
              updated_at: new Date().toISOString(),
            };
            setUser(prof);
            await loadUserData(data.user.id);
            addToast({
              type: 'success',
              title: 'Account Created',
              message: `Welcome to your private contract tracker, ${prof.name}!`,
            });
            return {};
          } else {
            return {
              message:
                'Account registered! If confirmation is enabled, check your email to verify your account, or sign in.',
            };
          }
        }
        return {};
      } catch (err: any) {
        setIsLoadingAuth(false);
        return { error: err.message || 'Sign up failed' };
      }
    },
    [loadUserData, addToast]
  );

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    setVideos([]);
    setPayments([]);
    setShareLink(null);
    addToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been signed out.',
    });
  }, [addToast]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      theme,
      toggleTheme,
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingData,
      loginWithSupabase,
      signupWithSupabase,
      logout,
      contract,
      videos,
      payments,
      progress,
      milestones,
      monthlyStats,
      analytics,
      currentMonthPace,
      addVideo,
      updateVideo,
      deleteVideo,
      updatePayment,
      updateContract,
      exportDataJson,
      importDataJson,
      // Share Progress
      shareLink,
      isShareModalOpen,
      setIsShareModalOpen,
      createShareLink,
      revokeShareLink,
      regenerateShareLink,
      isExportPdfModalOpen,
      setIsExportPdfModalOpen,

      toasts,
      addToast,
      removeToast,
      isAddVideoModalOpen,
      setIsAddVideoModalOpen,
      triggerMilestoneCelebration,
    }),
    [
      activeTab,
      theme,
      toggleTheme,
      user,
      isLoadingAuth,
      isLoadingData,
      loginWithSupabase,
      signupWithSupabase,
      logout,
      contract,
      videos,
      payments,
      progress,
      milestones,
      monthlyStats,
      analytics,
      currentMonthPace,
      addVideo,
      updateVideo,
      deleteVideo,
      updatePayment,
      updateContract,
      exportDataJson,
      importDataJson,
      shareLink,
      isShareModalOpen,
      setIsShareModalOpen,
      createShareLink,
      revokeShareLink,
      regenerateShareLink,
      isExportPdfModalOpen,
      setIsExportPdfModalOpen,
      toasts,
      addToast,
      removeToast,
      isAddVideoModalOpen,
      setIsAddVideoModalOpen,
      triggerMilestoneCelebration,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

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
  SharedReportData,
} from '../types';
import {
  calculateContractProgress,
  calculateMilestones,
  calculateMonthlyStats,
  calculateAnalytics,
  calculateMonthlyPace,
  formatCurrency,
  formatSecondsDigital,
} from '../lib/calculations';
import { DEFAULT_CONTRACT, INITIAL_SAMPLE_VIDEOS, INITIAL_SAMPLE_PAYMENTS } from '../lib/sampleData';
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
  loginDemo: () => void;
  loginWithSupabase: (email: string, pass: string) => Promise<{ error?: string }>;
  signupWithSupabase: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
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
  resetToSampleData: () => void;
  clearAllVideos: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // Share Progress Feature
  shareLink: ShareLink | null;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  createShareLink: () => Promise<ShareLink>;
  revokeShareLink: () => Promise<boolean>;
  regenerateShareLink: () => Promise<ShareLink>;
  getShareReportData: (token: string) => SharedReportData | null;

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
  CONTRACT: 'vtrack_contract_v1',
  VIDEOS: 'vtrack_videos_v1',
  PAYMENTS: 'vtrack_payments_v1',
  THEME: 'vtrack_theme_v1',
  USER: 'vtrack_user_v1',
  SHARE_LINK: 'vtrack_share_link_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state (default dark)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Share Link State
  const [shareLink, setShareLink] = useState<ShareLink | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHARE_LINK);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Auth state
  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // Default logged in demo profile for immediate zero-friction access
    return {
      id: 'demo-profile-01',
      user_id: 'user-default-editor',
      name: 'Sharif Ahmed',
      email: 'editor.sharif@contract.local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Core Data state
  const [contract, setContract] = useState<Contract>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTRACT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_CONTRACT;
  });

  const [videos, setVideos] = useState<Video[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return INITIAL_SAMPLE_VIDEOS;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return INITIAL_SAMPLE_PAYMENTS;
  });

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

  // Persist data locally
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTRACT, JSON.stringify(contract));
  }, [contract]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    if (shareLink) {
      localStorage.setItem(STORAGE_KEYS.SHARE_LINK, JSON.stringify(shareLink));
    }
  }, [shareLink]);

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

  const triggerMilestoneCelebration = useCallback((title?: string) => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Supabase Auth Listeners (if configured)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          user_id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Video Editor',
          email: session.user.email,
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          user_id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Video Editor',
          email: session.user.email,
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Do not force unset if using demo local account
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Computed Values
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

  // Actions: Videos
  const addVideo = useCallback(
    async (data: Omit<Video, 'id' | 'user_id' | 'contract_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
      const prevCompletedMilestones = progress.completedMilestonesCount;
      const prevIsCompleted = progress.isContractCompleted;

      const newVideo: Video = {
        id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: user?.user_id || 'user-default-editor',
        contract_id: contract.id,
        title: data.title.trim(),
        duration_seconds: data.duration_seconds,
        completion_date: data.completion_date,
        youtube_url: data.youtube_url?.trim() || null,
        notes: data.notes?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedList = [newVideo, ...videos];
      setVideos(updatedList);

      // Evaluate new progress for milestone triggers
      const nextProgress = calculateContractProgress(updatedList, contract);

      if (!prevIsCompleted && nextProgress.isContractCompleted) {
        triggerMilestoneCelebration('Contract Completed!');
        addToast({
          type: 'success',
          title: '🎉 CONTRACT COMPLETED! ৳150,000 Earned',
          message: `Congratulations! You have completed all 540 required minutes of edited runtime!`,
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
          title: 'Video Added',
          message: `"${newVideo.title}" (${formatSecondsDigital(newVideo.duration_seconds)}) recorded successfully.`,
        });
      }

      // Try Supabase sync if online
      if (isSupabaseConfigured && supabase && user?.user_id) {
        try {
          await supabase.from('videos').insert({
            user_id: user.user_id,
            contract_id: contract.id,
            title: newVideo.title,
            duration_seconds: newVideo.duration_seconds,
            completion_date: newVideo.completion_date,
            youtube_url: newVideo.youtube_url,
            notes: newVideo.notes,
          });
        } catch (err) {
          console.warn('Supabase sync notice: saved locally.', err);
        }
      }

      return true;
    },
    [videos, contract, progress, user, addToast, triggerMilestoneCelebration]
  );

  const updateVideo = useCallback(
    async (id: string, updates: Partial<Video>): Promise<boolean> => {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                ...updates,
                updated_at: new Date().toISOString(),
              }
            : v
        )
      );

      addToast({
        type: 'info',
        title: 'Video Updated',
        message: 'Changes saved and contract progress updated.',
      });

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('videos').update(updates).eq('id', id);
        } catch (err) {
          console.warn('Supabase update notice:', err);
        }
      }

      return true;
    },
    [addToast]
  );

  const deleteVideo = useCallback(
    async (id: string): Promise<boolean> => {
      const target = videos.find((v) => v.id === id);
      setVideos((prev) => prev.filter((v) => v.id !== id));

      addToast({
        type: 'warning',
        title: 'Video Deleted',
        message: target ? `"${target.title}" was removed.` : 'Video entry removed.',
      });

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('videos').delete().eq('id', id);
        } catch (err) {
          console.warn('Supabase delete notice:', err);
        }
      }

      return true;
    },
    [videos, addToast]
  );

  // Actions: Payments
  const updatePayment = useCallback(
    async (milestoneNumber: number, data: Partial<PaymentRecord>): Promise<boolean> => {
      setPayments((prev) => {
        const existingIdx = prev.findIndex((p) => p.milestone_number === milestoneNumber);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            ...data,
            updated_at: new Date().toISOString(),
          };
          return updated;
        } else {
          const newRecord: PaymentRecord = {
            id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            user_id: user?.user_id || 'user-default-editor',
            contract_id: contract.id,
            milestone_number: milestoneNumber,
            milestone_minutes: contract.milestone_minutes,
            earned_amount: contract.milestone_payment,
            payment_status: data.payment_status || 'paid',
            payment_date: data.payment_date || new Date().toISOString().split('T')[0],
            actual_amount_received: data.actual_amount_received ?? contract.milestone_payment,
            notes: data.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [...prev, newRecord];
        }
      });

      addToast({
        type: 'success',
        title: 'Payment Status Updated',
        message: `Milestone #${milestoneNumber} marked as ${data.payment_status || 'paid'}.`,
      });

      return true;
    },
    [user, contract, addToast]
  );

  // Contract settings
  const updateContract = useCallback(
    async (updates: Partial<Contract>): Promise<boolean> => {
      setContract((prev) => ({
        ...prev,
        ...updates,
        updated_at: new Date().toISOString(),
      }));

      addToast({
        type: 'success',
        title: 'Contract Terms Updated',
        message: 'Contract values and progress recalculations saved.',
      });

      return true;
    },
    [addToast]
  );

  const resetToSampleData = useCallback(() => {
    setContract(DEFAULT_CONTRACT);
    setVideos(INITIAL_SAMPLE_VIDEOS);
    setPayments(INITIAL_SAMPLE_PAYMENTS);
    addToast({
      type: 'info',
      title: 'Sample Data Loaded',
      message: 'Restored sample video editing contract and activity history.',
    });
  }, [addToast]);

  const clearAllVideos = useCallback(() => {
    setVideos([]);
    setPayments([]);
    addToast({
      type: 'warning',
      title: 'Videos Cleared',
      message: 'All recorded videos and payment records reset to 0.',
    });
  }, [addToast]);

  const exportDataJson = useCallback(() => {
    const data = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      contract,
      videos,
      payments,
    };
    return JSON.stringify(data, null, 2);
  }, [contract, videos, payments]);

  const importDataJson = useCallback(
    (jsonStr: string): boolean => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.contract && Array.isArray(parsed.videos)) {
          setContract(parsed.contract);
          setVideos(parsed.videos);
          if (Array.isArray(parsed.payments)) {
            setPayments(parsed.payments);
          }
          addToast({
            type: 'success',
            title: 'Data Imported',
            message: `Successfully restored ${parsed.videos.length} videos.`,
          });
          return true;
        } else {
          throw new Error('Invalid schema format');
        }
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: err.message || 'Could not parse JSON backup file.',
        });
        return false;
      }
    },
    [addToast]
  );

  // Generate Cryptographically Random Share Token
  const generateSecureToken = (): string => {
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
  };

  // Share Progress Actions
  const createShareLink = useCallback(async (): Promise<ShareLink> => {
    const newLink: ShareLink = {
      id: `share-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: user?.user_id || 'user-default-editor',
      contract_id: contract.id,
      token: generateSecureToken(),
      is_active: true,
      created_at: new Date().toISOString(),
      revoked_at: null,
      last_accessed_at: null,
    };

    setShareLink(newLink);
    localStorage.setItem(STORAGE_KEYS.SHARE_LINK, JSON.stringify(newLink));

    if (isSupabaseConfigured && supabase && user?.user_id) {
      try {
        await supabase.from('share_links').insert({
          id: newLink.id,
          user_id: newLink.user_id,
          contract_id: newLink.contract_id,
          token: newLink.token,
          is_active: true,
          created_at: newLink.created_at,
        });
      } catch (err) {
        console.warn('Supabase share_links notice:', err);
      }
    }

    addToast({
      type: 'success',
      title: 'Share Link Created',
      message: 'Read-only employer progress link is active and ready to copy.',
    });

    return newLink;
  }, [user, contract, addToast]);

  const revokeShareLink = useCallback(async (): Promise<boolean> => {
    if (!shareLink) return false;

    const revoked: ShareLink = {
      ...shareLink,
      is_active: false,
      revoked_at: new Date().toISOString(),
    };

    setShareLink(revoked);
    localStorage.setItem(STORAGE_KEYS.SHARE_LINK, JSON.stringify(revoked));

    if (isSupabaseConfigured && supabase && shareLink.id) {
      try {
        await supabase.from('share_links').update({
          is_active: false,
          revoked_at: revoked.revoked_at,
        }).eq('id', shareLink.id);
      } catch (err) {
        console.warn('Supabase share_links update notice:', err);
      }
    }

    addToast({
      type: 'warning',
      title: 'Share Link Revoked',
      message: 'Previous share link is now disabled. Employer access blocked.',
    });

    return true;
  }, [shareLink, addToast]);

  const regenerateShareLink = useCallback(async (): Promise<ShareLink> => {
    if (shareLink && isSupabaseConfigured && supabase && shareLink.id) {
      try {
        await supabase.from('share_links').update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        }).eq('id', shareLink.id);
      } catch {
        // ignore
      }
    }

    const newLink: ShareLink = {
      id: `share-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: user?.user_id || 'user-default-editor',
      contract_id: contract.id,
      token: generateSecureToken(),
      is_active: true,
      created_at: new Date().toISOString(),
      revoked_at: null,
      last_accessed_at: null,
    };

    setShareLink(newLink);
    localStorage.setItem(STORAGE_KEYS.SHARE_LINK, JSON.stringify(newLink));

    if (isSupabaseConfigured && supabase && user?.user_id) {
      try {
        await supabase.from('share_links').insert({
          id: newLink.id,
          user_id: newLink.user_id,
          contract_id: newLink.contract_id,
          token: newLink.token,
          is_active: true,
          created_at: newLink.created_at,
        });
      } catch (err) {
        console.warn('Supabase share_links insert notice:', err);
      }
    }

    addToast({
      type: 'success',
      title: 'New Share Link Generated',
      message: 'Previous link invalidated. Fresh share link created.',
    });

    return newLink;
  }, [shareLink, user, contract, addToast]);

  const getShareReportData = useCallback((token: string): SharedReportData | null => {
    if (!shareLink || shareLink.token !== token || !shareLink.is_active) {
      return null;
    }

    return {
      contract,
      videos,
      payments,
      progress,
      milestones,
      monthlyStats,
      analytics,
      lastUpdated: new Date().toISOString(),
      shareLink,
    };
  }, [shareLink, contract, videos, payments, progress, milestones, monthlyStats, analytics]);

  // Auth Operations
  const loginDemo = useCallback(() => {
    setUser({
      id: 'demo-profile-01',
      user_id: 'user-default-editor',
      name: 'Sharif Ahmed',
      email: 'editor.sharif@contract.local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    addToast({
      type: 'success',
      title: 'Demo Mode Activated',
      message: 'Logged in as Editor Sharif.',
    });
  }, [addToast]);

  const loginWithSupabase = useCallback(
    async (email: string, pass: string): Promise<{ error?: string }> => {
      if (!isSupabaseConfigured || !supabase) {
        // Fallback local auth
        setUser({
          id: `usr-${Date.now()}`,
          user_id: `usr-${Date.now()}`,
          name: email.split('@')[0],
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        addToast({
          type: 'success',
          title: 'Signed In',
          message: `Welcome back, ${email.split('@')[0]}!`,
        });
        return {};
      }

      setIsLoadingAuth(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        setIsLoadingAuth(false);
        if (error) {
          return { error: error.message };
        }
        if (data.user) {
          setUser({
            id: data.user.id,
            user_id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Video Editor',
            email: data.user.email,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString(),
          });
          addToast({
            type: 'success',
            title: 'Authenticated with Supabase',
            message: `Welcome back, ${data.user.email}!`,
          });
        }
        return {};
      } catch (err: any) {
        setIsLoadingAuth(false);
        return { error: err.message || 'Authentication failed' };
      }
    },
    [addToast]
  );

  const signupWithSupabase = useCallback(
    async (email: string, pass: string, name: string): Promise<{ error?: string }> => {
      if (!isSupabaseConfigured || !supabase) {
        setUser({
          id: `usr-${Date.now()}`,
          user_id: `usr-${Date.now()}`,
          name: name || email.split('@')[0],
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        addToast({
          type: 'success',
          title: 'Account Created',
          message: `Welcome to your private contract tracker, ${name}!`,
        });
        return {};
      }

      setIsLoadingAuth(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { name },
          },
        });
        setIsLoadingAuth(false);
        if (error) {
          return { error: error.message };
        }
        if (data.user) {
          setUser({
            id: data.user.id,
            user_id: data.user.id,
            name: name || data.user.email?.split('@')[0] || 'Video Editor',
            email: data.user.email,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString(),
          });
          addToast({
            type: 'success',
            title: 'Account Created',
            message: 'Your Supabase account has been created.',
          });
        }
        return {};
      } catch (err: any) {
        setIsLoadingAuth(false);
        return { error: err.message || 'Sign up failed' };
      }
    },
    [addToast]
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
      loginDemo,
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
      resetToSampleData,
      clearAllVideos,
      exportDataJson,
      importDataJson,
      // Share Progress
      shareLink,
      isShareModalOpen,
      setIsShareModalOpen,
      createShareLink,
      revokeShareLink,
      regenerateShareLink,
      getShareReportData,

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
      loginDemo,
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
      resetToSampleData,
      clearAllVideos,
      exportDataJson,
      importDataJson,
      shareLink,
      isShareModalOpen,
      setIsShareModalOpen,
      createShareLink,
      revokeShareLink,
      regenerateShareLink,
      getShareReportData,
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

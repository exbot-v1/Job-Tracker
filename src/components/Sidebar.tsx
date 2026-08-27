import React from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  LayoutDashboard,
  Film,
  Trophy,
  Banknote,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  LogOut,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatMinutesDisplay } from '../lib/calculations';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    user,
    logout,
    contract,
    videos,
    progress,
    setIsAddVideoModalOpen,
  } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'videos', label: 'Videos', icon: Film, badge: videos.length },
    { id: 'milestones', label: 'Milestones', icon: Trophy, badge: `${progress.completedMilestonesCount}/6` },
    { id: 'payments', label: 'Payments', icon: Banknote, badge: formatCurrency(progress.earnedAmount) },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden lg:flex flex-col w-72 bg-[#13161C] border-r border-[#262B35] text-[#94A3B8] select-none z-30 shrink-0 h-screen sticky top-0"
    >
      {/* App Header / Brand */}
      <div className="p-5 border-b border-[#262B35] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-[#E2E8F0] text-sm tracking-tight flex items-center gap-1.5">
              <span>Contract Tracker</span>
            </h1>
            <p className="text-xs text-[#94A3B8] font-medium">Freelance Video Editor</p>
          </div>
        </div>

        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C212C] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#94A3B8]" />}
        </button>
      </div>

      {/* Contract Snapshot Pill */}
      <div className="px-4 pt-4 pb-2">
        <div className="p-3 rounded-xl bg-[#181C24] border border-[#262B35]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#94A3B8] font-medium truncate max-w-[130px]">{contract.name}</span>
            {progress.isContractCompleted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <Clock className="w-3 h-3" /> Active
              </span>
            )}
          </div>

          {/* Quick mini progress bar */}
          <div className="w-full bg-[#262B36] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress.isContractCompleted ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
              style={{ width: `${progress.contractProgressPercentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#94A3B8] mt-2">
            <span>{formatMinutesDisplay(progress.totalCompletedMinutes)} / {contract.total_required_minutes}m</span>
            <span className="font-semibold text-[#E2E8F0]">{progress.contractProgressPercentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 py-2">
        <button
          id="sidebar-add-video-btn"
          onClick={() => setIsAddVideoModalOpen(true)}
          className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wide shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Completed Video</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav id="sidebar-nav" className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-[#1C212C] text-emerald-400 font-semibold shadow-sm border border-[#2B3240]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#181C24]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-[#181C24] text-[#94A3B8] group-hover:text-[#E2E8F0]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-[#262B35] bg-[#0F1115]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#181C24] border border-[#262B35] flex items-center justify-center font-bold text-xs text-emerald-400">
              {user?.name?.slice(0, 2).toUpperCase() || 'VE'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#E2E8F0] truncate">{user?.name || 'Private Dashboard'}</p>
              <p className="text-[10px] text-[#64748B] truncate">{user?.email || 'Authenticated Owner'}</p>
            </div>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={logout}
            aria-label="Logout"
            className="p-1.5 text-[#94A3B8] hover:text-rose-400 hover:bg-[#181C24] rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

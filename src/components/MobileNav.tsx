import React from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  LayoutDashboard,
  Film,
  Trophy,
  Banknote,
  Globe,
  Settings,
  Plus,
  Moon,
  Sun,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    setIsAddVideoModalOpen,
  } = useApp();

  const tabs: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'videos', label: 'Videos', icon: Film },
    { id: 'milestones', label: 'Milestones', icon: Trophy },
    { id: 'payments', label: 'Payments', icon: Banknote },
    { id: 'public-view', label: 'Public', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header
        id="mobile-top-header"
        className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#13161C] border-b border-[#262B35] sticky top-0 z-40"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-[#E2E8F0] text-xs">Video Contract Tracker</h1>
            <p className="text-[10px] text-[#94A3B8]">Personal Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="mobile-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] bg-[#181C24]"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            id="mobile-header-add-btn"
            onClick={() => setIsAddVideoModalOpen(true)}
            className="py-1.5 px-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Video</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#13161C]/95 backdrop-blur-lg border-t border-[#262B35] flex items-center justify-around py-2 px-1 pb-safe"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium min-w-[50px] ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-400 stroke-[2.5]' : 'text-[#64748B]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { ToastContainer } from './components/ToastContainer';
import { AddVideoModal } from './components/AddVideoModal';
import { ShareProgressModal } from './components/ShareProgressModal';
import { DashboardView } from './views/DashboardView';
import { VideosView } from './views/VideosView';
import { MilestonesView } from './views/MilestonesView';
import { PaymentsView } from './views/PaymentsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { SharedProgressView } from './views/SharedProgressView';

function getShareTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check pathname: /progress/:token
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const progressIdx = pathParts.indexOf('progress');
  if (progressIdx !== -1 && pathParts[progressIdx + 1]) {
    return pathParts[progressIdx + 1];
  }

  // 2. Check query params: ?share=:token
  const params = new URLSearchParams(window.location.search);
  const shareParam = params.get('share');
  if (shareParam) return shareParam;

  // 3. Check hash: #/progress/:token
  if (window.location.hash.startsWith('#/progress/')) {
    const hashPart = window.location.hash.replace('#/progress/', '').split('?')[0];
    if (hashPart) return hashPart;
  }

  return null;
}

const MainLayout: React.FC = () => {
  const { isAuthenticated, activeTab } = useApp();

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] flex flex-col lg:flex-row antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Nav Top & Bottom */}
      <MobileNav />

      {/* Main Content Area */}
      <main
        id="main-content-scroll"
        className="flex-1 min-w-0 px-4 sm:px-8 py-6 lg:py-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12"
      >
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'videos' && <VideosView />}
        {activeTab === 'milestones' && <MilestonesView />}
        {activeTab === 'payments' && <PaymentsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Add Video Modal */}
      <AddVideoModal />

      {/* Global Share Progress Modal */}
      <ShareProgressModal />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  const [shareToken, setShareToken] = useState<string | null>(() => getShareTokenFromUrl());

  useEffect(() => {
    const handleUrlChange = () => {
      setShareToken(getShareTokenFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  return (
    <AppProvider>
      {shareToken ? (
        <SharedProgressView token={shareToken} />
      ) : (
        <MainLayout />
      )}
    </AppProvider>
  );
}

export default App;

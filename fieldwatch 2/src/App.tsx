import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { FarmerHome } from './components/FarmerHome';
import { FarmerView } from './components/FarmerView';
import { AgriBroChat } from './components/AgriBroChat';
import { FarmerReportsList } from './components/FarmerReportsList';
import { OutbreakAlertsView } from './components/OutbreakAlertsView';
import { AdminPortal } from './components/AdminPortal';
import { AuthGate } from './components/AuthGate';
import { FloatingAgriBroSign } from './components/FloatingAgriBroSign';
import {
  DiseaseReport,
  OutboxEntry,
  ReportStatus,
  SupportedLanguage,
  User,
} from './types';
import {
  INITIAL_DISEASES,
  INITIAL_REPORTS,
  INITIAL_SYMPTOMS,
} from './data/seedData';
import { OutbreakDetector } from './utils/outbreakDetector';
import { Shield } from 'lucide-react';

export default function App() {
  // Navigation views: 'home' | 'report' | 'chat' | 'my-reports' | 'alerts' | 'admin'
  const [currentView, setCurrentView] = useState<
    'home' | 'report' | 'chat' | 'my-reports' | 'alerts' | 'admin'
  >('home');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  // Which sign-in screen is showing for a visitor ('null' = the landing page)
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | null>(null);

  // Network and Language state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');

  // Surveillance data state
  const [reports, setReports] = useState<DiseaseReport[]>(INITIAL_REPORTS);
  const [outbox, setOutbox] = useState<OutboxEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Epidemiological outbreak detector
  const detector = useMemo(() => new OutbreakDetector(), []);
  const outbreaks = useMemo(() => detector.detectOutbreaks(reports), [detector, reports]);

  // Restore session from localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('fieldwatch_token');
    if (!savedToken) {
      setAuthChecked(true);
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Session invalid');
      })
      .then((data) => {
        setUser(data.user);
        setAuthToken(savedToken);
      })
      .catch(() => {
        localStorage.removeItem('fieldwatch_token');
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleAuthSuccess = (authenticatedUser: User, token: string) => {
    setUser(authenticatedUser);
    setAuthToken(token);
    setAuthScreen(null);
    localStorage.setItem('fieldwatch_token', token);

    // If logged in as admin, transition smoothly to admin dashboard
    if (authenticatedUser.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('home');
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        // ignore error
      }
    }
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('fieldwatch_token');
    setCurrentView('home');
  };

  // Handle report submission from farmer
  const handleFarmerSubmitReport = (
    reportData: Omit<DiseaseReport, 'id' | 'timestampMillis' | 'status'>
  ) => {
    const newReport: DiseaseReport = {
      ...reportData,
      id: `REP-${Date.now().toString().slice(-6)}`,
      timestampMillis: Date.now(),
      status: 'SUSPECT',
      farmerName: user?.name || reportData.farmerName || 'Registered Farmer',
      farmContact: user?.phone || reportData.farmContact || '+254 700 000 000',
    };

    if (isOnline) {
      setReports((prev) => [newReport, ...prev]);
    } else {
      const entry: OutboxEntry = {
        id: `OUTBOX-${newReport.id}`,
        report: newReport,
        createdAtMillis: Date.now(),
        retryCount: 0,
      };
      setOutbox((prev) => [...prev, entry]);
    }
  };

  // Sync Outbox to Central Surveillance
  const handleSyncOutbox = () => {
    if (outbox.length === 0 || !isOnline) return;

    setIsSyncing(true);
    setTimeout(() => {
      const syncedReports = outbox.map((entry) => entry.report);
      setReports((prev) => [...syncedReports, ...prev]);
      setOutbox([]);
      setIsSyncing(false);
    }, 600);
  };

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (nextState && outbox.length > 0) {
      handleSyncOutbox();
    }
  };

  // Status updates from Officer Triage
  const handleUpdateReportStatus = (
    reportId: string,
    newStatus: ReportStatus,
    officerNotes?: string
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: newStatus,
            officerNotes: officerNotes || r.officerNotes,
          };
        }
        return r;
      })
    );
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-[#fbfbfb]" />;
  }

  if (!user && authScreen) {
    return (
      <AuthGate
        key={authScreen}
        initialMode={authScreen}
        onBack={() => setAuthScreen(null)}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-stone-900 flex flex-col font-sans antialiased selection:bg-stone-200">
      {/* Global Modern Header styled after reference design */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenAuth={(mode) => setAuthScreen(mode ?? 'login')}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        pendingOutboxCount={outbox.length}
        onSyncOutbox={handleSyncOutbox}
        isSyncing={isSyncing}
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        activeOutbreakCount={outbreaks.length}
        onNavigateHome={() => setCurrentView('home')}
        currentView={currentView}
        onNavigateView={(view) => setCurrentView(view)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1">
        {currentView === 'home' && (
          <FarmerHome
            user={user}
            onOpenAuth={(mode) => setAuthScreen(mode ?? 'login')}
            onNavigate={(view) => {
              if (view === 'report') setCurrentView('report');
              if (view === 'chat') setCurrentView('chat');
              if (view === 'my-reports') setCurrentView('my-reports');
              if (view === 'alerts') setCurrentView('alerts');
            }}
                activeOutbreaks={outbreaks}
            myReports={reports}
            pendingOutboxCount={outbox.length}
            currentLang={currentLang}
          />
        )}

        {currentView === 'report' && (
          <FarmerView
            symptoms={INITIAL_SYMPTOMS}
            diseases={INITIAL_DISEASES}
            onSubmitReport={handleFarmerSubmitReport}
            outbox={outbox}
            onSyncOutbox={handleSyncOutbox}
            isOnline={isOnline}
            submittedReports={reports}
            currentLang={currentLang}
            onBack={() => setCurrentView('home')}
            user={user}
            authToken={authToken}
          />
        )}

        {currentView === 'chat' && (
          <AgriBroChat
            user={user}
            onBack={() => {
              setChatInitialPrompt(undefined);
              setCurrentView('home');
            }}
            currentLang={currentLang}
            initialPrompt={chatInitialPrompt}
          />
        )}

        {currentView === 'my-reports' && (
          <FarmerReportsList
            reports={reports}
            outbox={outbox}
            user={user}
            onBack={() => setCurrentView('home')}
            onNewReport={() => setCurrentView('report')}
            currentLang={currentLang}
          />
        )}

        {currentView === 'alerts' && (
          <OutbreakAlertsView
            outbreaks={outbreaks}
            reports={reports}
            onBack={() => setCurrentView('home')}
            currentLang={currentLang}
          />
        )}

        {currentView === 'admin' && user?.role === 'admin' && authToken && (
          <AdminPortal
            user={user}
            authToken={authToken}
            onExit={() => setCurrentView('home')}
            reports={reports}
            onUpdateReportStatus={handleUpdateReportStatus}
            currentLang={currentLang}
          />
        )}
      </main>

      {/* Floating AgriBro AI Chatbot Sign on the Front Page */}
      {user && currentView !== 'chat' && currentView !== 'admin' && (
        <FloatingAgriBroSign
          onOpenFullChat={(prompt) => {
            if (prompt) setChatInitialPrompt(prompt);
            setCurrentView('chat');
          }}
          user={user}
          currentLang={currentLang}
        />
      )}

      {/* Global Clean Light Footer with Discreet Admin Entry Point */}
      <footer className="bg-[#fcfcfc] text-stone-400 text-xs py-6 border-t border-stone-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] uppercase tracking-wider font-semibold">
          <div className="flex items-center gap-2 text-stone-500">
            <span className="font-extrabold text-stone-900">FieldWatch</span>
            <span>• Agricultural Biosecurity</span>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin')}
              className="text-stone-400 hover:text-stone-700 text-[11px] flex items-center gap-1.5 transition cursor-pointer p-1 rounded-md hover:bg-stone-100"
              title="District officer dashboard"
            >
              <Shield className="w-3.5 h-3.5 text-stone-400" />
              <span>Officer Portal</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

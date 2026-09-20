import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
  LogOut,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { SupportedLanguage, User } from '../types';
import { RippleButton } from './RippleButton';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingOutboxCount: number;
  onSyncOutbox: () => void;
  isSyncing: boolean;
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
  activeOutbreakCount: number;
  onNavigateHome: () => void;
  currentView?: 'home' | 'report' | 'chat' | 'my-reports' | 'alerts' | 'admin';
  onNavigateView?: (view: 'home' | 'report' | 'chat' | 'my-reports' | 'alerts') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenAuth,
  isOnline,
  onToggleOnline,
  pendingOutboxCount,
  onSyncOutbox,
  isSyncing,
  currentLang,
  onSelectLang,
  activeOutbreakCount,
  onNavigateHome,
  currentView = 'home',
  onNavigateView,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState<boolean>(false);

  const languages: { code: SupportedLanguage; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const currentLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  const handleNav = (view: 'home' | 'report' | 'chat' | 'my-reports' | 'alerts') => {
    if (onNavigateView) {
      onNavigateView(view);
    } else if (view === 'home') {
      onNavigateHome();
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md text-stone-900 sticky top-0 z-40 border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - Styled with 3 staggered vertical bars like the reference image */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-end gap-0.75 h-5 select-none" aria-hidden="true">
            <div className="w-1.5 h-3 bg-stone-950 rounded-xs group-hover:bg-emerald-700 transition" />
            <div className="w-1.5 h-5 bg-stone-950 rounded-xs group-hover:bg-emerald-600 transition" />
            <div className="w-1.5 h-3.5 bg-stone-950 rounded-xs group-hover:bg-emerald-700 transition" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-stone-950">
              FieldWatch
            </span>
            {user && activeOutbreakCount > 0 && (
              <span className="hidden lg:inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700 rounded-md border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {activeOutbreakCount} Active
              </span>
            )}
          </div>
        </button>

        {/* Right Section: language, network status, account actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 text-xs whitespace-nowrap">
          {/* Navigation tabs (signed-in users) */}
          {user && (
          <nav className="hidden md:flex flex-nowrap items-center gap-5 lg:gap-7 mr-2 lg:mr-4 text-[13px] font-medium tracking-normal text-stone-500 whitespace-nowrap">
            <button
              onClick={() => handleNav('home')}
              className={`relative py-1 whitespace-nowrap transition cursor-pointer ${
                currentView === 'home'
                  ? 'text-stone-950 font-semibold'
                  : 'hover:text-stone-900'
              }`}
            >
              Home
              {currentView === 'home' && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-stone-950 rounded-full" />
              )}
            </button>
            <button
              onClick={() => handleNav('alerts')}
              className={`relative py-1 whitespace-nowrap transition cursor-pointer ${
                currentView === 'alerts'
                  ? 'text-stone-950 font-semibold'
                  : 'hover:text-stone-900'
              }`}
            >
              Surveillance Map
              {currentView === 'alerts' && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-stone-950 rounded-full" />
              )}
            </button>
            <button
              onClick={() => handleNav('report')}
              className={`relative py-1 whitespace-nowrap transition cursor-pointer ${
                currentView === 'report'
                  ? 'text-stone-950 font-semibold'
                  : 'hover:text-stone-900'
              }`}
            >
              Report Case
              {currentView === 'report' && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-stone-950 rounded-full" />
              )}
            </button>
            <button
              onClick={() => handleNav('my-reports')}
              className={`relative py-1 whitespace-nowrap transition cursor-pointer ${
                currentView === 'my-reports'
                  ? 'text-stone-950 font-semibold'
                  : 'hover:text-stone-900'
              }`}
            >
              Submissions
              {currentView === 'my-reports' && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-stone-950 rounded-full" />
              )}
            </button>
          </nav>
          )}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">{currentLangObj.code.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 text-stone-800">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLang(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs hover:bg-stone-50 transition cursor-pointer ${
                        currentLang === lang.code
                          ? 'font-bold text-stone-900 bg-stone-100/60'
                          : 'text-stone-600'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {user && (
            <>
          {/* Offline/Online Network Indicator */}
          <button
            onClick={onToggleOnline}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition cursor-pointer border ${
              isOnline
                ? 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse font-bold'
            }`}
            title="Toggle simulated offline mode"
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-700" />
                <span>Offline</span>
              </>
            )}
          </button>

          {/* Sync button for pending outbox */}
          {pendingOutboxCount > 0 && (
            <button
              onClick={onSyncOutbox}
              disabled={!isOnline || isSyncing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-xs cursor-pointer"
              title="Sync offline records"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync ({pendingOutboxCount})</span>
            </button>
          )}

            </>
          )}

          {user ? (
            <>
              <div className="flex items-center gap-2 pl-1">
                <div className="hidden lg:flex flex-col text-right leading-tight">
                  <span className="font-semibold text-stone-900 text-xs max-w-[11rem] truncate">{user.name}</span>
                  <span className="text-[10px] text-stone-500 capitalize">{user.district}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-md hover:bg-red-50 text-stone-500 hover:text-red-700 transition cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <RippleButton
                rippleColor="dark"
                onClick={() => onOpenAuth?.('login')}
                className="text-xs font-semibold text-stone-800 hover:bg-stone-100 px-3.5 py-2"
              >
                Log in
              </RippleButton>
              <RippleButton
                onClick={() => onOpenAuth?.('signup')}
                className="bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 shadow-xs"
              >
                Sign up
              </RippleButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

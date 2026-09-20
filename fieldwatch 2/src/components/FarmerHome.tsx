import React, { useState } from 'react';
import {
  TEModal,
  TEModalDialog,
  TEModalContent,
  TEModalHeader,
  TEModalBody,
  TEModalFooter,
} from 'tw-elements-react';
import {
  ChevronRight,
  Inbox,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  BellRing,
  Info,
  X,
  WifiOff,
  Languages,
} from 'lucide-react';
import { DiseaseReport, OutbreakCluster, SupportedLanguage, User } from '../types';
import { RippleButton } from './RippleButton';

interface FarmerHomeProps {
  user: User | null;
  onNavigate: (view: 'report' | 'chat' | 'my-reports' | 'alerts') => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  activeOutbreaks: OutbreakCluster[];
  myReports: DiseaseReport[];
  pendingOutboxCount: number;
  currentLang: SupportedLanguage;
}

const LEARN_MORE_ITEMS = [
  {
    icon: ClipboardList,
    title: 'Report what you see',
    text: 'Log sick or dead livestock and crops in a few taps, with symptoms and your location.',
  },
  {
    icon: Sparkles,
    title: 'Get instant guidance',
    text: 'A symptom checker suggests likely diseases, and AgriBro answers your questions in plain language.',
  },
  {
    icon: BellRing,
    title: 'Stay ahead of outbreaks',
    text: 'District veterinary officers verify reports and alert nearby farms before a disease spreads.',
  },
  {
    icon: WifiOff,
    title: 'Works offline',
    text: 'No signal in the field? Reports are saved on your device and sent when you reconnect.',
  },
  {
    icon: Languages,
    title: 'Your language',
    text: 'Available in English, Kiswahili, Hindi and Spanish.',
  },
];

export const FarmerHome: React.FC<FarmerHomeProps> = ({
  user,
  onNavigate,
  onOpenAuth,
  activeOutbreaks,
  pendingOutboxCount,
}) => {
  const [showLearnMore, setShowLearnMore] = useState<boolean>(false);

  return (
    <div className="min-h-[70vh] bg-[#fcfcfc] text-stone-900 selection:bg-stone-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-20 space-y-8">
        {/* Offline Outbox Notice if any offline submissions */}
        {user && pendingOutboxCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{pendingOutboxCount} offline report(s)</strong> stored locally. They will
                sync automatically when network returns.
              </span>
            </div>
            <button
              onClick={() => onNavigate('my-reports')}
              className="text-xs font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
            >
              View Outbox
            </button>
          </div>
        )}

        <section className="text-center space-y-6 fw-fade-up">
          {user && activeOutbreaks.length > 0 && (
            <button
              onClick={() => onNavigate('alerts')}
              className="group w-full max-w-md mx-auto flex items-center gap-3 text-left bg-white border border-stone-200 border-l-4 border-l-red-600 rounded-md px-4 py-3 shadow-xs hover:shadow-md transition cursor-pointer"
            >
              <span className="w-9 h-9 rounded-md bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-stone-950">
                  {activeOutbreaks.length} active outbreak{activeOutbreaks.length > 1 ? 's' : ''} near you
                </span>
                <span className="block text-xs text-stone-500 truncate">
                  {activeOutbreaks[0].diseaseName} · {activeOutbreaks[0].center.district}
                </span>
              </span>
              <span className="text-xs font-semibold text-red-700 flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                View map <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          )}

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-950 leading-[1.12]">
            Detect farm outbreaks early and protect your harvest
          </h1>

          <p className="text-stone-500 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Report sick animals or crops, get quick guidance, and stay informed about disease in
            your area.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <RippleButton
              onClick={() => (user ? onNavigate('report') : onOpenAuth?.('signup'))}
              className="bg-stone-950 hover:bg-stone-800 text-white text-sm font-bold px-6 py-3 inline-flex items-center gap-2 shadow-sm"
            >
              <span>{user ? 'Report a case' : 'Get started'}</span>
              <ChevronRight className="w-4 h-4" />
            </RippleButton>

            <RippleButton
              rippleColor="dark"
              onClick={() => setShowLearnMore(true)}
              className="bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 text-sm font-bold px-6 py-3 inline-flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              <span>Learn more</span>
            </RippleButton>
          </div>

          {!user && (
            <p className="text-xs text-stone-500">
              Already have an account?{' '}
              <button
                onClick={() => onOpenAuth?.('login')}
                className="font-semibold text-stone-900 underline underline-offset-2 hover:text-stone-600 cursor-pointer"
              >
                Log in
              </button>
            </p>
          )}
        </section>
      </div>

      {/* Learn more dialog (Tailwind Elements modal) */}
      <TEModal show={showLearnMore} setShow={setShowLearnMore} scrollable>
        <TEModalDialog centered size="lg">
          <TEModalContent className="rounded-lg">
            <TEModalHeader className="!border-stone-200">
              <h5 className="text-lg font-extrabold text-stone-950">About FieldWatch</h5>
              <button
                type="button"
                onClick={() => setShowLearnMore(false)}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </TEModalHeader>

            <TEModalBody>
              <p className="text-sm text-stone-600 leading-relaxed mb-5">
                FieldWatch connects farmers in the field with district veterinary and agricultural
                officers, so disease is spotted and contained early.
              </p>
              <ul className="space-y-4">
                {LEARN_MORE_ITEMS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-md bg-stone-950 text-white flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <h6 className="text-sm font-bold text-stone-950">{title}</h6>
                      <p className="text-xs text-stone-500 leading-relaxed mt-0.5">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </TEModalBody>

            <TEModalFooter className="!border-stone-200">
              <RippleButton
                rippleColor="dark"
                onClick={() => setShowLearnMore(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-5 py-2.5"
              >
                Close
              </RippleButton>
              <RippleButton
                onClick={() => {
                  setShowLearnMore(false);
                  if (user) onNavigate('report');
                  else onOpenAuth?.('signup');
                }}
                className="bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5"
              >
                {user ? 'Report a case' : 'Sign up'}
              </RippleButton>
            </TEModalFooter>
          </TEModalContent>
        </TEModalDialog>
      </TEModal>
    </div>
  );
};

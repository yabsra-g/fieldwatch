import React, { useState } from 'react';
import {
  MessageSquareText,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Send,
  Wheat,
  Maximize2,
} from 'lucide-react';
import { SupportedLanguage, User } from '../types';

interface FloatingAgriBroSignProps {
  onOpenFullChat: (initialPrompt?: string) => void;
  user: User | null;
  currentLang: SupportedLanguage;
}

const QUICK_SIGN_QUESTIONS = [
  'Mouth blisters & drooling in cattle?',
  'Sudden chicken deaths in flock?',
  'Maize leaves showing armyworm damage?',
  'Safe disinfectant for goat shed?',
];

export const FloatingAgriBroSign: React.FC<FloatingAgriBroSignProps> = ({
  onOpenFullChat,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [quickInput, setQuickInput] = useState<string>('');
  const [isSignVisible, setIsSignVisible] = useState<boolean>(true);

  if (!isSignVisible) {
    return (
      <button
        onClick={() => setIsSignVisible(true)}
        className="fixed bottom-5 right-5 z-40 bg-stone-950 hover:bg-stone-800 text-white p-3.5 rounded-md shadow-xl border border-stone-800 cursor-pointer flex items-center justify-center transition-transform hover:scale-105"
        title="Open AgriBro AI Farm Advisor"
      >
        <span className="relative">
          <MessageSquareText className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-stone-950 animate-pulse" />
        </span>
      </button>
    );
  }

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onOpenFullChat(quickInput.trim());
      setQuickInput('');
    }
  };

  return (
    <aside
      aria-label="AgriBro AI Assistant"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] transition-all duration-300 ease-in-out select-none"
    >
      {/* Floating Sign Container */}
      <div className="bg-stone-950/95 backdrop-blur-md text-white border border-stone-800 rounded-lg shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Top Header Sign Board */}
        <div className="p-3.5 sm:p-4 bg-stone-900/90 flex items-center justify-between border-b border-stone-800">
          <button
            onClick={() => onOpenFullChat()}
            className="flex items-center gap-3 text-left group cursor-pointer flex-1"
          >
            {/* Minimalist Avatar Icon */}
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 text-white flex items-center justify-center shadow-md group-hover:bg-stone-700 transition">
                <Wheat className="w-5 h-5 text-stone-200" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-stone-950 rounded-full animate-ping" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-stone-950 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-stone-300 transition">
                  AgriBro AI
                </span>
                <span className="px-2 py-0.2 bg-stone-800 text-stone-300 border border-stone-700 rounded-md text-[10px] font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>Advisor</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-400 line-clamp-1">
                Ask about sick animals, dosage & pest triage
              </p>
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenFullChat()}
              className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white rounded-md transition cursor-pointer"
              title="Expand to Full Chat Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white rounded-md transition cursor-pointer"
              title={isExpanded ? 'Collapse Sign' : 'Expand Quick Answers'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsSignVisible(false)}
              className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white rounded-md transition cursor-pointer"
              title="Minimize Sign"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Quick Questions & Input Drawer */}
        {isExpanded && (
          <div className="p-3.5 sm:p-4 bg-stone-950 space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                Common farm triage inquiries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SIGN_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onOpenFullChat(q)}
                    className="text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 px-2.5 py-1 rounded-md text-left transition cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Question Input Field */}
            <form onSubmit={handleQuickSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Ask about symptoms or treatments..."
                className="flex-1 bg-stone-900 border border-stone-800 text-white rounded-md px-3 py-2 text-xs focus:outline-hidden focus:border-stone-600 placeholder:text-stone-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-white text-stone-950 hover:bg-stone-200 font-bold rounded-md text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        )}

        {/* Bottom Persistent Action Bar */}
        {!isExpanded && (
          <div className="px-4 py-2.5 bg-stone-900/60 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">Instant differential triage</span>
            <button
              onClick={() => onOpenFullChat()}
              className="text-white font-bold hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <span>Open Advisor</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

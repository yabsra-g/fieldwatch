import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage, SupportedLanguage, User } from '../types';

interface AgriBroChatProps {
  user: User | null;
  onBack: () => void;
  currentLang: SupportedLanguage;
  initialPrompt?: string;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting_01',
  role: 'assistant',
  content: `Hello farmer! 🌾 I am **AgriBro**, your digital agricultural and veterinary assistant.

Ask me any question regarding:
- 🐄 **Sick Cattle, Sheep or Goats** (mouth blisters, lameness, bloat, high fever)
- 🐖 **Pig Health** (fever, red spots, African Swine Fever precautions)
- 🐔 **Poultry Care** (Newcastle, respiratory rattles, egg drop)
- 🌽 **Crops & Pests** (Fall armyworms, maize streak, cassava mosaic)
- 🧼 **Farm Biosecurity & Disinfection**

What are you observing on your farm today?`,
  timestamp: Date.now(),
};

const SUGGESTED_QUESTIONS = [
  '🐮 My cow has blisters on mouth & excessive drooling',
  '🌽 Green caterpillars eating my young maize funnels',
  '🐖 Pigs have sudden high fever and red spots on ears',
  '🐔 Chickens sneezing with twisted neck & drop in eggs',
  '🧼 How do I disinfect boots and farm gates?',
];

export const AgriBroChat: React.FC<AgriBroChatProps> = ({
  user,
  onBack,
  currentLang,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const initialSentRef = useRef<boolean>(false);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && !initialSentRef.current) {
      initialSentRef.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Route through backend proxy so OpenAI API key is never exposed to browser
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Server error communicating with AgriBro');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'AgriBro could not process this question.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'Failed to connect to AgriBro assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_GREETING]);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-140px)] min-h-[520px]">
      {/* Top Header with Back Navigation */}
      <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-xs mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 hover:bg-stone-100 rounded-md text-stone-700 transition cursor-pointer"
            title="Return to Farmer Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-900 text-sm">AgriBro AI Advisor</span>
                <span className="px-2 py-0.2 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-md">
                  OpenAI
                </span>
              </div>
              <p className="text-[11px] text-stone-500">Livestock, Crops & Biosecurity Advice</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-2 hover:bg-stone-100 rounded-md text-stone-500 hover:text-stone-800 transition cursor-pointer text-xs flex items-center gap-1"
          title="Clear Conversation"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 bg-white border border-stone-200 rounded-lg p-4 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-800 text-white rounded-tr-none'
                  : 'bg-stone-50 text-stone-900 border border-stone-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line break-words space-y-1">
                {msg.content}
              </div>
              <div
                className={`text-[10px] mt-1.5 font-mono ${
                  msg.role === 'user' ? 'text-emerald-200 text-right' : 'text-stone-400'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-1">
                <UserIcon className="w-4 h-4 text-emerald-100" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-lg rounded-tl-none p-3.5 text-xs text-stone-600 flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-stone-500 font-medium ml-1">AgriBro is analyzing farm conditions...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-md text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      {messages.length <= 2 && (
        <div className="py-2 overflow-x-auto flex gap-2 no-scrollbar">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="shrink-0 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-md text-xs font-medium transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="mt-2 bg-white border border-stone-200 rounded-lg p-2 shadow-xs flex items-center gap-2">
        <textarea
          rows={1}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask AgriBro about sick animals, dosage, pests, or isolation..."
          className="flex-1 resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          disabled={isLoading}
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputPrompt.trim() || isLoading}
          className={`p-2.5 rounded-md font-bold text-white transition flex items-center justify-center shrink-0 ${
            inputPrompt.trim() && !isLoading
              ? 'bg-sky-600 hover:bg-sky-500 cursor-pointer shadow-sm'
              : 'bg-stone-300 text-stone-500 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-stone-400 text-center mt-1">
        AgriBro provides agricultural recommendations. Consult your licensed district veterinarian for official prescriptions.
      </p>
    </div>
  );
};

import React from 'react';
import { BackendConnectionStatus, LanguageOption } from '../types/smartGlove';
import { ConnectionStatus } from './ConnectionStatus';
import { LanguageSelector } from './LanguageSelector';
import { Hand, SlidersHorizontal, Sparkles } from 'lucide-react';

interface NavbarProps {
  connectionStatus: BackendConnectionStatus;
  selectedLanguage: LanguageOption;
  onSelectLanguage: (lang: LanguageOption) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  connectionStatus,
  selectedLanguage,
  onSelectLanguage,
  isDemoMode,
  onToggleDemoMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-950 text-white">
              <Hand className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">
                  SMARTGLOVE<span className="text-cyan-400"> AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                  <Sparkles className="w-2.5 h-2.5" />
                  ASSISTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AI-Powered Assistive Communication Dashboard
              </p>
            </div>
          </div>

          {/* Mobile status indicator */}
          <div className="sm:hidden">
            <ConnectionStatus status={connectionStatus} compact />
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Desktop status */}
          <div className="hidden sm:block">
            <ConnectionStatus status={connectionStatus} compact />
          </div>

          {/* Quick Language Dropdown */}
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={onSelectLanguage}
            compact
          />

          {/* Demo Mode Switch */}
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isDemoMode
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-950'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Toggle Developer Demo Simulator"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Demo ON' : 'Demo Mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

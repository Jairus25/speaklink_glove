import React from 'react';
import { SmartGloveData, LanguageOption } from '../types/smartGlove';
import { Volume2, Sparkles, User, Radio, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LiveMessageCardProps {
  data: SmartGloveData | null;
  selectedLanguage: LanguageOption;
  onTranslateAndSpeak: () => void;
  isLoading: boolean;
  isSpeaking: boolean;
}

export const LiveMessageCard: React.FC<LiveMessageCardProps> = ({
  data,
  selectedLanguage,
  onTranslateAndSpeak,
  isLoading,
  isSpeaking,
}) => {
  const isSos = data?.mode?.toUpperCase() === 'SOS' || data?.is_sos === true;
  const message = data?.input || 'System standing by for Smart Glove input...';

  const formatTime = (ts?: string) => {
    if (!ts) return 'Just now';
    try {
      const date = new Date(ts);
      return isNaN(date.getTime()) ? ts : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <section
      aria-labelledby="live-message-heading"
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 border ${
        isSos
          ? 'bg-gradient-to-b from-rose-950/40 via-slate-900/90 to-slate-900/90 border-rose-500/50 shadow-2xl shadow-rose-950/50'
          : 'bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 border-slate-700/60 shadow-2xl shadow-cyan-950/20'
      }`}
    >
      {/* Glow background accent */}
      <div
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isSos ? 'bg-rose-500/15' : 'bg-cyan-500/10'
        }`}
        aria-hidden="true"
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              isSos ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 shadow-[0_0_10px_#06b6d4]'
            }`}
          />
          <h2 id="live-message-heading" className="text-xs font-black tracking-widest uppercase text-slate-300">
            Live Assistive Message
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isSos ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <ShieldAlert className="w-3.5 h-3.5" />
              EMERGENCY SOS
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Mode: {data?.mode || 'PHRASE'}
            </span>
          )}
        </div>
      </div>

      {/* Main Message Typography */}
      <div className="my-6 sm:my-8">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          User Utterance
        </div>
        <div
          className={`text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white ${
            !data?.input ? 'text-slate-500 font-normal italic' : ''
          }`}
          role="region"
          aria-live="polite"
        >
          "{message}"
        </div>
      </div>

      {/* Metadata Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 my-2 border-y border-slate-800/60 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <User className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px]">User:</span>
            <span className="font-semibold text-white">{data?.user_name || 'Vasan'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <Radio className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px]">RFID:</span>
            <span className="font-mono font-semibold text-cyan-300">{data?.rfid_uid || '3A 3D BF 62'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <ShieldAlert className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px]">Mode:</span>
            <span className="font-semibold text-white">{data?.mode || 'PHRASE'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 block text-[10px]">Time:</span>
            <span className="font-semibold text-white">{formatTime(data?.timestamp || data?.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          Target Language: <span className="font-bold text-cyan-300">{selectedLanguage.name} ({selectedLanguage.native})</span>
        </div>

        <button
          type="button"
          onClick={onTranslateAndSpeak}
          disabled={isLoading || !data?.input}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 focus:ring-4 focus:ring-cyan-400/40 focus:outline-none transition-all shadow-xl shadow-cyan-900/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Translate message and speak in ${selectedLanguage.name}`}
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
              <span>Translating & Generating Speech...</span>
            </>
          ) : (
            <>
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-cyan-200' : ''}`} />
              <span>🔊 Translate & Speak</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};

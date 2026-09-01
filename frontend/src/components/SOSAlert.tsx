import React, { useEffect } from 'react';
import { SmartGloveData, LanguageOption } from '../types/smartGlove';
import { AlertTriangle, Volume2, CheckCircle2, VolumeX, Radio, Clock, User } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { translationService } from '../services/translationService';

interface SOSAlertProps {
  data: SmartGloveData | null;
  selectedLanguage: LanguageOption;
  onAcknowledge: () => void;
  onSilence: () => void;
  isSilenced: boolean;
}

export const SOSAlert: React.FC<SOSAlertProps> = ({
  data,
  selectedLanguage,
  onAcknowledge,
  onSilence,
  isSilenced,
}) => {
  const userName = data?.user_name || 'Assigned User';
  const rawMessage = data?.input || 'Emergency assistance needed';
  const rfidUid = data?.rfid_uid || '3A 3D BF 62';

  const formatTime = (ts?: string) => {
    if (!ts) return new Date().toLocaleTimeString();
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? ts : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  // Trigger emergency alarm siren sound & voice announcement upon activation
  useEffect(() => {
    if (isSilenced) return;

    // 1. Play audible alert tone
    ttsService.playEmergencySiren();

    // 2. Translate and speak emergency voice announcement
    const speakEmergency = async () => {
      try {
        const defaultPrompt = `Emergency alert. ${userName} needs assistance.`;
        let translatedPrompt = defaultPrompt;

        if (selectedLanguage.code !== 'en') {
          translatedPrompt = await translationService.translate(defaultPrompt, selectedLanguage.name);
        }

        // Speak via AI TTS
        await ttsService.speak(translatedPrompt, selectedLanguage.locale);
      } catch (err) {
        console.warn('SOS voice dispatch failed, falling back:', err);
      }
    };

    const timer = setTimeout(speakEmergency, 1200);
    return () => clearTimeout(timer);
  }, [userName, selectedLanguage, isSilenced]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-alert-title"
      aria-describedby="sos-alert-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-rose-950/95 via-slate-900/98 to-slate-950/98 border-2 border-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.35)] p-6 sm:p-10 overflow-hidden animate-pulse-subtle">
        {/* Pulsing warning border animation */}
        <div className="absolute inset-0 border-4 border-rose-500/20 rounded-3xl pointer-events-none animate-ping-slow" />

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-rose-900/50">
          <div className="p-4 rounded-2xl bg-rose-500/20 border-2 border-rose-500 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.5)]">
            <AlertTriangle className="w-12 h-12 animate-bounce" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-rose-500/30 text-rose-200 border border-rose-400/50 mb-2">
              🚨 CRITICAL EMERGENCY
            </span>
            <h1 id="sos-alert-title" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              SOS ALERT ACTIVATED
            </h1>
            <p id="sos-alert-desc" className="text-base sm:text-lg font-bold text-rose-300 mt-1">
              {userName} needs immediate assistance
            </p>
          </div>
        </div>

        {/* Message Content Box */}
        <div className="my-6 p-5 rounded-2xl bg-slate-950/80 border border-rose-900/60 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Emergency Distress Message
          </span>
          <div className="text-xl sm:text-2xl font-black text-white">
            "{rawMessage}"
          </div>
        </div>

        {/* Patient Details Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 mb-8">
          <div className="flex flex-col">
            <span className="text-slate-500 flex items-center gap-1 font-semibold text-[11px]">
              <User className="w-3.5 h-3.5 text-rose-400" />
              Patient/User
            </span>
            <span className="font-bold text-white text-sm truncate">{userName}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-500 flex items-center gap-1 font-semibold text-[11px]">
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              RFID UID
            </span>
            <span className="font-mono font-bold text-cyan-300 text-sm truncate">{rfidUid}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-500 flex items-center gap-1 font-semibold text-[11px]">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              Alert Time
            </span>
            <span className="font-mono font-bold text-white text-sm truncate">
              {formatTime(data?.timestamp || data?.created_at)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full sm:flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:ring-4 focus:ring-emerald-400/50 focus:outline-none transition-all shadow-xl shadow-emerald-950/60 active:scale-[0.98]"
            aria-label="Acknowledge emergency alert and dismiss overlay"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ACKNOWLEDGE ALERT</span>
          </button>

          <button
            type="button"
            onClick={onSilence}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 focus:ring-4 focus:ring-slate-500/40 focus:outline-none transition-all active:scale-[0.98]"
            aria-label="Silence audio siren"
          >
            {isSilenced ? (
              <>
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>UNMUTE ALARM</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>SILENCE ALERT</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

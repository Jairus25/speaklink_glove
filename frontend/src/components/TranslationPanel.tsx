import React from 'react';
import { LanguageOption } from '../types/smartGlove';
import { Sparkles, ArrowDown, Volume2, AlertCircle, RefreshCw } from 'lucide-react';

interface TranslationPanelProps {
  originalText: string;
  translatedText: string;
  selectedLanguage: LanguageOption;
  isLoading: boolean;
  error: string | null;
  onPlayTranslation: () => void;
  onRetryTranslation: () => void;
  isSpeaking: boolean;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  originalText,
  translatedText,
  selectedLanguage,
  isLoading,
  error,
  onPlayTranslation,
  onRetryTranslation,
  isSpeaking,
}) => {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              AI Translation Engine
            </h3>
          </div>

          {!isLoading && !error && translatedText && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AI Translation Ready
            </span>
          )}

          {isLoading && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-300">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
              Translating...
            </span>
          )}
        </div>

        {/* Original Text Section */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Original (Smart Glove Input)
          </span>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm font-medium">
            {originalText || <span className="text-slate-500 italic">Waiting for smart glove message...</span>}
          </div>
        </div>

        {/* Translation Arrow */}
        <div className="flex justify-center my-1">
          <div className="p-1 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Translated Text Section */}
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              {selectedLanguage.name} ({selectedLanguage.native})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-white min-h-[70px] flex items-center">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-cyan-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Translating to {selectedLanguage.name}...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-between w-full text-sm text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Translation unavailable.</span>
                </div>
                <button
                  type="button"
                  onClick={onRetryTranslation}
                  className="px-2.5 py-1 rounded bg-rose-900/40 hover:bg-rose-800/60 text-xs text-rose-200 border border-rose-700/50"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <span className="text-lg font-semibold tracking-wide text-cyan-100">
                {translatedText || originalText || <span className="text-slate-500 italic text-sm">No translation available yet</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Neural Audio Engine • {selectedLanguage.locale}
        </span>

        <button
          type="button"
          onClick={onPlayTranslation}
          disabled={isLoading || !translatedText}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce' : ''}`} />
          <span>Play Translation</span>
        </button>
      </div>
    </div>
  );
};

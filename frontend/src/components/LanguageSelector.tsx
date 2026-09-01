import React from 'react';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../types/smartGlove';
import { Globe, Check } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: LanguageOption;
  onSelectLanguage: (lang: LanguageOption) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="relative inline-block">
        <label htmlFor="compact-lang-select" className="sr-only">
          Select Speech & Translation Language
        </label>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200 focus-within:ring-2 focus-within:ring-cyan-500">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <select
            id="compact-lang-select"
            value={selectedLanguage.code}
            onChange={(e) => {
              const found = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
              if (found) onSelectLanguage(found);
            }}
            className="bg-transparent text-slate-100 text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                {lang.name} ({lang.native})
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Globe className="w-4 h-4 text-cyan-400" />
          Target Language
        </label>
        <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-medium">
          {selectedLanguage.name} • {selectedLanguage.native}
        </span>
      </div>

      {/* Grid of quick selectable pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Language selection">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage.code === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectLanguage(lang)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/80 text-white shadow-sm shadow-cyan-950'
                  : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate">{lang.name}</span>
                <span className={`text-[11px] truncate ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {lang.native}
                </span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

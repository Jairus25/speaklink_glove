import React, { useState } from 'react';
import { MessageHistoryItem, LanguageOption } from '../types/smartGlove';
import { History, Volume2, ShieldAlert, CheckCircle2, Search } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { translationService } from '../services/translationService';

interface MessageHistoryProps {
  history: MessageHistoryItem[];
  selectedLanguage: LanguageOption;
  onUpdateTranslation: (id: string, text: string, lang: string) => void;
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({
  history,
  selectedLanguage,
  onUpdateTranslation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'PHRASE' | 'SOS'>('ALL');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? ts : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  const handleSpeakHistoryItem = async (item: MessageHistoryItem) => {
    try {
      setSpeakingId(item.id);
      let textToSpeak = item.input;

      if (selectedLanguage.code !== 'en') {
        if (item.translated_text && item.language === selectedLanguage.name) {
          textToSpeak = item.translated_text;
        } else {
          textToSpeak = await translationService.translate(item.input, selectedLanguage.name);
          onUpdateTranslation(item.id, textToSpeak, selectedLanguage.name);
        }
      }

      await ttsService.speak(textToSpeak, selectedLanguage.locale);
    } catch (err) {
      console.warn('History speech failed:', err);
    } finally {
      setSpeakingId(null);
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.input.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rfid_uid.toLowerCase().includes(searchTerm.toLowerCase());

    const isSos = item.is_sos || item.mode.toUpperCase() === 'SOS';
    const matchesMode =
      filterMode === 'ALL' ||
      (filterMode === 'SOS' && isSos) ||
      (filterMode === 'PHRASE' && !isSos);

    return matchesSearch && matchesMode;
  });

  return (
    <section aria-labelledby="history-heading" className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-md shadow-xl space-y-4">
      {/* Header with Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 id="history-heading" className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Communication History ({history.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Mode filter pills */}
          <div className="flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-2 py-0.5 rounded font-medium ${
                filterMode === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('PHRASE')}
              className={`px-2 py-0.5 rounded font-medium ${
                filterMode === 'PHRASE' ? 'bg-cyan-950 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Phrase
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('SOS')}
              className={`px-2 py-0.5 rounded font-medium ${
                filterMode === 'SOS' ? 'bg-rose-950 text-rose-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SOS
            </button>
          </div>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No communication events recorded yet.
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isSos = item.is_sos || item.mode.toUpperCase() === 'SOS';
            const isItemSpeaking = speakingId === item.id;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isSos
                    ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700/60'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Mode Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {isSos ? (
                      <span className="inline-flex p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <ShieldAlert className="w-4 h-4 animate-pulse" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-white text-xs truncate">
                        {item.user_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatTime(item.timestamp)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                          isSos ? 'bg-rose-900/50 text-rose-300' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.mode}
                      </span>
                    </div>

                    <div className="text-xs text-slate-200 font-medium truncate">
                      "{item.input}"
                    </div>

                    {item.translated_text && (
                      <div className="text-[11px] text-cyan-300 italic truncate mt-0.5">
                        ↳ {item.translated_text} ({item.language})
                      </div>
                    )}
                  </div>
                </div>

                {/* Re-Speak Button */}
                <button
                  type="button"
                  onClick={() => handleSpeakHistoryItem(item)}
                  disabled={isItemSpeaking}
                  className="flex-shrink-0 p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-600/80 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-50"
                  title="Speak message"
                  aria-label={`Speak message: ${item.input}`}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isItemSpeaking ? 'animate-bounce text-cyan-400' : ''}`} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { SlidersHorizontal, ShieldAlert, Send, X } from 'lucide-react';

interface DemoControlsProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectMessage: (mode: 'PHRASE' | 'SOS', customText?: string) => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  isOpen,
  onClose,
  onInjectMessage,
}) => {
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const quickPhrases = [
    { label: "Hello, I'm Vasan", mode: 'PHRASE' as const },
    { label: 'I need medicine', mode: 'PHRASE' as const },
    { label: 'I need a glass of water', mode: 'PHRASE' as const },
    { label: 'Please call the doctor', mode: 'PHRASE' as const },
    { label: 'I need help getting up', mode: 'PHRASE' as const },
  ];

  const sosPhrases = [
    { label: 'Emergency assistance needed immediately!', mode: 'SOS' as const },
    { label: 'Severe chest pain, please hurry!', mode: 'SOS' as const },
  ];

  const handleSendCustom = (mode: 'PHRASE' | 'SOS') => {
    if (customInput.trim()) {
      onInjectMessage(mode, customInput.trim());
      setCustomInput('');
    }
  };

  return (
    <aside aria-labelledby="demo-sim-title" className="fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-900/95 border-2 border-amber-500/60 p-4 shadow-2xl backdrop-blur-xl animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
          <SlidersHorizontal className="w-4 h-4" />
          <span id="demo-sim-title" className="tracking-wide">DEVELOPER DEMO SIMULATOR</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Close demo simulator"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg my-2 border border-amber-500/20 font-medium">
        ⚠️ Testing only. Injects mock Smart Glove packets into UI without modifying Supabase.
      </div>

      {/* Quick Normal Phrases */}
      <div className="space-y-1.5 mt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Normal Glove Phrases
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPhrases.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInjectMessage(p.mode, p.label)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition-all font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* SOS Emergency Triggers */}
      <div className="space-y-1.5 mt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Simulate Emergency SOS Event
        </span>
        <div className="flex flex-col gap-1.5">
          {sosPhrases.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInjectMessage(p.mode, p.label)}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800/60 font-bold transition-all text-left flex items-center justify-between"
            >
              <span>🚨 {p.label}</span>
              <span className="text-[10px] bg-rose-900 px-1.5 py-0.5 rounded">SOS</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Phrase Input */}
      <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Custom Glove Message
        </span>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="Type any glove text..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendCustom('PHRASE');
            }}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => handleSendCustom('PHRASE')}
            disabled={!customInput.trim()}
            className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition-colors"
            title="Inject as Normal Phrase"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleSendCustom('SOS')}
            disabled={!customInput.trim()}
            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 transition-colors font-bold text-xs"
            title="Inject as SOS Emergency"
          >
            SOS
          </button>
        </div>
      </div>
    </aside>
  );
};

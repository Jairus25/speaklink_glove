import React from 'react';
import { Play, Pause, Square, Volume2, Loader2, VolumeX } from 'lucide-react';
import { TTSStatus } from '../types/smartGlove';
import { AudioVisualizer } from './AudioVisualizer';

interface SpeechControlsProps {
  status: TTSStatus;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const SpeechControls: React.FC<SpeechControlsProps> = ({
  status,
  onPlay,
  onPause,
  onResume,
  onStop,
  disabled = false,
}) => {
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isLoading = status === 'loading';
  const isError = status === 'error';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-lg shadow-black/20">
      {/* Visualizer & Status text */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Volume2 className="w-5 h-5 animate-pulse text-cyan-400" />
          ) : isError ? (
            <VolumeX className="w-5 h-5 text-rose-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-slate-400" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Audio Status
          </span>
          <span className="text-sm font-medium text-slate-200">
            {isLoading && '🔊 Generating Speech...'}
            {isPlaying && '🔊 Speaking...'}
            {isPaused && '⏸ Paused'}
            {isError && '⚠️ Speech Error'}
            {status === 'idle' && 'Ready to Speak'}
          </span>
        </div>

        <div className="ml-auto sm:ml-4 flex-1 sm:flex-initial">
          <AudioVisualizer isPlaying={isPlaying} isPaused={isPaused} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Play / Resume Button */}
        {!isPlaying && !isPaused && (
          <button
            type="button"
            onClick={onPlay}
            disabled={disabled || isLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-900/30 active:scale-[0.98]"
            aria-label="Speak text"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>Speak</span>
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all shadow-md shadow-emerald-950/40 active:scale-[0.98]"
            aria-label="Resume audio"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume</span>
          </button>
        )}

        {isPlaying && (
          <button
            type="button"
            onClick={onPause}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-amber-600 hover:bg-amber-500 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all shadow-md shadow-amber-950/40 active:scale-[0.98]"
            aria-label="Pause audio"
          >
            <Pause className="w-4 h-4 fill-white" />
            <span>Pause</span>
          </button>
        )}

        {/* Stop Button */}
        {(isPlaying || isPaused || isLoading) && (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-medium text-sm text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all active:scale-[0.98]"
            aria-label="Stop audio"
          >
            <Square className="w-3.5 h-3.5 fill-rose-300" />
            <span>Stop</span>
          </button>
        )}
      </div>
    </div>
  );
};

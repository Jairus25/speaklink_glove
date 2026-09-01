import React from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  isPaused?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, isPaused = false }) => {
  const bars = [14, 24, 38, 52, 34, 48, 20, 42, 60, 32, 22, 45, 18];

  return (
    <div
      className="flex items-center justify-center gap-1 h-10 px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden"
      aria-hidden="true"
    >
      {bars.map((defaultHeight, idx) => {
        // Animation delay staggered
        const animDuration = 0.5 + (idx % 4) * 0.2;
        return (
          <span
            key={idx}
            className={`w-1 rounded-full transition-all duration-300 ${
              isPlaying && !isPaused
                ? 'bg-gradient-to-t from-cyan-500 to-blue-400 animate-pulse'
                : isPaused
                ? 'bg-amber-500/60'
                : 'bg-slate-700/60'
            }`}
            style={{
              height: isPlaying && !isPaused ? `${Math.max(15, (defaultHeight * 0.7 + (idx * 3) % 25))}%` : '20%',
              animationDuration: `${animDuration}s`,
              animationDelay: `${idx * 0.08}s`,
            }}
          />
        );
      })}
    </div>
  );
};

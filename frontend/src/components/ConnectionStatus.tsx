import React from 'react';
import { BackendConnectionStatus } from '../types/smartGlove';
import { Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: BackendConnectionStatus;
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, compact = false }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Connected',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
          icon: <Wifi className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'reconnecting':
        return {
          label: 'Reconnecting',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          dot: 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]',
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
        };
      case 'offline':
      default:
        return {
          label: 'Backend Offline',
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          dot: 'bg-rose-500 shadow-[0_0_8px_#ef4444]',
          icon: <WifiOff className="w-3.5 h-3.5 text-rose-400" />,
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.bg} ${config.color}`}
        title={`Smart Glove Backend: ${config.label}`}
        role="status"
        aria-label={`Smart Glove Backend status: ${config.label}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${config.bg}`}
      role="status"
      aria-label={`Smart Glove Backend status: ${config.label}`}
    >
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-cyan-400" />
        <span className="text-slate-300 font-medium">Smart Glove Backend</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
      </div>
    </div>
  );
};

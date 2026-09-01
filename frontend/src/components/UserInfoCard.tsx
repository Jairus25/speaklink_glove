import React from 'react';
import { SmartGloveData } from '../types/smartGlove';
import { User, Radio, Cpu, Clock, ShieldAlert } from 'lucide-react';

interface UserInfoCardProps {
  data: SmartGloveData | null;
}

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ data }) => {
  const isSos = data?.mode?.toUpperCase() === 'SOS' || data?.is_sos === true;

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-md shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Smart Glove Telemetry
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
          ESP32 v2.4
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* User Card */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Assigned User</span>
          </div>
          <div className="font-bold text-white text-base truncate">
            {data?.user_name || 'Vasan'}
          </div>
        </div>

        {/* RFID Card */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>RFID Tag UID</span>
          </div>
          <div className="font-mono font-bold text-cyan-300 text-sm truncate">
            {data?.rfid_uid || '3A 3D BF 62'}
          </div>
        </div>

        {/* Mode Card */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            {isSos ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Current Mode</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                isSos
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {data?.mode || 'PHRASE'}
            </span>
          </div>
        </div>

        {/* Timestamp Card */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Last Sync</span>
          </div>
          <div className="font-mono text-slate-300 text-xs truncate">
            {data?.timestamp || data?.created_at
              ? new Date(data.timestamp || data.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Live Syncing'}
          </div>
        </div>
      </div>
    </div>
  );
};

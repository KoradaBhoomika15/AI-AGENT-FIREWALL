import React from 'react';
import { ShieldAlert, Zap, Cpu } from 'lucide-react';
import { FirewallMode } from '../../types';

interface SimulationBannerProps {
  mode: FirewallMode;
  onToggleMode: (newMode: FirewallMode) => void;
  n8nConnected: boolean;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({
  mode,
  onToggleMode,
  n8nConnected
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-indigo-950/70 border-b border-amber-500/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-200">
      <div className="flex items-center gap-2.5">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-amber-300 uppercase">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>SIMULATION ONLY</span>
        </div>
        <span className="text-slate-400 hidden sm:inline">—</span>
        <span className="text-slate-300 hidden sm:inline">
          Educational Security Sandbox. No real money or payment credentials are processed.
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={() => onToggleMode('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'demo'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Demo Mode</span>
          </button>
          <button
            onClick={() => onToggleMode('live')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'live'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Live n8n Mode</span>
          </button>
        </div>

        {mode === 'live' && (
          <span className="text-[11px] font-mono flex items-center gap-1 text-slate-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                n8nConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {n8nConnected ? 'n8n Webhook Active' : 'Fallback / Standby'}
          </span>
        )}
      </div>
    </div>
  );
};

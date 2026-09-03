import React from 'react';
import { useScreening } from '../context/ScreeningContext';
import { WifiOff, Cpu, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, t, toggleOnlineStatus } = useScreening();

  if (isOnline) return null;

  return (
    <div id="offline-status-banner" className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-amber-600/30 text-slate-950">
            <WifiOff className="w-4 h-4" />
          </span>
          <div>
            <span className="font-bold mr-1.5">[Offline Mode Active]</span>
            <span className="text-slate-900">{t('offlineBanner')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[11px] bg-amber-600/20 px-2 py-0.5 rounded font-mono">
            <Cpu className="w-3 h-3" />
            Wasm Inference Active
          </span>
          <button
            id="reconnect-network-btn"
            type="button"
            onClick={toggleOnlineStatus}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors text-[11px] font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            Go Online
          </button>
        </div>
      </div>
    </div>
  );
};

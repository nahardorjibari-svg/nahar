import React from 'react';
import { Database, AlertTriangle, Cloud, RotateCcw, Sliders } from 'lucide-react';
import { DataService } from '../../services/dataService';

interface DataBannerProps {
  onOpenFirebaseModal: () => void;
  onRefreshData: () => void;
}

export const DataBanner: React.FC<DataBannerProps> = ({
  onOpenFirebaseModal,
  onRefreshData,
}) => {
  const isCloud = DataService.isCloudMode();

  const handleResetDemo = () => {
    if (window.confirm('Reset demo inventory to standard 3-piece catalog items? This will refresh all products and stock history.')) {
      DataService.resetToDemoData();
      onRefreshData();
    }
  };

  if (isCloud) {
    return (
      <div className="glass-panel bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-200 text-xs px-4 py-2 flex items-center justify-between relative z-20 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-emerald-300">Cloud Firestore Live:</span>
          <span className="text-emerald-200/90 hidden sm:inline">Inventory and stock movements are syncing in real-time with Firebase.</span>
        </div>
        <button
          onClick={onOpenFirebaseModal}
          className="text-xs text-emerald-300 hover:text-white glass-card px-2.5 py-1 rounded-lg border border-emerald-500/30 font-medium flex items-center gap-1.5 cursor-pointer transition-all hover:border-emerald-400"
        >
          <Sliders className="w-3 h-3 text-emerald-400" />
          <span>Firebase Config</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel bg-amber-950/40 border-b border-amber-500/20 text-amber-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 relative z-20 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
        </span>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-semibold text-amber-300">Local Cache Mode:</span>
        <span className="text-amber-100/90 hidden md:inline">
          Changes are stored locally. Connect your Firebase credentials in Settings to sync with Cloud Firestore.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleResetDemo}
          className="text-amber-300 hover:text-white flex items-center gap-1 text-xs cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          title="Restore original seed 3-piece products"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>
        <button
          onClick={onOpenFirebaseModal}
          className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
        >
          <Database className="w-3 h-3 text-amber-400" />
          <span>Setup Firebase</span>
        </button>
      </div>
    </div>
  );
};

import React from "react";
import { Download, Sparkles, X } from "lucide-react";

interface PwaInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  onInstall,
  onDismiss,
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between shadow-inner">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span>
          <strong>Installer l'application PWA :</strong> Accédez à l'Assistant
          MiniMax H3 directement depuis votre écran d'accueil sans navigateur !
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onInstall}
          className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer</span>
        </button>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

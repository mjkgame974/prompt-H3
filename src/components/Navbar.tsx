import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  Sparkles,
  Download,
  RotateCcw,
  PlusCircle,
  FolderOpen,
  ChevronDown,
  Layers,
  CheckCircle2,
  FileJson,
  Upload,
  Cloud,
  CloudOff,
  Check,
} from "lucide-react";
import { PRESET_TEMPLATES } from "../constants/presets";
import { ProjectData } from "../types/minimax";
import { ExportProjectButton } from "./ExportProjectButton";
import { formatLastSavedAgo } from "../utils/persistence";

interface NavbarProps {
  project: ProjectData;
  onLoadPreset: (presetId: string) => void;
  onNewProject: () => void;
  onOpenChecklist: () => void;
  onExportJson: () => void;
  onSelectFileForImport: (file: File) => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  lastSavedAt?: string | null;
  justSaved?: boolean;
  storageAvailable?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  onLoadPreset,
  onNewProject,
  onOpenChecklist,
  onExportJson,
  onSelectFileForImport,
  canInstallPwa,
  onInstallPwa,
  lastSavedAt = null,
  justSaved = false,
  storageAvailable = true,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh the "il y a X" label every 30s so the indicator stays fresh
  // even when the user is idle on the page.
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const handle = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(handle);
  }, []);

  const savedAgoLabel = justSaved
    ? "Sauvegardé"
    : formatLastSavedAgo(lastSavedAt, now);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelectFileForImport(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Project Indicator */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/10 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400">
                MiniMax H3 Assistant
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                v1.0.0
              </span>
            </div>
            {/* Active Project Pill */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="text-slate-500 font-medium">Projet actuel :</span>
              <span className="font-bold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
                {project.title || "Projet Sans Titre"}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                {project.duration}
              </span>
            </div>

            {/* Autosave Indicator */}
            <div
              className="hidden md:flex items-center space-x-1 text-[10px] mt-0.5"
              title={
                storageAvailable
                  ? "Sauvegarde automatique locale (localStorage)"
                  : "Sauvegarde automatique indisponible (mode privé ou localStorage désactivé)"
              }
            >
              {storageAvailable ? (
                justSaved ? (
                  <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                    <Check className="w-3 h-3" />
                    <span>Sauvegardé</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-slate-500">
                    <Cloud className="w-3 h-3" />
                    <span>{savedAgoLabel ?? "En attente"}</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center space-x-1 text-amber-400/80">
                  <CloudOff className="w-3 h-3" />
                  <span>Pas de sauvegarde auto</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Nouveau Projet */}
          <button
            onClick={onNewProject}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Créer un nouveau projet vierge"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Nouveau projet</span>
          </button>

          {/* Preset Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Charger un exemple de projet"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Exemples H3</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 py-2 text-left">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Modèles préremplis H3
                </div>
                {PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      onLoadPreset(tmpl.id);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/80 transition flex items-start space-x-2 group"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                        {tmpl.name}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {tmpl.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sauvegarder JSON Button */}
          <ExportProjectButton project={project} variant="navbar" />

          {/* Importer JSON Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Importer un fichier JSON de projet"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Importer JSON</span>
          </button>

          {/* Checklist H3 Button */}
          <button
            onClick={onOpenChecklist}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
            title="Ouvrir la checklist pré-génération MiniMax H3"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Checklist H3</span>
          </button>

          {/* Install PWA Button */}
          {canInstallPwa && onInstallPwa && (
            <button
              onClick={onInstallPwa}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PWA</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

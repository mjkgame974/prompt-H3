import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  Sparkles,
  Download,
  PlusCircle,
  ChevronDown,
  Layers,
  CheckCircle2,
  FileJson,
  Upload,
  Cloud,
  CloudOff,
  Check,
  FolderOpen,
  History,
  Save,
  Trash2,
} from "lucide-react";
import { PRESET_TEMPLATES } from "../constants/presets";
import { ProjectData } from "../types/minimax";
import { ProjectsStore, sortProjectsByRecency, formatLastSavedAgo } from "../utils/persistence";
import { ExportProjectButton } from "./ExportProjectButton";

interface NavbarProps {
  project: ProjectData;
  store: ProjectsStore;
  onLoadPreset: (presetId: string) => void;
  onNewProject: () => void;
  onSwitchProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onSaveNow: () => void;
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
  store,
  onLoadPreset,
  onNewProject,
  onSwitchProject,
  onDeleteProject,
  onSaveNow,
  onOpenChecklist,
  onExportJson,
  onSelectFileForImport,
  canInstallPwa,
  onInstallPwa,
  lastSavedAt = null,
  justSaved = false,
  storageAvailable = true,
}) => {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Refresh the "il y a X" label every 30s
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const handle = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(handle);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setPresetsOpen(false);
      }
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const sortedProjects = sortProjectsByRecency(store.projects);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Project Indicator */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/10 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400 truncate">
                MiniMax H3 Assistant
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                v1.0.0
              </span>
            </div>
            {/* Active Project Pill */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="text-slate-500 font-medium shrink-0">Projet :</span>
              <span className="font-bold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
                {project.title || "Sans titre"}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
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
                    <span>{savedAgoLabel}</span>
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
          {/* Save Now Button (explicit save) */}
          <button
            type="button"
            onClick={onSaveNow}
            disabled={!storageAvailable}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 disabled:opacity-40 transition"
            title="Forcer la sauvegarde dans l'historique local"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Enregistrer</span>
          </button>

          {/* Nouveau Projet */}
          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Créer un nouveau projet vierge"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Nouveau</span>
          </button>

          {/* Mes Projets (History) Dropdown */}
          <div className="relative" ref={historyRef}>
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                historyOpen
                  ? "bg-slate-700 text-slate-100 border-slate-600"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
              title="Voir l'historique de tes projets"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">Mes Projets</span>
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {sortedProjects.length}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {historyOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 py-2 text-left max-h-[480px] overflow-y-auto">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Historique des projets</span>
                  <span className="text-[10px] text-slate-500">{sortedProjects.length} au total</span>
                </div>

                {sortedProjects.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    <History className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    Aucun projet sauvegardé pour le moment.
                    <br />
                    <span className="text-[10px] text-slate-600">
                      Tes projets apparaîtront ici automatiquement.
                    </span>
                  </div>
                ) : (
                  sortedProjects.map((p) => {
                    const isActive = p.id === store.activeProjectId;
                    return (
                      <div
                        key={p.id}
                        className={`group flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-800/80 transition ${
                          isActive ? "bg-amber-500/10 border-l-2 border-amber-500" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchProject(p.id);
                            setHistoryOpen(false);
                          }}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-xs font-semibold truncate ${
                                isActive ? "text-amber-300" : "text-slate-200"
                              }`}
                            >
                              {p.title || "Sans titre"}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ACTIF
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {p.data.duration} ·{" "}
                            {formatLastSavedAgo(p.lastModifiedAt, now) ?? "—"}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Supprimer définitivement le projet "${p.title || "Sans titre"}" ?`
                              )
                            ) {
                              onDeleteProject(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="Supprimer ce projet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Preset Selector Dropdown */}
          <div className="relative" ref={presetsRef}>
            <button
              type="button"
              onClick={() => setPresetsOpen(!presetsOpen)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Charger un exemple de projet"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Exemples H3</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {presetsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 py-2 text-left">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Modèles préremplis H3
                </div>
                {PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      onLoadPreset(tmpl.id);
                      setPresetsOpen(false);
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
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Importer un fichier JSON de projet"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Importer JSON</span>
          </button>

          {/* Checklist H3 Button */}
          <button
            type="button"
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
              type="button"
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

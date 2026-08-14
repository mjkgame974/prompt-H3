import React, { useState, useRef } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Zap,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Send,
  Layers,
  FileJson,
  Upload,
  Clock,
  CheckCircle,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  Eye,
} from "lucide-react";
import { ProjectData, ValidationIssue } from "../../types/minimax";
import { WizardContextBox } from "../WizardContextBox";
import {
  compile5sTestPrompt,
  compileBlockStructured,
  compileMiniMaxH3Prompt,
  compileFrenchPrompt,
} from "../../utils/compiler";
import { ExportProjectButton } from "../ExportProjectButton";

interface Step9GenerationProps {
  project: ProjectData;
  issues?: ValidationIssue[];
  onOptimizeWithAi: () => void;
  isOptimizing: boolean;
  onOpenChecklist: () => void;
  onExportJson: () => void;
  onSelectFileForImport: (file: File) => void;
}

type Tab = "mixte" | "5s" | "blocks";

export const Step9Generation: React.FC<Step9GenerationProps> = ({
  project,
  issues = [],
  onOptimizeWithAi,
  isOptimizing,
  onOpenChecklist,
  onExportJson,
  onSelectFileForImport,
}) => {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copied5s, setCopied5s] = useState(false);
  const [copiedFr, setCopiedFr] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("mixte");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullPrompt = project.optimizedPrompt || compileMiniMaxH3Prompt(project);
  const test5sPrompt = compile5sTestPrompt(project);
  const blocks = compileBlockStructured(project);
  const frenchPrompt = compileFrenchPrompt(project);

  const handleCopyFull = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleCopy5s = () => {
    navigator.clipboard.writeText(test5sPrompt);
    setCopied5s(true);
    setTimeout(() => setCopied5s(false), 2000);
  };

  const handleCopyFr = () => {
    navigator.clipboard.writeText(frenchPrompt);
    setCopiedFr(true);
    setTimeout(() => setCopiedFr(false), 2000);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([fullPrompt], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `minimax_h3_prompt_${(project.title || "projet")
      .toLowerCase()
      .replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelectFileForImport(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Count missing local references
  const missingMedia = project.references.filter((ref) => {
    return (
      !ref.url ||
      ref.url.startsWith("blob:") ||
      ref.url.startsWith("file:") ||
      ref.url.startsWith("C:") ||
      ref.url.startsWith("/")
    );
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <WizardContextBox
        icon={Sparkles}
        title="Étape 9 — Génération & Export du Prompt Final MiniMax H3"
        description={
          <>
            L'onglet par défaut te montre le prompt en <strong>français</strong> (pour relire et
            comprendre) à côté de la version <strong>anglaise H3</strong> (à copier-coller dans
            MiniMax H3). Chaque version a son propre bouton "Copier".
          </>
        }
      />

      {/* Primary Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("mixte")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === "mixte"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>🇫🇷 + 🇬🇧 Vue Mixte</span>
          </button>

          <button
            onClick={() => setActiveTab("5s")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 ${
              activeTab === "5s"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test 5s</span>
          </button>

          <button
            onClick={() => setActiveTab("blocks")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === "blocks"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Vue Structurée
          </button>
        </div>

        {/* AI & Export Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOptimizeWithAi}
            disabled={isOptimizing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md disabled:opacity-50 transition"
          >
            <Sparkles className={`w-4 h-4 ${isOptimizing ? "animate-spin" : ""}`} />
            <span>{isOptimizing ? "Optimisation..." : "Optimiser par IA"}</span>
          </button>

          <ExportProjectButton project={project} variant="secondary" label="Sauvegarder JSON" />

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Prompt .txt</span>
          </button>
        </div>
      </div>

      {/* Default tab: side-by-side French + English */}
      {activeTab === "mixte" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ── French pane (read-only, blue) ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>🇫🇷</span>
                  <span>Version Française (lecture)</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyFr}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition active:scale-95"
                >
                  {copiedFr ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier FR</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-5 bg-slate-950 border border-blue-500/30 rounded-2xl font-sans text-sm text-slate-100 whitespace-pre-wrap leading-relaxed select-all max-h-[640px] overflow-y-auto">
                {frenchPrompt}
              </div>
            </div>

            {/* ── English pane (H3 spec, copy this, amber) ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>🇬🇧</span>
                  <span>Version Anglaise H3 (copier-coller)</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyFull}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
                >
                  {copiedFull ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier EN</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-5 bg-slate-950 border border-amber-500/30 rounded-2xl font-mono text-xs text-slate-100 whitespace-pre-wrap leading-relaxed select-all max-h-[640px] overflow-y-auto">
                {fullPrompt}
              </div>
            </div>
          </div>

          {/* Helper banner */}
          <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-xl text-xs text-blue-200 leading-relaxed">
            <strong>💡 Mode d'emploi :</strong> lis la colonne de gauche pour vérifier ton intention
            (en français, c'est ton texte). Une fois satisfait, clique sur <span className="font-bold">« Copier EN »</span> à
            droite pour récupérer la version formatée H3, prête à coller dans MiniMax H3.
            <br />
            <span className="text-[10px] text-slate-400 italic">
              Note : le dictionnaire de traduction FR→EN intégré est limité. Pour une traduction
              complète de tes champs en français vers l'anglais H3, on peut brancher Gemini (reporté).
            </span>
          </div>
        </div>
      )}

      {/* 5s Test Prompt */}
      {activeTab === "5s" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Zap className="w-4 h-4" />
              <span>Version Test 5s Économique (Pour Validation Rapide)</span>
            </label>
            <button
              type="button"
              onClick={handleCopy5s}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition"
            >
              {copied5s ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Version 5s Copiée !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier Version 5s</span>
                </>
              )}
            </button>
          </div>

          <div className="p-5 bg-slate-950 border border-amber-500/30 rounded-2xl font-mono text-xs text-slate-100 whitespace-pre-wrap leading-relaxed select-all">
            {test5sPrompt}
          </div>
        </div>
      )}

      {/* Structured blocks */}
      {activeTab === "blocks" && (
        <div className="space-y-3 font-mono text-xs text-slate-200">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold block">
              1. CONTRAT DE STYLE
            </span>
            <p className="text-slate-200">{blocks.styleContractBlock}</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold block">
              2. TIMELINE ET SÉQUENCE PLANS
            </span>
            <p className="text-slate-200 whitespace-pre-wrap">{blocks.timelineBlock}</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold block">
              3. AUDIO DESIGN (OBLIGATOIRE)
            </span>
            <p className="text-slate-200">{blocks.audioBlock}</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold block">
              4. TEXTE À L'ÉCRAN & DIALOGUES
            </span>
            <p className="text-slate-200">{blocks.textAndDialogueBlock}</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold block">
              5. CONSIGNES DE PRÉSERVATION
            </span>
            <p className="text-slate-200">{blocks.preservationBlock}</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold block">
              6. LISTE NÉGATIVE (3-6 ITEMS)
            </span>
            <p className="text-slate-200">{blocks.negativeConstraintsBlock}</p>
          </div>
        </div>
      )}

      {/* Dedicated Section: Sauvegarde et Restauration du Projet */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileJson className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-sm text-slate-100">
              Sauvegarde et Restauration du Projet
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Compatible Schema v1.0.0</span>
          </span>
        </div>

        {/* Project Backup Metadata Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Dernière Modification</span>
            </div>
            <div className="font-mono text-slate-300 mt-1 text-[11px] truncate">
              {project.lastModifiedAt
                ? new Date(project.lastModifiedAt).toLocaleDateString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "À l'instant"}
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
              <FileJson className="w-3 h-3 text-amber-400" />
              <span>Version Schéma</span>
            </div>
            <div className="font-mono font-bold text-slate-200 mt-1">v1.0.0</div>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
              <ImageIcon className="w-3 h-3 text-amber-400" />
              <span>Nombre Références</span>
            </div>
            <div className="font-bold text-slate-200 mt-1">
              {project.references.length} image(s)
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Médias à Réimporter</span>
            </div>
            <div className="font-bold text-slate-200 mt-1">
              {missingMedia > 0 ? (
                <span className="text-amber-400">{missingMedia} manquant(s)</span>
              ) : (
                <span className="text-emerald-400">Tous intégrés</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <ExportProjectButton project={project} label="Sauvegarder Projet (.json)" />

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
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Restaurer / Importer un Projet (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

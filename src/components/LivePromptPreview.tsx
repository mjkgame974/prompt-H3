import React, { useState } from "react";
import {
  Copy,
  Check,
  Zap,
  Sparkles,
  FileText,
  AlertTriangle,
  RefreshCw,
  Eye,
  Minimize2,
  Maximize2,
  Info,
} from "lucide-react";
import { ProjectData, ValidationIssue } from "../types/minimax";
import {
  compile5sTestPrompt,
  compileBlockStructured,
  compileMiniMaxH3Prompt,
} from "../utils/compiler";

interface LivePromptPreviewProps {
  project: ProjectData;
  issues?: ValidationIssue[];
  onOptimizeWithAi?: () => void;
  isOptimizing?: boolean;
  aiSuggestions?: string[];
}

export const LivePromptPreview: React.FC<LivePromptPreviewProps> = ({
  project,
  issues = [],
  onOptimizeWithAi,
  isOptimizing,
  aiSuggestions,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"full" | "test5s" | "blocks">("full");
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  const fullPrompt = compileMiniMaxH3Prompt(project);
  const test5sPrompt = compile5sTestPrompt(project);
  const structuredBlocks = compileBlockStructured(project);

  const activePromptToDisplay =
    viewMode === "full"
      ? fullPrompt
      : viewMode === "test5s"
      ? test5sPrompt
      : "";

  const handleCopy = () => {
    const textToCopy =
      viewMode === "blocks"
        ? fullPrompt
        : activePromptToDisplay;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return (
    <aside className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-xl relative overflow-hidden backdrop-blur">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <span>Prévisualisation Prompt H3</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded-full border border-slate-700">
                Direct
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Synthèse en anglais selon les standards MiniMax
            </p>
          </div>
        </div>

        {/* Quality Health Score */}
        <div className="flex items-center space-x-2">
          {errorCount > 0 ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-3 h-3" />
              <span>{errorCount} Erreur(s)</span>
            </span>
          ) : warningCount > 0 ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" />
              <span>{warningCount} Note(s)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="w-3 h-3" />
              <span>100% Conforme H3</span>
            </span>
          )}
        </div>
      </div>

      {/* Mode View Switcher (Full vs 5s Test vs Blocks) */}
      <div className="flex items-center justify-between my-3 gap-2 flex-wrap">
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode("full")}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              viewMode === "full"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Prompt Complet
          </button>

          <button
            onClick={() => setViewMode("test5s")}
            className={`px-3 py-1 rounded-lg font-medium transition flex items-center space-x-1 ${
              viewMode === "test5s"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Version Test 5s</span>
          </button>

          <button
            onClick={() => setViewMode("blocks")}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              viewMode === "blocks"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Vue par Blocs
          </button>
        </div>

        {/* AI Optimize Trigger Button */}
        {onOptimizeWithAi && (
          <button
            onClick={onOptimizeWithAi}
            disabled={isOptimizing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md disabled:opacity-50 transition"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? "animate-spin" : ""}`} />
            <span>{isOptimizing ? "Optimisation..." : "Optimiser par IA"}</span>
          </button>
        )}
      </div>

      {/* AI Suggestions Box if present */}
      {aiSuggestions && aiSuggestions.length > 0 && (
        <div className="mb-3 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl text-xs text-indigo-200 space-y-1">
          <div className="font-semibold text-indigo-300 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recommandations de l'Assistant IA :</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
            {aiSuggestions.map((sug, i) => (
              <li key={i}>{sug}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Prompt Code Container */}
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-3.5 font-mono text-xs leading-relaxed text-amber-200/90 overflow-y-auto max-h-[420px] lg:max-h-[500px] select-all space-y-3">
        {viewMode !== "blocks" ? (
          <pre className="whitespace-pre-wrap font-mono text-slate-200">
            {activePromptToDisplay}
          </pre>
        ) : (
          <div className="space-y-3 text-slate-200 font-mono text-xs">
            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">
                01. CONTRAT DE STYLE
              </span>
              <p className="text-slate-300">{structuredBlocks.styleContractBlock}</p>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">
                02. TIMELINE ET SÉQUENCE PLANS
              </span>
              <p className="text-slate-300 whitespace-pre-wrap">
                {structuredBlocks.timelineBlock}
              </p>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">
                03. AUDIO DESIGN (OBLIGATOIRE)
              </span>
              <p className="text-slate-300">{structuredBlocks.audioBlock}</p>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">
                04. TEXTE & DIALOGUES
              </span>
              <p className="text-slate-300">{structuredBlocks.textAndDialogueBlock}</p>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">
                05. CONSIGNES DE PRÉSERVATION
              </span>
              <p className="text-slate-300">{structuredBlocks.preservationBlock}</p>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">
                06. LISTE NÉGATIVE (3-6 ITEMS)
              </span>
              <p className="text-slate-300">{structuredBlocks.negativeConstraintsBlock}</p>
            </div>
          </div>
        )}
      </div>

      {/* Copy & Export Actions Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Prêt pour copier dans MiniMax H3</span>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition shadow-lg shadow-amber-500/20 active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-slate-950" />
              <span>Copié dans le presse-papier !</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copier le Prompt Final</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

import React from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Upload,
  Image as ImageIcon,
  ShieldAlert,
  ArrowRight,
  Info,
  RefreshCw,
  Clock,
  Layout,
  Film,
} from "lucide-react";
import { ImportAnalysisResult } from "../types/project";
import { ProjectData } from "../types/minimax";
import { ProjectSummary } from "./ProjectSummary";

interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ImportAnalysisResult | null;
  onConfirmImport: (importedProject: ProjectData) => void;
}

export const ImportProjectModal: React.FC<ImportProjectModalProps> = ({
  isOpen,
  onClose,
  analysis,
  onConfirmImport,
}) => {
  if (!isOpen || !analysis) return null;

  const hasBlockingErrors = analysis.blockingErrors.length > 0;

  const handleConfirm = () => {
    if (analysis.projectData && !hasBlockingErrors) {
      onConfirmImport(analysis.projectData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Aperçu & Validation de l'Importation JSON
            </h2>
            <p className="text-xs text-slate-400">
              Vérification de la compatibilité du fichier et analyse des données MiniMax H3.
            </p>
          </div>
        </div>

        {/* Blocking Error Alert */}
        {hasBlockingErrors && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl space-y-2 text-rose-200 text-xs">
            <div className="flex items-center space-x-2 font-bold text-rose-300 text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Importation Impossible — Erreurs Bloquantes</span>
            </div>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-rose-300">
              {analysis.blockingErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="text-[11px] text-rose-400 pt-1 font-semibold">
              Veuillez corriger le fichier JSON avant de réessayer.
            </p>
          </div>
        )}

        {/* Migration Summary Notice */}
        {analysis.migrationRequired && analysis.migrationSummary && (
          <div className="p-4 bg-indigo-950/50 border border-indigo-800/80 rounded-2xl space-y-1 text-indigo-200 text-xs">
            <div className="flex items-center space-x-2 font-bold">
              <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Migration Automatique de Schéma Effectuée</span>
            </div>
            <p className="text-[11px] text-indigo-300">
              Projet converti depuis la version {analysis.migrationSummary.fromVersion} vers le schéma standard v{analysis.migrationSummary.toVersion}.
            </p>
          </div>
        )}

        {/* Project Summary Card */}
        {analysis.projectData && (
          <ProjectSummary
            project={analysis.projectData}
            schemaVersion={analysis.schemaVersion}
            appVersion={analysis.appVersion}
            exportedAt={analysis.exportedAt}
            missingMediaCount={analysis.missingMediaCount}
            h3Score={analysis.h3Score}
          />
        )}

        {/* Missing Media Banner Notice */}
        {analysis.missingMediaCount > 0 && (
          <div className="p-4 bg-amber-950/50 border border-amber-800/80 rounded-2xl space-y-1 text-amber-200 text-xs">
            <div className="flex items-center space-x-2 font-bold text-amber-300">
              <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Attention : {analysis.missingMediaCount} média(s) non intégré(s)
              </span>
            </div>
            <p className="text-[11px] text-amber-300 leading-relaxed">
              « Le média original n'est pas intégré à ce fichier. Vous devrez le réimporter avant la génération finale. »
            </p>
          </div>
        )}

        {/* Warnings & Rule Issues List */}
        {analysis.warnings.length > 0 && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="font-bold text-slate-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Avertissements et Précisions ({analysis.warnings.length})</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              {analysis.warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety Warning */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 flex items-start space-x-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            <strong>Rappel de sécurité :</strong> La confirmation remplacera l'état du projet actuellement ouvert. Votre projet actuel sera conservé tant que vous n'avez pas cliqué sur le bouton de confirmation.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={hasBlockingErrors}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Importer et remplacer le projet actuel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

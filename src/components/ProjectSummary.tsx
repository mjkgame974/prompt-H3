import React from "react";
import {
  FileText,
  Clock,
  Layout,
  Film,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  ShieldAlert,
} from "lucide-react";
import { ProjectData } from "../types/minimax";
import { mapRoleToFrenchLabel } from "../types/reference";

interface ProjectSummaryProps {
  project: ProjectData;
  schemaVersion?: string;
  appVersion?: string;
  exportedAt?: string;
  missingMediaCount?: number;
  h3Score?: number;
}

export const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  project,
  schemaVersion = "1.0.0",
  appVersion = "1.0.0",
  exportedAt,
  missingMediaCount = 0,
  h3Score,
}) => {
  const score = h3Score ?? project.h3Score ?? 85;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
            <span>{project.title || "Projet Sans Titre"}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
              v{schemaVersion}
            </span>
          </h3>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            ID: <span className="text-slate-400">{project.id}</span>
          </p>
        </div>

        {/* H3 Compliance Score Badge */}
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Score H3
          </div>
          <div
            className={`text-lg font-black font-mono ${
              score >= 80
                ? "text-emerald-400"
                : score >= 60
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {score}%
          </div>
        </div>
      </div>

      {/* Grid of Attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Durée</span>
          </div>
          <div className="font-bold text-slate-200 mt-1">{project.duration}</div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
            <Layout className="w-3 h-3 text-amber-400" />
            <span>Ratio</span>
          </div>
          <div className="font-bold text-slate-200 mt-1">{project.aspectRatio}</div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
            <Film className="w-3 h-3 text-amber-400" />
            <span>Plans</span>
          </div>
          <div className="font-bold text-slate-200 mt-1">
            {project.shots.length} moment(s)
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
            <ImageIcon className="w-3 h-3 text-amber-400" />
            <span>Références</span>
          </div>
          <div className="font-bold text-slate-200 mt-1 flex items-center space-x-1">
            <span>{project.references.length}</span>
            {missingMediaCount > 0 && (
              <span className="text-[10px] text-amber-400 font-mono">
                ({missingMediaCount} à réimporter)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Style & Audio Details */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center space-x-2 text-slate-300">
          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-[11px]">En-tête Style :</span>
          <span className="text-slate-400 truncate italic font-mono text-[11px]">
            {project.styleContract?.condensedEnglishSentence || "Non défini"}
          </span>
        </div>

        {exportedAt && (
          <div className="text-[10px] text-slate-500 font-mono text-right pt-1">
            Exporté le : {new Date(exportedAt).toLocaleString("fr-FR")}
          </div>
        )}
      </div>
    </div>
  );
};

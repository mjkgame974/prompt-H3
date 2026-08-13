import React from "react";
import { FileJson, Download } from "lucide-react";
import { exportProjectToJson } from "../utils/jsonHandler";
import { ProjectData } from "../types/minimax";

interface ExportProjectButtonProps {
  project: ProjectData;
  variant?: "primary" | "secondary" | "navbar";
  className?: string;
  label?: string;
}

export const ExportProjectButton: React.FC<ExportProjectButtonProps> = ({
  project,
  variant = "primary",
  className = "",
  label = "Sauvegarder JSON",
}) => {
  const handleClick = () => {
    exportProjectToJson(project);
  };

  if (variant === "navbar") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition active:scale-95 ${className}`}
        title="Exporter l'intégralité du projet MiniMax H3 au format JSON"
      >
        <FileJson className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 ${className}`}
      >
        <FileJson className="w-4 h-4 text-amber-400" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

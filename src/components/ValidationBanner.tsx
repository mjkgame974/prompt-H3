import React from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Wrench } from "lucide-react";
import { ValidationIssue } from "../types/minimax";

interface ValidationBannerProps {
  issues: ValidationIssue[];
  onApplyFix?: (issue: ValidationIssue) => void;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({
  issues,
  onApplyFix,
}) => {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {issues.map((issue) => {
        const isError = issue.severity === "error";
        const isWarning = issue.severity === "warning";

        return (
          <div
            key={issue.id}
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition shadow-sm ${
              isError
                ? "bg-rose-950/40 border-rose-800/60 text-rose-200"
                : isWarning
                ? "bg-amber-950/40 border-amber-800/60 text-amber-200"
                : "bg-blue-950/40 border-blue-800/60 text-blue-200"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 shrink-0">
                {isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Info className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div>
                <div className="font-bold flex items-center space-x-2">
                  <span>{issue.title}</span>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                      isError
                        ? "bg-rose-500/20 text-rose-300"
                        : isWarning
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    Étape {issue.step}
                  </span>
                </div>
                <p className="mt-0.5 text-slate-300 text-[11px] leading-relaxed">
                  {issue.message}
                </p>
              </div>
            </div>

            {issue.fixActionLabel && onApplyFix && (
              <button
                onClick={() => onApplyFix(issue)}
                className={`shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95 ${
                  isError
                    ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/40"
                    : isWarning
                    ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40"
                    : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/40"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{issue.fixActionLabel}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

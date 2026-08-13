import React from "react";
import {
  Target,
  Palette,
  Image as ImageIcon,
  Clock,
  Camera,
  Volume2,
  Type,
  ShieldAlert,
  Sparkles,
  Check,
} from "lucide-react";
import { ValidationIssue } from "../types/minimax";

interface WizardProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  issues?: ValidationIssue[];
}

export const WIZARD_STEPS = [
  { step: 1, name: "Objectif", icon: Target, desc: "Type & Ratio" },
  { step: 2, name: "Style", icon: Palette, desc: "Contrat de style" },
  { step: 3, name: "Références", icon: ImageIcon, desc: "Rôles & Image" },
  { step: 4, name: "Timeline", icon: Clock, desc: "Plans & Timing" },
  { step: 5, name: "Caméra", icon: Camera, desc: "Mouvements" },
  { step: 6, name: "Audio", icon: Volume2, desc: "Design sonore" },
  { step: 7, name: "Texte & Voix", icon: Type, desc: "Texte & Dialogue" },
  { step: 8, name: "Contraintes", icon: ShieldAlert, desc: "Règles & Limites" },
  { step: 9, name: "Génération", icon: Sparkles, desc: "Prompt Final" },
];

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  onStepClick,
  issues = [],
}) => {
  const getStepIssues = (stepNum: number) => {
    return (issues || []).filter((i) => i.step === stepNum);
  };

  const percent = Math.round(((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100);

  return (
    <div className="bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar & Numeric Indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Étape {currentStep} sur {WIZARD_STEPS.length} —{" "}
            <span className="text-amber-400 font-bold">
              {WIZARD_STEPS[currentStep - 1]?.name}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-400">
            {percent}% complété
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Step Tabs Grid / Horizontal Scroll */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {WIZARD_STEPS.map((s) => {
            const Icon = s.icon;
            const isCurrent = s.step === currentStep;
            const isCompleted = s.step < currentStep;
            const stepIssues = getStepIssues(s.step);
            const hasError = stepIssues.some((i) => i.severity === "error");
            const hasWarning = stepIssues.some((i) => i.severity === "warning");

            return (
              <button
                key={s.step}
                onClick={() => onStepClick(s.step)}
                className={`relative flex flex-col items-center p-2 rounded-xl transition-all text-center border ${
                  isCurrent
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30"
                    : isCompleted
                    ? "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                    : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-400"
                }`}
              >
                {/* Status Dot / Badge */}
                {hasError && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                    !
                  </span>
                )}
                {!hasError && hasWarning && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                    ▲
                  </span>
                )}

                <div className="flex items-center space-x-1 mb-1">
                  {isCompleted && !hasError ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? "text-amber-400" : ""}`} />
                  )}
                  <span className="text-[11px] font-bold">Étape {s.step}</span>
                </div>

                <span className="text-xs font-semibold truncate w-full">
                  {s.name}
                </span>
                <span className="text-[10px] text-slate-500 truncate w-full hidden sm:block">
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

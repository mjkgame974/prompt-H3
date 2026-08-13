import React, { useState } from "react";
import { CheckCircle2, X, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { ProjectData, ValidationIssue } from "../types/minimax";

interface PreFlightChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  issues?: ValidationIssue[];
}

export const PreFlightChecklist: React.FC<PreFlightChecklistProps> = ({
  isOpen,
  onClose,
  project,
  issues = [],
}) => {
  if (!isOpen) return null;

  const hasStyleContract =
    Boolean(project.styleContract.condensedEnglishSentence) ||
    Boolean(project.styleContract.medium);

  const shotCountOk = project.shots.length <= 3;
  const audioBlockOk =
    project.audioDesign.isSilent ||
    Boolean(project.audioDesign.ambientSound) ||
    Boolean(project.audioDesign.keySFX) ||
    Boolean(project.audioDesign.musicDescription);

  const singleCameraOk = !(issues || []).some((i) => i.id.startsWith("err_double_camera_"));
  const referencesRoleOk = !(issues || []).some((i) => i.id.startsWith("err_ref_no_role_"));
  const negativeConstraintsOk =
    project.negativeConstraints.length >= 3 && project.negativeConstraints.length <= 6;

  const checklistItems = [
    {
      id: "chk_1",
      title: "Contrat de style défini en 1 phrase fixe",
      desc: "L'en-tête contient le médium, le rendu, la texture et l'époque.",
      passed: hasStyleContract,
    },
    {
      id: "chk_2",
      title: "Gestion du rythme (Max 2 à 3 plans sur 10s)",
      desc: "Ne pas surcharger la timeline de trop d'actions courtes.",
      passed: shotCountOk,
    },
    {
      id: "chk_3",
      title: "Un seul mouvement de caméra par plan",
      desc: "Règle stricte MiniMax H3 pour éviter le flou de mouvement.",
      passed: singleCameraOk,
    },
    {
      id: "chk_4",
      title: "Bloc audio explicite obligatoire",
      desc: "Soit bruitages/musique définis, soit 'Audio: Room tone only. No music.'",
      passed: audioBlockOk,
    },
    {
      id: "chk_5",
      title: "Rôle explicite pour chaque référence",
      desc: "Toute image/vidéo a un rôle attribué (produit, ambiance, décor...).",
      passed: referencesRoleOk,
    },
    {
      id: "chk_6",
      title: "3 à 6 contraintes négatives utiles",
      desc: "Exemples : no subtitles, no soft dissolves, no lens flares.",
      passed: negativeConstraintsOk,
    },
  ];

  const totalPassed = checklistItems.filter((item) => item.passed).length;
  const totalItems = checklistItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Checklist de Contrôle Avant Envoi
              </h3>
              <p className="text-xs text-slate-400">
                Validation des règles métier MiniMax H3
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Pill */}
        <div className="my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-300 font-medium">
            Score de conformité H3 :
          </div>
          <div
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              totalPassed === totalItems
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {totalPassed} / {totalItems} règles validées
          </div>
        </div>

        {/* Checklist items list */}
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-start space-x-3 transition ${
                item.passed
                  ? "bg-slate-950/60 border-slate-800/80 text-slate-200"
                  : "bg-rose-950/20 border-rose-900/40 text-slate-300"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <div
                  className={`font-semibold ${
                    item.passed ? "text-slate-200" : "text-rose-200"
                  }`}
                >
                  {item.title}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
          >
            Fermer & Poursuivre
          </button>
        </div>
      </div>
    </div>
  );
};

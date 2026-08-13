import React from "react";
import { ShieldAlert, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { NegativeConstraint, PreservationRules, ProjectData } from "../../types/minimax";

interface Step8ConstraintsProps {
  project: ProjectData;
  onPreservationChange: (rules: PreservationRules) => void;
  onNegativeChange: (constraints: NegativeConstraint[]) => void;
}

const COMMON_NEGATIVES = [
  "no subtitles",
  "no soft dissolves",
  "no lens flares",
  "no extra people",
  "no camera shake",
  "no morphing defects",
  "no watermarks",
  "no cartoon elements",
];

export const Step8Constraints: React.FC<Step8ConstraintsProps> = ({
  project,
  onPreservationChange,
  onNegativeChange,
}) => {
  const preservation = project.preservationRules;
  const negatives = project.negativeConstraints;

  const addNegative = (textToAdd?: string) => {
    const text = textToAdd || "no subtitles";
    if (negatives.some((n) => n.text === text)) return;

    const newNeg: NegativeConstraint = {
      id: `neg_${Date.now()}_${Math.random()}`,
      text,
    };
    onNegativeChange([...negatives, newNeg]);
  };

  const removeNegative = (id: string) => {
    onNegativeChange(negatives.filter((n) => n.id !== id));
  };

  const updateNegativeText = (id: string, newText: string) => {
    onNegativeChange(
      negatives.map((n) => (n.id === id ? { ...n, text: newText } : n))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">
              Étape 8 — Consignes de Préservation & Liste Négative
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Définissez explicitement ce qui doit rester inchangé pendant la génération, et <strong>limitez votre liste négative à 3 à 6 contraintes utiles</strong>. Trop de contraintes négatives risquent de perturber la cohérence créative.
            </p>
          </div>
        </div>
      </div>

      {/* Part 1: Preservation Rules */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <h4 className="font-bold text-xs text-slate-200">
          Éléments à Préservation Explicite
        </h4>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400">
              Ce qui doit rester inchangé tout au long de la vidéo (Invariants)
            </label>
            <input
              type="text"
              value={preservation.elementsToPreserve}
              onChange={(e) =>
                onPreservationChange({
                  ...preservation,
                  elementsToPreserve: e.target.value,
                })
              }
              placeholder="Ex: Conserver la géométrie du flacon, la couleur du verre et le logo doré..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400">
              Pièges et erreurs spécifiques à éviter (Mistakes to avoid)
            </label>
            <input
              type="text"
              value={preservation.mistakesToAvoid}
              onChange={(e) =>
                onPreservationChange({
                  ...preservation,
                  mistakesToAvoid: e.target.value,
                })
              }
              placeholder="Ex: Éviter les déformations du bouchon et les transitions floues..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Part 2: Negative Constraints (3-6 limit) */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-200">
              Liste Négative (3 à 6 contraintes max)
            </h4>
            <p className="text-[11px] text-slate-400">
              Actuellement :{" "}
              <strong
                className={
                  negatives.length >= 3 && negatives.length <= 6
                    ? "text-emerald-400"
                    : "text-amber-400"
                }
              >
                {negatives.length} contrainte(s)
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => addNegative()}
            disabled={negatives.length >= 8}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Interdiction</span>
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Suggestions Rapides :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_NEGATIVES.map((item) => {
              const isAdded = negatives.some((n) => n.text === item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => addNegative(item)}
                  disabled={isAdded}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition ${
                    isAdded
                      ? "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-slate-900 border-slate-800 text-amber-300 hover:border-amber-500/50"
                  }`}
                >
                  + {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Negative list items */}
        <div className="space-y-2 pt-2">
          {negatives.map((neg, idx) => (
            <div
              key={neg.id}
              className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-2"
            >
              <span className="text-[11px] font-mono text-amber-400 w-5 text-center">
                #{idx + 1}
              </span>
              <input
                type="text"
                value={neg.text}
                onChange={(e) => updateNegativeText(neg.id, e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-100 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeNegative(neg.id)}
                className="p-1 text-slate-500 hover:text-rose-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

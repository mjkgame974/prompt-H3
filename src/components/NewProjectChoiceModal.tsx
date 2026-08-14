import React from "react";
import { Sparkles, Pencil, X } from "lucide-react";

interface NewProjectChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseBrief: () => void;
  onChooseManual: () => void;
}

/**
 * Modale "Comment veux-tu démarrer ?" — premier écran du flow Nouveau.
 * L'utilisateur choisit entre :
 *  - 🪄 Démarrer un brief (l'IA pose 2-3 questions puis génère les 9 étapes)
 *  - ✍️ Partir de zéro (wizard classique, on remplit à la main)
 */
export const NewProjectChoiceModal: React.FC<NewProjectChoiceModalProps> = ({
  isOpen,
  onClose,
  onChooseBrief,
  onChooseManual,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-7 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-200 transition rounded-lg hover:bg-slate-800"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            Comment veux-tu démarrer ?
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Choisis ta méthode pour ce nouveau projet H3. Tu pourras affiner
            chaque étape dans tous les cas.
          </p>
        </div>

        {/* 2 choices grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option A : Brief IA */}
          <button
            type="button"
            onClick={onChooseBrief}
            className="text-left p-5 rounded-2xl border-2 border-slate-800 bg-slate-950/60 hover:border-amber-500/60 hover:bg-slate-900 transition group"
          >
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100 group-hover:text-amber-300 transition">
                Démarrer un brief
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Décris ton idée en vrac, l'IA te pose 2-3 questions ciblées,
              puis elle pré-remplit les 9 étapes du wizard. Tu gardes la main
              pour ajuster chaque champ.
            </p>
            <div className="mt-3 inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-indigo-300 group-hover:text-amber-400 transition">
              ⚡ Rapide · 30 secondes
            </div>
          </button>

          {/* Option B : Manuel */}
          <button
            type="button"
            onClick={onChooseManual}
            className="text-left p-5 rounded-2xl border-2 border-slate-800 bg-slate-950/60 hover:border-amber-500/60 hover:bg-slate-900 transition group"
          >
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Pencil className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100 group-hover:text-amber-300 transition">
                Partir de zéro
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Wizard classique, étape par étape. Tu remplis toi-même chaque
              champ des 9 étapes. Idéal si tu sais exactement ce que tu veux
              ou si tu n'as pas de clé Gemini configurée.
            </p>
            <div className="mt-3 inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-amber-400">
              🎯 Contrôle total · 5-10 minutes
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-[11px] text-slate-500 text-center mt-6">
          💡 Astuce : la majorité des utilisateurs commencent par un brief,
          puis ajustent les étapes. Ça va 3x plus vite.
        </p>
      </div>
    </div>
  );
};

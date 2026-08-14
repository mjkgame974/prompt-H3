import React, { useState } from "react";
import { Sparkles, X, ArrowRight, Lightbulb } from "lucide-react";

interface BriefInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (brief: string) => void;
  isProcessing: boolean;
}

const BRIEF_EXAMPLES: { label: string; text: string }[] = [
  {
    label: "Pub parfum luxe",
    text: "Publicité 10 secondes pour un parfum de luxe. Flacon doré sur velours noir, lumière chaude ambrée. Caméra qui orbite lentement autour du flacon. Ambiance mystérieuse, sensuelle, intime. Public cible : femmes 35-50 ans premium. Format 16:9 pour YouTube et site web.",
  },
  {
    label: "Teaser sneakers",
    text: "Teaser 5 secondes pour une marque de sneakers streetwear. Vue urbaine de nuit, néons, un jeune qui court dans la rue. Énergie brute, montage rapide. Format 9:16 pour TikTok et Reels. Public : 18-25 ans, urbain, hip-hop.",
  },
  {
    label: "Court métrage anime",
    text: "Court métrage d'animation 2D de 30 secondes. Un petit robot dans une ville steampunk mélancolique, il pleut, lumières tamisées. Ambiance poétique, douce-amère, couleurs sépia. Public familial. Format 16:9 pour projection en festival.",
  },
];

/**
 * Modale "Décris ton idée de vidéo en vrac".
 * L'utilisateur tape son brief ou clique sur un des 3 exemples pour pré-remplir.
 * Quand il clique "Générer", le brief est envoyé à Gemini pour analyse
 * (→ génère 2-3 questions de clarification).
 */
export const BriefInputModal: React.FC<BriefInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
}) => {
  const [brief, setBrief] = useState("");

  if (!isOpen) return null;

  const handleExampleClick = (text: string) => {
    setBrief(text);
  };

  const handleSubmit = () => {
    if (brief.trim().length < 10) return; // sécurité
    onSubmit(brief.trim());
  };

  const charCount = brief.length;
  const minChars = 10;
  const isValid = charCount >= minChars;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={isProcessing ? undefined : onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-7 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-200 transition rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            Décris ton idée en vrac
          </h2>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          Plus tu donnes de contexte (sujet, ambiance, format, public…), plus
          la pré-remplissage sera précis. Pas besoin d'être parfait.
        </p>

        {/* Textarea */}
        <div className="mb-3">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            disabled={isProcessing}
            placeholder="Ex: Je veux faire une publicité 10s pour un parfum de luxe. Le flacon est doré sur fond noir, la lumière est chaude..."
            rows={8}
            className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition resize-none placeholder:text-slate-600 disabled:opacity-60"
          />
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
            <span>
              {charCount === 0
                ? "Commence à taper, ou clique sur un exemple ci-dessous ↓"
                : charCount < minChars
                ? `Encore ${minChars - charCount} caractères minimum`
                : `${charCount} caractères · ✓`}
            </span>
          </div>
        </div>

        {/* Examples */}
        <div className="mb-6">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Exemples de briefs bien foutus (clique pour utiliser) :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {BRIEF_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => handleExampleClick(ex.text)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 hover:border-amber-500/40 transition disabled:opacity-50"
              >
                ✨ {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
            <span>
              {isProcessing ? "Analyse en cours…" : "Analyser mon brief"}
            </span>
            {!isProcessing && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

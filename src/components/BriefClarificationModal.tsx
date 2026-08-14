import React, { useState } from "react";
import { Sparkles, X, Check, SkipForward, ArrowRight, Loader2 } from "lucide-react";
import type { ClarificationQuestion, ClarificationAnswer } from "../services/gemini";

interface BriefClarificationModalProps {
  isOpen: boolean;
  questions: ClarificationQuestion[];
  onClose: () => void;
  onSubmit: (answers: ClarificationAnswer[]) => void;
  isProcessing: boolean;
  /** Message affiché pendant le processing de la 2e étape */
  processingMessage?: string;
}

/**
 * Modale de clarification : pose 2-3 questions à l'utilisateur avec
 * des choix radio. Chaque question a une option "Choisis pour moi" en fin
 * de liste (allowSkip: true → l'utilisateur peut déléguer la décision à l'IA).
 */
export const BriefClarificationModal: React.FC<BriefClarificationModalProps> = ({
  isOpen,
  questions,
  onClose,
  onSubmit,
  isProcessing,
  processingMessage = "Génération du projet…",
}) => {
  // État local : pour chaque question, on stocke la valeur sélectionnée (ou null)
  const [answers, setAnswers] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    questions.forEach((q) => {
      init[q.id] = null; // null = "Choisis pour moi"
    });
    return init;
  });

  // Reset answers when questions change
  React.useEffect(() => {
    const init: Record<string, string | null> = {};
    questions.forEach((q) => {
      init[q.id] = null;
    });
    setAnswers(init);
  }, [questions]);

  if (!isOpen) return null;

  const handleSelect = (questionId: string, value: string | null) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const formatted: ClarificationAnswer[] = questions.map((q) => ({
      questionId: q.id,
      value: answers[q.id] ?? null,
    }));
    onSubmit(formatted);
  };

  const handleSkipAll = () => {
    const allSkipped: ClarificationAnswer[] = questions.map((q) => ({
      questionId: q.id,
      value: null,
    }));
    onSubmit(allSkipped);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={isProcessing ? undefined : onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-7 sm:p-8 max-h-[90vh] overflow-y-auto"
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
          <h2 className="text-xl font-bold text-slate-100">
            Quelques questions pour préciser
          </h2>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          L'IA a besoin de {questions.length} clarifications pour te générer
          un brief optimal. Tu peux répondre ou laisser l'IA choisir pour toi.
        </p>

        {/* Questions */}
        <div className="space-y-5 mb-6">
          {questions.map((q, qIdx) => (
            <div key={q.id}>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-[11px] font-bold text-indigo-400">
                  {qIdx + 1}.
                </span>
                <h3 className="text-sm font-bold text-slate-100">
                  {q.question}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(q.id, opt.value)}
                      disabled={isProcessing}
                      className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-medium border transition disabled:opacity-60 ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-500 text-amber-200 ring-1 ring-amber-500/30"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                            isSelected
                              ? "border-amber-400 bg-amber-400"
                              : "border-slate-600"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-full h-full rounded-full bg-slate-950 scale-50" />
                          )}
                        </div>
                        <span>{opt.label}</span>
                      </div>
                    </button>
                  );
                })}

                {/* Option "Choisis pour moi" */}
                {q.allowSkip && (
                  <button
                    type="button"
                    onClick={() => handleSelect(q.id, null)}
                    disabled={isProcessing}
                    className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-medium border transition disabled:opacity-60 ${
                      answers[q.id] === null
                        ? "bg-indigo-500/15 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30"
                        : "bg-slate-950 border-slate-800 text-slate-500 hover:border-indigo-500/40 hover:text-indigo-300 border-dashed"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Choisis pour moi</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSkipAll}
            disabled={isProcessing}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition disabled:opacity-40"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Tout passer</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{processingMessage}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Générer le projet</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

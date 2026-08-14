import React from "react";
import { Type, MessageSquare, AlertTriangle, Check, Sparkles } from "lucide-react";
import { WizardContextBox } from "../WizardContextBox";
import { OnScreenText, ProjectData, SpokenDialogue } from "../../types/minimax";

interface Step7TextDialogueProps {
  project: ProjectData;
  onScreenTextChange: (text: OnScreenText) => void;
  spokenDialogueChange: (dialogue: SpokenDialogue) => void;
}

export const Step7TextDialogue: React.FC<Step7TextDialogueProps> = ({
  project,
  onScreenTextChange,
  spokenDialogueChange,
}) => {
  const text = project.onScreenText;
  const dialogue = project.spokenDialogue;

  const isDescriptiveText =
    text.exactString.toLowerCase().includes("un texte") ||
    text.exactString.toLowerCase().includes("qui dit") ||
    text.exactString.toLowerCase().includes("a text that says");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <WizardContextBox
        icon={Type}
        title="Étape 7 — Texte à l'Écran & Dialogues Prononcés"
        description={
          <>
            Dans MiniMax H3, il faut <strong>séparer la typographie incrustée du dialogue vocal</strong>. Le texte incrusté doit être écrit avec la syntaxe stricte <code className="text-amber-300">reading exactly: "..."</code>. Les dialogues vocaux utilisent les balises <code className="text-amber-300 font-mono">&lt;d&gt;[Language] ... &lt;/d&gt;</code>.
          </>
        }
      />

      {/* Part 1: On-Screen Text */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Type className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-xs text-slate-200">
              Texte Incrusté à l'Écran (On-Screen Text)
            </h4>
          </div>

          <button
            type="button"
            onClick={() =>
              onScreenTextChange({ ...text, hasText: !text.hasText })
            }
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              text.hasText
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            {text.hasText ? "Texte à l'Écran : OUI" : "Texte à l'Écran : NON"}
          </button>
        </div>

        {text.hasText && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Chaîne de Caractères Exacte (Casse, Ponctuation, Mots Exacts)
              </label>
              <input
                type="text"
                value={text.exactString}
                onChange={(e) =>
                  onScreenTextChange({ ...text, exactString: e.target.value })
                }
                placeholder="Ex: ESSENCE DE NUIT"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Warning if user writes descriptive meta-language */}
            {isDescriptiveText && (
              <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Attention :</strong> Ne décrivez pas le texte (ex: 'un texte qui dit bonjour'). Inscrivez UNIQUEMENT les mots exacts qui doivent apparaître (ex: 'BONJOUR').
                </span>
              </div>
            )}

            {/* Syntax preview */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-amber-300">
              Syntaxe MiniMax H3 générée :{" "}
              <span className="text-slate-100 font-bold">
                reading exactly: "{text.exactString || "VOTRE TEXTE"}"
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Part 2: Spoken Dialogue */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-xs text-slate-200">
              Dialogue / Voix Off Prononcée (Spoken Dialogue)
            </h4>
          </div>

          <button
            type="button"
            onClick={() =>
              spokenDialogueChange({ ...dialogue, hasDialogue: !dialogue.hasDialogue })
            }
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              dialogue.hasDialogue
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            {dialogue.hasDialogue ? "Dialogue : OUI" : "Dialogue : NON"}
          </button>
        </div>

        {dialogue.hasDialogue && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-400">
                  Langue du Dialogue
                </label>
                <input
                  type="text"
                  value={dialogue.languageCode}
                  onChange={(e) =>
                    spokenDialogueChange({ ...dialogue, languageCode: e.target.value })
                  }
                  placeholder="French, English, Japanese..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400">
                  Phrases Dites Mot pour Mot
                </label>
                <input
                  type="text"
                  value={dialogue.exactLines}
                  onChange={(e) =>
                    spokenDialogueChange({ ...dialogue, exactLines: e.target.value })
                  }
                  placeholder="Ex: Découvrez l'élégance absolue de la nuit."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Syntax preview */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-amber-300">
              Balise Dialogue H3 générée :{" "}
              <span className="text-slate-100 font-bold">
                &lt;d&gt;[{dialogue.languageCode || "French"}] {dialogue.exactLines || "..."}&lt;/d&gt;
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

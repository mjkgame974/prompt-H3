import React from "react";
import { Volume2, VolumeX, Music, Mic, Check } from "lucide-react";
import { WizardContextBox } from "../WizardContextBox";
import { AudioDesign, ProjectData } from "../../types/minimax";

interface Step6AudioProps {
  project: ProjectData;
  onChange: (audioDesign: AudioDesign) => void;
}

export const Step6Audio: React.FC<Step6AudioProps> = ({
  project,
  onChange,
}) => {
  const audio = project.audioDesign;

  const update = (updated: Partial<AudioDesign>) => {
    onChange({ ...audio, ...updated });
  };

  const toggleSilent = (isSilent: boolean) => {
    if (isSilent) {
      update({
        isSilent: true,
        ambientSound: "",
        keySFX: "",
        hasMusic: false,
        musicDescription: "",
        hasVoiceoverOrDialogue: false,
      });
    } else {
      update({ isSilent: false });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <WizardContextBox
        icon={Volume2}
        title="Étape 6 — Design Audio (Bloc Obligatoire)"
        description={
          <>
            Dans MiniMax H3, le bloc audio est <strong>strictement obligatoire</strong>. Si votre vidéo ne contient aucun son, l'application génèrera automatiquement la mention officielle : <code className="text-amber-300">Audio: Room tone only. No music.</code>
          </>
        }
      />

      {/* Silence Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => toggleSilent(false)}
          className={`p-4 rounded-2xl border text-left transition flex items-center space-x-3 ${
            !audio.isSilent
              ? "bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500/30"
              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs">Vidéo Sonorisée</div>
            <div className="text-[11px] text-slate-500">
              Bruitages, musique d'ambiance et/ou voix
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleSilent(true)}
          className={`p-4 rounded-2xl border text-left transition flex items-center space-x-3 ${
            audio.isSilent
              ? "bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500/30"
              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
            <VolumeX className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs">Vidéo Muette (Silence)</div>
            <div className="text-[11px] text-slate-500">
              Génère "Audio: Room tone only. No music."
            </div>
          </div>
        </button>
      </div>

      {/* Audio Detailed Form if not silent */}
      {!audio.isSilent && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          {/* Ambient & SFX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Ambiance Sonore Générale (Ambient Sound)
              </label>
              <input
                type="text"
                value={audio.ambientSound}
                onChange={(e) => update({ ambientSound: e.target.value })}
                placeholder="Ex: Calme de studio avec léger chuchotement d'eau..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Bruitages Clés (Key SFX & Timings)
              </label>
              <input
                type="text"
                value={audio.keySFX}
                onChange={(e) => update({ keySFX: e.target.value })}
                placeholder="Ex: Plouf cristallin à 00:04.000, cliquetis de métal..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Music Setup */}
          <div className="pt-2 border-t border-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Music className="w-4 h-4 text-amber-400" />
                <span>Musique de Fond (Background Music)</span>
              </label>
              <button
                type="button"
                onClick={() => update({ hasMusic: !audio.hasMusic })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  audio.hasMusic
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                {audio.hasMusic ? "Musique : OUI" : "Musique : NON"}
              </button>
            </div>

            {audio.hasMusic && (
              <input
                type="text"
                value={audio.musicDescription}
                onChange={(e) => update({ musicDescription: e.target.value })}
                placeholder="Ex: Nappe synthétique ambiante élégante et profonde avec violoncelle..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          {/* Voice & Intonation Setup */}
          <div className="pt-2 border-t border-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Mic className="w-4 h-4 text-amber-400" />
                <span>Voix Off / Timbre de Voix</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  update({
                    hasVoiceoverOrDialogue: !audio.hasVoiceoverOrDialogue,
                  })
                }
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  audio.hasVoiceoverOrDialogue
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                {audio.hasVoiceoverOrDialogue ? "Voix : OUI" : "Voix : NON"}
              </button>
            </div>

            {audio.hasVoiceoverOrDialogue && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Langue Parlée
                  </label>
                  <input
                    type="text"
                    value={audio.spokenLanguage}
                    onChange={(e) => update({ spokenLanguage: e.target.value })}
                    placeholder="Ex: French, English, Japanese..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Timbre & Intonation (Voice Tone)
                  </label>
                  <input
                    type="text"
                    value={audio.voiceTone}
                    onChange={(e) => update({ voiceTone: e.target.value })}
                    placeholder="Ex: Voix féminine grave, sensuelle et posée..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

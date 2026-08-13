import React from "react";
import { Palette, Sparkles, Check, HelpCircle } from "lucide-react";
import { STYLE_PRESETS, StylePreset } from "../../constants/presets";
import { ProjectData, StyleContract } from "../../types/minimax";

interface Step2StyleContractProps {
  project: ProjectData;
  onChange: (styleContract: StyleContract) => void;
}

export const Step2StyleContract: React.FC<Step2StyleContractProps> = ({
  project,
  onChange,
}) => {
  const style = project.styleContract;

  const updateField = (field: keyof StyleContract, value: string) => {
    const updated = { ...style, [field]: value };

    // Auto-condense into single English sentence if modified
    const condensed = `${updated.medium || ""}, ${updated.texture || ""}, ${
      updated.palette || ""
    }, ${updated.era || ""}, ${updated.visualRendering || ""}.`
      .replace(/,\s*,/g, ",")
      .trim();

    updated.condensedEnglishSentence = condensed;
    onChange(updated);
  };

  /**
   * Update the FPS field. Unlike a generic text field, the FPS is also embedded
   * inside the preset's condensedEnglishSentence (e.g. "…24fps cinematic render…"),
   * so we need to keep that string in sync to avoid a contradictory prompt
   * (where the sentence says one FPS and the "Frame Rate" line says another).
   */
  const updateFps = (newFps: string) => {
    const updated = { ...style, fps: newFps };
    if (updated.condensedEnglishSentence) {
      if (newFps) {
        // Replace any "<n>fps" or "<n>-<m> FPS" pattern with the new value.
        updated.condensedEnglishSentence = updated.condensedEnglishSentence.replace(
          /\b\d+(?:-\d+)?\s*fps\b/gi,
          newFps
        );
      } else {
        // Remove the FPS chunk entirely (e.g. ", 24fps" or " 12-24 FPS")
        // and clean up any leftover empty separator before the next clause.
        updated.condensedEnglishSentence = updated.condensedEnglishSentence
          .replace(/,?\s*\b\d+(?:-\d+)?\s*fps\b/gi, "")
          .replace(/,\s*,/g, ",")
          .replace(/,\s*\./g, ".")
          .replace(/\s{2,}/g, " ")
          .trim();
      }
    }
    onChange(updated);
  };

  const applyPreset = (preset: StylePreset) => {
    onChange({
      medium: preset.medium,
      texture: preset.texture,
      palette: preset.palette,
      era: preset.era,
      visualRendering: preset.visualRendering,
      fps: preset.fps,
      condensedEnglishSentence: preset.condensedEnglish,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">
              Étape 2 — Contrat de Style (L'En-Tête Fixe)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Dans MiniMax H3, le style visuel doit être fixé dès le premier bloc sous forme d'une phrase unique en anglais. Cela garantit que tous les plans suivants partageront une identité esthétique homogène.
            </p>
          </div>
        </div>
      </div>

      {/* Style Presets */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Presets de Styles Prédéfinis</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {STYLE_PRESETS.map((preset) => {
            const isSelected =
              style.condensedEnglishSentence === preset.condensedEnglish;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between group ${
                  isSelected
                    ? "bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500/30"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{preset.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[10px] font-mono text-amber-400/80 mt-1">
                  🎞️ {preset.fps}
                </p>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 italic">
                  {preset.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
        {/* Médium */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            1. Médium & Caméra (Medium)
          </label>
          <input
            type="text"
            value={style.medium}
            onChange={(e) => updateField("medium", e.target.value)}
            placeholder="Ex: Macro studio commercial camera, 35mm film"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
          />
        </div>

        {/* Texture */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            2. Texture (Grain, Reflets, Grain de film)
          </label>
          <input
            type="text"
            value={style.texture}
            onChange={(e) => updateField("texture", e.target.value)}
            placeholder="Ex: flawless metallic sheen, fine organic grain"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
          />
        </div>

        {/* Palette */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            3. Palette de Couleurs (Color Palette)
          </label>
          <input
            type="text"
            value={style.palette}
            onChange={(e) => updateField("palette", e.target.value)}
            placeholder="Ex: gold, obsidian black, warm amber and teal"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
          />
        </div>

        {/* Époque */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            4. Époque / Atmosphère Temporelle (Era)
          </label>
          <input
            type="text"
            value={style.era}
            onChange={(e) => updateField("era", e.target.value)}
            placeholder="Ex: modern luxury advertisement, 1980s retro"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
          />
        </div>

        {/* Rendu visuel */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300">
            5. Rendu Visuel Global (Visual Rendering)
          </label>
          <input
            type="text"
            value={style.visualRendering}
            onChange={(e) => updateField("visualRendering", e.target.value)}
            placeholder="Ex: photorealistic studio lighting with raytraced reflections"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
          />
        </div>

        {/* FPS */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <span>6. Cadence d'Images (Frame Rate)</span>
            <span className="text-[10px] text-slate-500 font-normal">
              — anime le mouvement selon l'esthétique choisie
            </span>
          </label>
          <input
            type="text"
            value={style.fps || ""}
            onChange={(e) => updateFps(e.target.value)}
            placeholder="Ex: 24 FPS (cinéma) · 30 FPS (vidéo) · 60 FPS (smooth) · 12-24 FPS (anime/manga)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Single Sentence English Preview Output */}
      <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl">
        <div className="text-xs font-bold text-amber-400 mb-1 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phrase Unique Récapitulative (Contrat H3 en Anglais) :</span>
        </div>
        <p className="text-xs text-slate-200 font-mono italic leading-relaxed">
          "{style.condensedEnglishSentence || "Aucun style défini"}"
        </p>
      </div>
    </div>
  );
};

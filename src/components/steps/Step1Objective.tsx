import React from "react";
import { Target, Sparkles, Clock, Monitor, Heart, Layers } from "lucide-react";
import { AspectRatio, ProjectData, VideoDuration, VideoGoal, VideoType } from "../../types/minimax";
import { WizardContextBox } from "../WizardContextBox";

interface Step1ObjectiveProps {
  project: ProjectData;
  onChange: (updated: Partial<ProjectData>) => void;
}

const VIDEO_TYPES: { id: VideoType; label: string; desc: string }[] = [
  { id: "pub_produit", label: "Publicité Produit", desc: "Mise en valeur d'un objet, parfum, boisson..." },
  { id: "court_metrage", label: "Court Métrage", desc: "Séquence narrative ou scénarisée" },
  { id: "animation_2d", label: "Animation 2D", desc: "Style anime, dessin animé, sakuga" },
  { id: "trailer", label: "Trailer / Teaser", desc: "Bande-annonce cinématique d'impact" },
  { id: "doublage", label: "Doublage & Lip-Sync", desc: "Focus dialogue et synchronisation labiale" },
  { id: "edition_video", label: "Édition / Transfo", desc: "Modifications style sur vidéo existante" },
  { id: "autre", label: "Autre Création", desc: "Projet sur-mesure" },
];

const VIDEO_GOALS: { id: VideoGoal; label: string }[] = [
  { id: "vendre", label: "Vendre / Promouvoir" },
  { id: "teaser", label: "Créer du Teasing" },
  { id: "raconter", label: "Raconter une Histoire" },
  { id: "demonstrer", label: "Démontrer une Fonction" },
  { id: "annoncer", label: "Annoncer un Événement" },
];

const ASPECT_RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:3", "21:9"];
const DURATIONS: VideoDuration[] = ["5s", "10s", "15s", "30s"];

export const Step1Objective: React.FC<Step1ObjectiveProps> = ({
  project,
  onChange,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro Context Box */}
      <WizardContextBox
        icon={Target}
        title="Étape 1 — Définition du Cadrage & de l'Objectif"
        description="Définissez le cadre général de votre vidéo MiniMax H3. La durée et le format conditionneront automatiquement le découpage en plans lors des étapes suivantes."
      />

      {/* Titre du Projet */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300">
          Nom du Projet Vidéo
        </label>
        <input
          type="text"
          value={project.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex: Publicité Parfum Luxe - Essence de Nuit"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
        />
      </div>

      {/* Type de Vidéo */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-300">
          Type de Vidéo
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {VIDEO_TYPES.map((type) => {
            const isSelected = project.videoType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onChange({ videoType: type.id })}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500/30"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="font-bold text-xs">{type.label}</div>
                <div className="text-[11px] text-slate-500 mt-1">{type.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Objectif principal & Émotion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Objectif */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Objectif Principal
          </label>
          <select
            value={project.videoGoal}
            onChange={(e) => onChange({ videoGoal: e.target.value as VideoGoal })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
          >
            {VIDEO_GOALS.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.label}
              </option>
            ))}
          </select>
        </div>

        {/* Émotion recherchée */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Émotion / Ambiance Recherchée
          </label>
          <input
            type="text"
            value={project.emotion}
            onChange={(e) => onChange({ emotion: e.target.value })}
            placeholder="Ex: Élégance, suspense, sérénité, adrénaline..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Ratio & Durée */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Monitor className="w-3.5 h-3.5 text-amber-400" />
            <span>Format / Ratio d'Image</span>
          </label>
          <div className="flex gap-2">
            {ASPECT_RATIOS.map((ratio) => {
              const isSelected = project.aspectRatio === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => onChange({ aspectRatio: ratio })}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ratio}
                </button>
              );
            })}
          </div>
        </div>

        {/* Durée */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Durée Cible (5s · 10s · 15s · 30s)</span>
          </label>
          <div className="flex gap-2">
            {DURATIONS.map((dur) => {
              const isSelected = project.duration === dur;
              return (
                <button
                  key={dur}
                  type="button"
                  onClick={() => onChange({ duration: dur })}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {dur}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Camera, AlertCircle, ShieldAlert, Check } from "lucide-react";
import {
  ANGLE_TRANSLATIONS,
  FRAMING_TRANSLATIONS,
  MOTION_TRANSLATIONS,
  SPEED_TRANSLATIONS,
} from "../../utils/translator";
import {
  CameraAngle,
  CameraDirection,
  CameraMotion,
  FramingType,
  MotionSpeed,
  ProjectData,
} from "../../types/minimax";

interface Step5CameraProps {
  project: ProjectData;
  onChange: (cameraMap: Record<string, CameraDirection>) => void;
}

const FRAMINGS: { id: FramingType; label: string; desc: string }[] = [
  { id: "medium", label: "Plan Moyen", desc: "Sujet cadré à mi-corps ou objet centré" },
  { id: "close_up", label: "Gros Plan", desc: "Focus sur le visage ou le produit" },
  { id: "extreme_close_up", label: "Très Gros Plan", desc: "Détail macro (goutte, texture, gravure)" },
  { id: "wide", label: "Plan Large", desc: "Décor et contexte global" },
  { id: "establishing", label: "Plan d'Ensemble", desc: "Vue générale du lieu" },
];

const ANGLES: { id: CameraAngle; label: string }[] = [
  { id: "eye_level", label: "Hauteur d'Yeux (Neutre)" },
  { id: "low_angle", label: "Contre-Plongée (Majestueux)" },
  { id: "high_angle", label: "Plongée (Vue du dessus)" },
  { id: "birds_eye", label: "Vue Aérienne (Survol)" },
  { id: "dutch_angle", label: "Angle Cassé (Tension)" },
];

const MOTIONS: { id: CameraMotion; label: string; desc: string }[] = [
  { id: "static", label: "Fixe (Caméra Immobile)", desc: "Pas de mouvement" },
  { id: "tracking_forward", label: "Travelling Avant", desc: "Avance vers le sujet" },
  { id: "tracking_backward", label: "Travelling Arrière", desc: "Recule du sujet" },
  { id: "panning_left", label: "Panoramique Gauche", desc: "Balayage horizontal vers la gauche" },
  { id: "panning_right", label: "Panoramique Droite", desc: "Balayage horizontal vers la droite" },
  { id: "orbit", label: "Orbit Autour du Sujet", desc: "Mouvement circulaire continu" },
  { id: "crane_up", label: "Grue Montante", desc: "Élévation verticale de la caméra" },
  { id: "crane_down", label: "Grue Descendante", desc: "Descente verticale" },
  { id: "handheld", label: "Porté Épaule Naturel", desc: "Légère vibration organique" },
  { id: "zoom_in", label: "Zoom Avant Optique", desc: "Rapprochement focal" },
  { id: "zoom_out", label: "Zoom Arrière Optique", desc: "Élargissement focal" },
];

const SPEEDS: { id: MotionSpeed; label: string }[] = [
  { id: "subtle", label: "Subtil & Lent" },
  { id: "smooth", label: "Fluide & Régulier" },
  { id: "fast", label: "Rapide" },
  { id: "dynamic", label: "Dynamique Variable" },
];

export const Step5Camera: React.FC<Step5CameraProps> = ({
  project,
  onChange,
}) => {
  const cameraDirections = project.cameraDirections || {};

  const updateCameraForShot = (
    shotId: string,
    updated: Partial<CameraDirection>
  ) => {
    const current = cameraDirections[shotId] || {
      shotId,
      framing: "medium",
      angle: "eye_level",
      motion: "static",
      speed: "subtle",
    };

    const newMap = {
      ...cameraDirections,
      [shotId]: { ...current, ...updated },
    };

    onChange(newMap);
  };

  const handleSelectMotion = (
    shotId: string,
    selectedMotion: CameraMotion
  ) => {
    const current = cameraDirections[shotId];

    // If user attempts to select a second motion when one is already active (different from current and static)
    if (
      current &&
      current.motion !== "static" &&
      selectedMotion !== "static" &&
      current.motion !== selectedMotion
    ) {
      // Trigger warning flag for secondary motion attempt
      updateCameraForShot(shotId, {
        secondaryMotionAttempt: selectedMotion,
      });
      return;
    }

    // Otherwise clear secondary motion attempt and apply single motion
    updateCameraForShot(shotId, {
      motion: selectedMotion,
      secondaryMotionAttempt: null,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">
              Étape 5 — Mouvements de Caméra (Règle Stricte : 1 Seul Mouvement)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Pour garantir la stabilité du modèle MiniMax H3 et éviter les déformations visuelles, <strong>un SEUL mouvement de caméra est autorisé par plan</strong>. Toute combinaison de deux mouvements simultanés sera bloquée.
            </p>
          </div>
        </div>
      </div>

      {/* Per Shot Camera Setup */}
      <div className="space-y-6">
        {project.shots.map((shot) => {
          const cam = cameraDirections[shot.id] || {
            shotId: shot.id,
            framing: "medium",
            angle: "eye_level",
            motion: "static",
            speed: "subtle",
          };

          const hasDoubleMotionError = Boolean(cam.secondaryMotionAttempt);

          return (
            <div
              key={shot.id}
              className={`p-5 rounded-2xl border transition space-y-4 ${
                hasDoubleMotionError
                  ? "bg-rose-950/20 border-rose-800 ring-1 ring-rose-500/50"
                  : "bg-slate-950 border-slate-800"
              }`}
            >
              {/* Header Shot info */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                    Plan {shot.shotNumber}
                  </span>
                  <span className="font-bold text-xs text-slate-200">
                    {shot.visualDescription.substring(0, 60)}...
                  </span>
                </div>
              </div>

              {/* Alert if user tried 2 camera motions */}
              {hasDoubleMotionError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      <strong>Règle H3 :</strong> Impossible d'ajouter "{MOTION_TRANSLATIONS[cam.secondaryMotionAttempt!]}". Un seul mouvement caméra par plan !
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      updateCameraForShot(shot.id, { secondaryMotionAttempt: null })
                    }
                    className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold"
                  >
                    Effacer
                  </button>
                </div>
              )}

              {/* Framing & Angle selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Framing */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Cadrage / Valeur de Plan (Framing)
                  </label>
                  <select
                    value={cam.framing}
                    onChange={(e) =>
                      updateCameraForShot(shot.id, {
                        framing: e.target.value as FramingType,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {FRAMINGS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label} — ({f.desc})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Angle */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Angle de Prise de Vue (Camera Angle)
                  </label>
                  <select
                    value={cam.angle}
                    onChange={(e) =>
                      updateCameraForShot(shot.id, {
                        angle: e.target.value as CameraAngle,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {ANGLES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Camera Motion Selector (Grid) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Mouvement Caméra (Sélectionnez STRICTEMENT 1 seul mouvement)</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Actuel : {MOTION_TRANSLATIONS[cam.motion]}
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {MOTIONS.map((m) => {
                    const isSelected = cam.motion === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMotion(shot.id, m.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500/30 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{m.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speed selector */}
              {cam.motion !== "static" && (
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Vitesse & Amplitude du Mouvement
                  </label>
                  <div className="flex gap-2">
                    {SPEEDS.map((sp) => {
                      const isSelected = cam.speed === sp.id;
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() =>
                            updateCameraForShot(shot.id, {
                              speed: sp.id as MotionSpeed,
                            })
                          }
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-xs transition ${
                            isSelected
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {sp.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

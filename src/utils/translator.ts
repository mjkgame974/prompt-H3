import { CameraAngle, CameraMotion, FramingType, MotionSpeed } from "../types/minimax";

export const FRAMING_TRANSLATIONS: Record<FramingType, string> = {
  wide: "Wide shot",
  medium: "Medium shot",
  close_up: "Close-up",
  extreme_close_up: "Extreme close-up",
  establishing: "Establishing shot",
};

export const ANGLE_TRANSLATIONS: Record<CameraAngle, string> = {
  eye_level: "Eye level angle",
  low_angle: "Low angle shot",
  high_angle: "High angle shot",
  birds_eye: "Bird's eye aerial view",
  dutch_angle: "Dutch tilted angle",
};

export const MOTION_TRANSLATIONS: Record<CameraMotion, string> = {
  static: "Static locked camera",
  tracking_forward: "Tracking shot forward",
  tracking_backward: "Tracking shot backward",
  panning_left: "Slow panning left",
  panning_right: "Slow panning right",
  orbit: "Orbiting smoothly around subject",
  crane_up: "Jib crane shot rising up",
  crane_down: "Jib crane shot lowering down",
  handheld: "Subtle organic handheld camera move",
  zoom_in: "Smooth optical zoom in",
  zoom_out: "Smooth optical zoom out",
};

export const SPEED_TRANSLATIONS: Record<MotionSpeed, string> = {
  subtle: "subtle velocity",
  smooth: "smooth steady speed",
  fast: "fast dynamic movement",
  dynamic: "energetic variable pacing",
};

// ----- French translations (used by compileFrenchPrompt) -----

export const FRAMING_TRANSLATIONS_FR: Record<FramingType, string> = {
  wide: "Plan large",
  medium: "Plan moyen",
  close_up: "Gros plan",
  extreme_close_up: "Très gros plan",
  establishing: "Plan d'ensemble",
};

export const ANGLE_TRANSLATIONS_FR: Record<CameraAngle, string> = {
  eye_level: "À hauteur d'œil",
  low_angle: "Contre-plongée",
  high_angle: "Plongée",
  birds_eye: "Vue aérienne (plongée totale)",
  dutch_angle: "Angle incliné (hollandais)",
};

export const MOTION_TRANSLATIONS_FR: Record<CameraMotion, string> = {
  static: "Caméra fixe",
  tracking_forward: "Travelling avant",
  tracking_backward: "Travelling arrière",
  panning_left: "Panoramique vers la gauche",
  panning_right: "Panoramique vers la droite",
  orbit: "Orbite autour du sujet",
  crane_up: "Grue qui monte",
  crane_down: "Grue qui descend",
  handheld: "Caméra à l'épaule (légère)",
  zoom_in: "Zoom avant",
  zoom_out: "Zoom arrière",
};

export const SPEED_TRANSLATIONS_FR: Record<MotionSpeed, string> = {
  subtle: "à vitesse subtile",
  smooth: "à vitesse fluide et régulière",
  fast: "à vitesse rapide et dynamique",
  dynamic: "au rythme variable et énergique",
};

/**
 * Basic heuristic French to English translator for common video terms
 */
export function translateFrenchToEnglish(text: string): string {
  if (!text || text.trim() === "") return "";

  let res = text;

  // Simple dictionary replacements for common prompt words
  const dict: [RegExp, string][] = [
    [/un flacon de parfum/gi, "a luxury perfume bottle"],
    [/un personnage/gi, "a character"],
    [/une personne/gi, "a person"],
    [/un homme/gi, "a man"],
    [/une femme/gi, "a woman"],
    [/un produit/gi, "a product"],
    [/un voiture/gi, "a car"],
    [/une voiture/gi, "a car"],
    [/un vaisseau/gi, "a spaceship"],
    [/sur une surface/gi, "on a surface"],
    [/noir/gi, "black"],
    [/noire/gi, "black"],
    [/blanc/gi, "white"],
    [/blanche/gi, "white"],
    [/rouge/gi, "red"],
    [/bleu/gi, "blue"],
    [/doré/gi, "gold"],
    [/dorée/gi, "gold"],
    [/argenté/gi, "silver"],
    [/lumière/gi, "light"],
    [/brume/gi, "mist"],
    [/fumée/gi, "smoke"],
    [/eau/gi, "water"],
    [/goutte/gi, "drop"],
    [/gouttes/gi, "drops"],
    [/ralenti/gi, "slow motion"],
    [/studio/gi, "studio"],
    [/fond/gi, "background"],
    [/gros plan/gi, "close-up"],
    [/plan large/gi, "wide shot"],
    [/mouvement/gi, "movement"],
    [/caméra/gi, "camera"],
    [/musique/gi, "music"],
    [/voix/gi, "voice"],
    [/dialogue/gi, "dialogue"],
    [/texte/gi, "text"],
  ];

  for (const [pattern, replacement] of dict) {
    res = res.replace(pattern, replacement);
  }

  return res;
}

import { ProjectData } from "../../types/minimax";

/**
 * A complete, valid MiniMax H3 project fixture — a "Publicité Parfum Luxe" example
 * that should produce no validation errors. Self-contained (does not depend on
 * INITIAL_PROJECT_DATA, so tests stay stable even when the default project is
 * emptied).
 */
export const validPerfumeProject: ProjectData = {
  id: "proj_test_fixture",
  title: "Test Perfume Ad",
  step: 9,
  videoType: "pub_produit",
  videoGoal: "vendre",
  emotion: "Élégance, modernité et désir",
  aspectRatio: "16:9",
  duration: "10s",
  styleContract: {
    medium: "Macro studio commercial camera",
    texture: "flawless metallic sheen, razor-sharp focus, liquid refraction",
    palette: "gold, obsidian black, crisp silver accent",
    era: "modern premium luxury advertisement",
    visualRendering: "photorealistic studio lighting with raytraced reflections",
    condensedEnglishSentence:
      "Macro studio commercial camera, flawless metallic sheen with razor-sharp focus and liquid refraction, gold and obsidian black palette, modern premium luxury advertisement, photorealistic studio lighting with raytraced reflections.",
  },
  references: [
    {
      id: "ref1",
      name: "Flacon Noir Gold",
      role: "produit",
      definesText: "Forme octogonale et bouchon doré",
      preserveText: "Conserver le logo gravé intact",
      url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539",
    },
  ],
  shots: [
    {
      id: "shot_1",
      shotNumber: 1,
      visualDescription: "Un flacon élégant sur du marbre noir",
      subjectAction: "Révélation lente",
      atmosphere: "Lumière dorée tamisée",
    },
    {
      id: "shot_2",
      shotNumber: 2,
      timestamp: "00:05.000",
      visualDescription: "Des gouttes d'eau perlent sur le verre",
      subjectAction: "Macro-gros plan",
      atmosphere: "Éclats scintillants",
    },
  ],
  cameraDirections: {
    shot_1: {
      shotId: "shot_1",
      framing: "medium",
      angle: "low_angle",
      motion: "tracking_forward",
      speed: "subtle",
    },
    shot_2: {
      shotId: "shot_2",
      framing: "close_up",
      angle: "eye_level",
      motion: "static",
      speed: "subtle",
    },
  },
  audioDesign: {
    isSilent: false,
    ambientSound: "Calme de studio avec souffle d'eau très discret",
    keySFX: "Goutte d'eau cristalline à 00:05.000",
    hasMusic: true,
    musicDescription: "Nappe synthétique profonde et raffinée",
    hasVoiceoverOrDialogue: false,
    voiceType: "none",
    spokenLanguage: "French",
    voiceTone: "",
  },
  onScreenText: {
    hasText: true,
    exactString: "PURE LUXURY",
    isExactFormat: true,
  },
  spokenDialogue: {
    hasDialogue: false,
    languageCode: "French",
    exactLines: "",
  },
  preservationRules: {
    elementsToPreserve: "Garder la forme du flacon et la gravure sur le bouchon.",
    mistakesToAvoid: "Pas de reflets flous ni de texte déformé.",
  },
  negativeConstraints: [
    { id: "neg_1", text: "no subtitles" },
    { id: "neg_2", text: "no soft dissolves" },
    { id: "neg_3", text: "no lens flares" },
    { id: "neg_4", text: "no extra people" },
  ],
};

/**
 * A 5-second project fixture (used to test shot count rules).
 */
export const short5sProject: ProjectData = {
  ...validPerfumeProject,
  duration: "5s",
  shots: [validPerfumeProject.shots[0]],
  cameraDirections: {
    [validPerfumeProject.shots[0].id]: validPerfumeProject.cameraDirections[validPerfumeProject.shots[0].id],
  },
};

/**
 * A project with no audio configured (used to test the mandatory audio block rule).
 */
export const projectWithoutAudio: ProjectData = {
  ...validPerfumeProject,
  audioDesign: {
    ...validPerfumeProject.audioDesign,
    isSilent: false,
    ambientSound: "",
    keySFX: "",
    musicDescription: "",
    hasMusic: false,
    hasVoiceoverOrDialogue: false,
  },
};

/**
 * A project with double camera motion (used to test the single-motion rule).
 */
export const projectWithDoubleCamera: ProjectData = {
  ...validPerfumeProject,
  cameraDirections: {
    ...validPerfumeProject.cameraDirections,
    [validPerfumeProject.shots[0].id]: {
      ...validPerfumeProject.cameraDirections[validPerfumeProject.shots[0].id],
      secondaryMotionAttempt: "zoom_in",
    },
  },
};

/**
 * A truly empty project — what the user sees on first launch (or after
 * "Nouveau projet"). Used to verify the empty state compiles cleanly.
 */
export const emptyProject: ProjectData = {
  id: "proj_empty",
  title: "",
  step: 1,
  videoType: "pub_produit",
  videoGoal: "vendre",
  emotion: "",
  aspectRatio: "16:9",
  duration: "10s",
  styleContract: {
    medium: "",
    texture: "",
    palette: "",
    era: "",
    visualRendering: "",
    condensedEnglishSentence: "",
  },
  references: [],
  shots: [],
  cameraDirections: {},
  audioDesign: {
    isSilent: true,
    ambientSound: "",
    keySFX: "",
    hasMusic: false,
    musicDescription: "",
    hasVoiceoverOrDialogue: false,
    voiceType: "none",
    spokenLanguage: "French",
    voiceTone: "",
  },
  onScreenText: { hasText: false, exactString: "", isExactFormat: true },
  spokenDialogue: { hasDialogue: false, languageCode: "French", exactLines: "" },
  preservationRules: { elementsToPreserve: "", mistakesToAvoid: "" },
  negativeConstraints: [
    { id: "neg_1", text: "no subtitles" },
    { id: "neg_2", text: "no soft dissolves" },
    { id: "neg_3", text: "no lens flares" },
  ],
};

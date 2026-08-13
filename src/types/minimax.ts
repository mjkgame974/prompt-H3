export type VideoType =
  | "pub_produit"
  | "court_metrage"
  | "animation_2d"
  | "trailer"
  | "doublage"
  | "edition_video"
  | "autre";

export type VideoGoal =
  | "vendre"
  | "teaser"
  | "raconter"
  | "demonstrer"
  | "annoncer";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "21:9";

export type VideoDuration = "5s" | "10s" | "15s" | "30s";

export type ReferenceRole =
  | "ambiance"
  | "personnage"
  | "produit"
  | "decor"
  | "logo"
  | "style"
  | "autre";

export interface ReferenceItem {
  id: string;
  name: string;
  url?: string;
  previewUrl?: string;
  role: ReferenceRole;
  definesText: string; // Ce qu'elle définit (ex: "La forme et la couleur du flacon")
  preserveText: string; // Ce qu'il faut préserver exactement (ex: "Conserver l'étiquette dorée intacte")
}

export interface Shot {
  id: string;
  shotNumber: number;
  timestamp?: string; // Ex: "00:04.000" pour plan 2+
  visualDescription: string; // Ce qu'on voit
  subjectAction: string; // Ce que fait le sujet
  atmosphere: string; // Ambiance visuelle
  transition?: string; // Transition vers ce plan
}

export type FramingType =
  | "wide" // Plan large / Wide shot
  | "medium" // Plan moyen / Medium shot
  | "close_up" // Gros plan / Close-up
  | "extreme_close_up" // Très gros plan / Extreme close-up
  | "establishing"; // Plan d'ensemble

export type CameraAngle =
  | "eye_level" // Hauteur d'yeux
  | "low_angle" // Contre-plongée
  | "high_angle" // Plongée
  | "birds_eye" // Vue aérienne / Survol
  | "dutch_angle"; // Angle cassé

export type CameraMotion =
  | "static" // Fixe
  | "tracking_forward" // Travelling avant
  | "tracking_backward" // Travelling arrière
  | "panning_left" // Panoramique gauche
  | "panning_right" // Panoramique droite
  | "orbit" // Orbit autour du sujet
  | "crane_up" // Grue haut
  | "crane_down" // Grue bas
  | "handheld" // Porté épaule
  | "zoom_in" // Zoom avant
  | "zoom_out"; // Zoom arrière

export type MotionSpeed = "subtle" | "smooth" | "fast" | "dynamic";

export interface CameraDirection {
  shotId: string;
  framing: FramingType;
  angle: CameraAngle;
  motion: CameraMotion;
  speed: MotionSpeed;
  secondaryMotionAttempt?: CameraMotion | null; // Pour détecter la tentative de double mouvement
}

export interface AudioDesign {
  isSilent: boolean; // Si oui -> "Audio: Room tone only. No music."
  ambientSound: string; // Bruitages / ambiance par plan
  keySFX: string; // Bruitages clés
  hasMusic: boolean;
  musicDescription: string; // Type de musique
  hasVoiceoverOrDialogue: boolean;
  voiceType: "voiceover" | "dialogue" | "both" | "none";
  spokenLanguage: string;
  voiceTone: string; // Timbre / intonation
}

export interface OnScreenText {
  hasText: boolean;
  exactString: string; // Chaîne exacte (ex: "SUMMER SALE 50%")
  isExactFormat: boolean; // Vérifie la syntaxe reading exactly: "..."
  descriptiveWarning?: boolean; // Alerte si l'utilisateur décrit le texte au lieu de le citer
}

export interface SpokenDialogue {
  hasDialogue: boolean;
  languageCode: string; // Ex: "French", "English"
  exactLines: string; // Textes prononcés
}

export interface PreservationRules {
  elementsToPreserve: string; // Ce qui doit rester inchangé
  mistakesToAvoid: string; // Erreurs à éviter
}

export interface NegativeConstraint {
  id: string;
  text: string; // Ex: "no subtitles", "no soft dissolves"
}

export interface StyleContract {
  medium: string; // Ex: "35mm film", "3D CGI", "2D Animation"
  texture: string; // Ex: "rich film grain", "hyper-detailed metallic gloss"
  palette: string; // Ex: "warm amber and teal", "monochrome neon"
  era: string; // Ex: "1980s retro", "contemporary luxury"
  visualRendering: string; // Ex: "ultra-realistic photorealistic render"
  fps?: string; // Ex: "24 FPS", "60 FPS", "12-24 FPS" — frame rate cible
  condensedEnglishSentence: string; // Phrase unique générée en anglais
}

export interface ProjectData {
  id: string;
  title: string;
  step: number; // 1 à 9
  videoType: VideoType;
  videoGoal: VideoGoal;
  emotion: string;
  aspectRatio: AspectRatio;
  duration: VideoDuration;
  styleContract: StyleContract;
  references: ReferenceItem[];
  shots: Shot[];
  cameraDirections: Record<string, CameraDirection>; // Map shotId -> CameraDirection
  audioDesign: AudioDesign;
  onScreenText: OnScreenText;
  spokenDialogue: SpokenDialogue;
  preservationRules: PreservationRules;
  negativeConstraints: NegativeConstraint[];
  generatedPrompt?: string;
  optimizedPrompt?: string;
  test5sPrompt?: string;
  aiSuggestions?: string[];
  lastModifiedAt?: string;
  h3Score?: number;
}

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  step: number;
  field?: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
  fixActionLabel?: string;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  data: Partial<ProjectData>;
}

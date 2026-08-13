import { H3ProjectExport, MigrationSummary } from "../types/project";
import { ProjectData } from "../types/minimax";
import { INITIAL_PROJECT_DATA } from "../constants/presets";

export const CURRENT_SCHEMA_VERSION = "1.0.0";
export const CURRENT_APP_VERSION = "1.0.0";

/**
 * Migration pipeline converting any incoming JSON raw data to the canonical H3ProjectExport (v1.0.0).
 */
export function migrateProjectSchema(raw: any): {
  exportPayload: H3ProjectExport;
  summary: MigrationSummary;
} {
  const notes: string[] = [];
  const unrecoverableFields: string[] = [];

  let rawVersion = raw?.schemaVersion || "0.9.0"; // default for legacy unversioned files
  let currentObj = { ...raw };

  let migrationApplied = false;

  // Migration Step 1: Legacy (0.x.x) to 1.0.0
  if (rawVersion < "1.0.0" || !raw?.schemaVersion) {
    notes.push("Détection d'un fichier JSON legacy/sans version schemaVersion.");
    currentObj = migrateV0ToV1(currentObj, notes);
    migrationApplied = true;
    rawVersion = "1.0.0";
  }

  // Future migration steps (e.g. 1.0.0 -> 2.0.0) can be added here
  // if (rawVersion < "2.0.0") { currentObj = migrateV1ToV2(currentObj, notes); }

  const finalProjectData = ensureProjectDataDefaults(
    currentObj.project || currentObj.projectData || currentObj
  );

  const exportPayload: H3ProjectExport = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appName: "MiniMax H3 Assistant",
    appVersion: CURRENT_APP_VERSION,
    exportedAt: currentObj.exportedAt || new Date().toISOString(),
    projectId: currentObj.projectId || finalProjectData.id || `proj_${Date.now()}`,
    projectName: currentObj.projectName || finalProjectData.title || "Projet Sans Titre",
    lastModifiedAt: currentObj.lastModifiedAt || finalProjectData.lastModifiedAt || new Date().toISOString(),
    compatibility: {
      minAppVersion: "1.0.0",
      exportedWith: currentObj.appVersion || CURRENT_APP_VERSION,
      migrationRequired: migrationApplied,
    },
    project: finalProjectData,
  };

  const summary: MigrationSummary = {
    fromVersion: raw?.schemaVersion || "0.9.0 (Legacy)",
    toVersion: CURRENT_SCHEMA_VERSION,
    migrationApplied,
    notes,
    unrecoverableFields,
  };

  return { exportPayload, summary };
}

/**
 * Migration function from Legacy (v0.x) to v1.0.0
 */
export function migrateV0ToV1(raw: any, notes: string[]): any {
  notes.push("Structure convertie vers le schéma standard v1.0.0 de MiniMax H3.");

  // Extract raw project object if it was wrapped in older format
  const rawProj = raw?.projectData || raw?.project || raw;

  const migratedProj: Partial<ProjectData> = {
    id: rawProj?.id || raw?.projectId || `proj_${Date.now()}`,
    title: rawProj?.title || raw?.projectName || "Projet Importé",
    step: typeof rawProj?.step === "number" ? rawProj.step : 1,
    videoType: rawProj?.videoType || INITIAL_PROJECT_DATA.videoType,
    videoGoal: rawProj?.videoGoal || INITIAL_PROJECT_DATA.videoGoal,
    emotion: rawProj?.emotion || INITIAL_PROJECT_DATA.emotion,
    aspectRatio: rawProj?.aspectRatio || INITIAL_PROJECT_DATA.aspectRatio,
    duration: rawProj?.duration || INITIAL_PROJECT_DATA.duration,
    styleContract: {
      medium: rawProj?.styleContract?.medium || INITIAL_PROJECT_DATA.styleContract.medium,
      texture: rawProj?.styleContract?.texture || INITIAL_PROJECT_DATA.styleContract.texture,
      palette: rawProj?.styleContract?.palette || INITIAL_PROJECT_DATA.styleContract.palette,
      era: rawProj?.styleContract?.era || INITIAL_PROJECT_DATA.styleContract.era,
      visualRendering:
        rawProj?.styleContract?.visualRendering ||
        INITIAL_PROJECT_DATA.styleContract.visualRendering,
      condensedEnglishSentence:
        rawProj?.styleContract?.condensedEnglishSentence ||
        rawProj?.styleContract?.condensedEnglish ||
        INITIAL_PROJECT_DATA.styleContract.condensedEnglishSentence,
    },
    references: Array.isArray(rawProj?.references)
      ? rawProj.references.map((r: any) => ({
          id: r.id || `ref_${Math.random()}`,
          name: r.name || r.label || "Référence",
          role: r.role || "produit",
          definesText: r.definesText || r.defines || "",
          preserveText: r.preserveText || (Array.isArray(r.preserve) ? r.preserve.join(", ") : ""),
          url: r.url,
          previewUrl: r.previewUrl,
        }))
      : [],
    shots: Array.isArray(rawProj?.shots) ? rawProj.shots : INITIAL_PROJECT_DATA.shots,
    cameraDirections:
      rawProj?.cameraDirections && typeof rawProj.cameraDirections === "object"
        ? rawProj.cameraDirections
        : INITIAL_PROJECT_DATA.cameraDirections,
    audioDesign: {
      isSilent: rawProj?.audioDesign?.isSilent ?? false,
      ambientSound: rawProj?.audioDesign?.ambientSound || "",
      keySFX: rawProj?.audioDesign?.keySFX || "",
      hasMusic: rawProj?.audioDesign?.hasMusic ?? false,
      musicDescription: rawProj?.audioDesign?.musicDescription || "",
      hasVoiceoverOrDialogue: rawProj?.audioDesign?.hasVoiceoverOrDialogue ?? false,
      voiceType: rawProj?.audioDesign?.voiceType || "none",
      spokenLanguage: rawProj?.audioDesign?.spokenLanguage || "French",
      voiceTone: rawProj?.audioDesign?.voiceTone || "",
    },
    onScreenText: {
      hasText: rawProj?.onScreenText?.hasText ?? false,
      exactString: rawProj?.onScreenText?.exactString || "",
      isExactFormat: rawProj?.onScreenText?.isExactFormat ?? true,
    },
    spokenDialogue: {
      hasDialogue: rawProj?.spokenDialogue?.hasDialogue ?? false,
      languageCode: rawProj?.spokenDialogue?.languageCode || "French",
      exactLines: rawProj?.spokenDialogue?.exactLines || "",
    },
    preservationRules: {
      elementsToPreserve: rawProj?.preservationRules?.elementsToPreserve || "",
      mistakesToAvoid: rawProj?.preservationRules?.mistakesToAvoid || "",
    },
    negativeConstraints: Array.isArray(rawProj?.negativeConstraints)
      ? rawProj.negativeConstraints
      : INITIAL_PROJECT_DATA.negativeConstraints,
    generatedPrompt: rawProj?.generatedPrompt,
    optimizedPrompt: rawProj?.optimizedPrompt,
    test5sPrompt: rawProj?.test5sPrompt,
    lastModifiedAt: rawProj?.lastModifiedAt || new Date().toISOString(),
  };

  return {
    schemaVersion: "1.0.0",
    appName: "MiniMax H3 Assistant",
    appVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    projectId: migratedProj.id,
    projectName: migratedProj.title,
    lastModifiedAt: migratedProj.lastModifiedAt,
    project: migratedProj,
  };
}

/**
 * Guarantees that all required properties exist in ProjectData to prevent runtime crashes.
 */
function ensureProjectDataDefaults(data: any): ProjectData {
  return {
    id: data.id || `proj_${Date.now()}`,
    title: data.title || "Projet Sans Titre",
    step: typeof data.step === "number" ? Math.min(Math.max(data.step, 1), 9) : 1,
    videoType: data.videoType || INITIAL_PROJECT_DATA.videoType,
    videoGoal: data.videoGoal || INITIAL_PROJECT_DATA.videoGoal,
    emotion: data.emotion || INITIAL_PROJECT_DATA.emotion,
    aspectRatio: data.aspectRatio || INITIAL_PROJECT_DATA.aspectRatio,
    duration: data.duration || INITIAL_PROJECT_DATA.duration,
    styleContract: {
      medium: data.styleContract?.medium || INITIAL_PROJECT_DATA.styleContract.medium,
      texture: data.styleContract?.texture || INITIAL_PROJECT_DATA.styleContract.texture,
      palette: data.styleContract?.palette || INITIAL_PROJECT_DATA.styleContract.palette,
      era: data.styleContract?.era || INITIAL_PROJECT_DATA.styleContract.era,
      visualRendering:
        data.styleContract?.visualRendering ||
        INITIAL_PROJECT_DATA.styleContract.visualRendering,
      condensedEnglishSentence:
        data.styleContract?.condensedEnglishSentence ||
        data.styleContract?.condensedEnglish ||
        INITIAL_PROJECT_DATA.styleContract.condensedEnglishSentence,
    },
    references: Array.isArray(data.references) ? data.references : [],
    shots: Array.isArray(data.shots) ? data.shots : [],
    cameraDirections:
      data.cameraDirections && typeof data.cameraDirections === "object"
        ? data.cameraDirections
        : {},
    audioDesign: {
      isSilent: data.audioDesign?.isSilent ?? false,
      ambientSound: data.audioDesign?.ambientSound || "",
      keySFX: data.audioDesign?.keySFX || "",
      hasMusic: data.audioDesign?.hasMusic ?? false,
      musicDescription: data.audioDesign?.musicDescription || "",
      hasVoiceoverOrDialogue: data.audioDesign?.hasVoiceoverOrDialogue ?? false,
      voiceType: data.audioDesign?.voiceType || "none",
      spokenLanguage: data.audioDesign?.spokenLanguage || "French",
      voiceTone: data.audioDesign?.voiceTone || "",
    },
    onScreenText: {
      hasText: data.onScreenText?.hasText ?? false,
      exactString: data.onScreenText?.exactString || "",
      isExactFormat: data.onScreenText?.isExactFormat ?? true,
    },
    spokenDialogue: {
      hasDialogue: data.spokenDialogue?.hasDialogue ?? false,
      languageCode: data.spokenDialogue?.languageCode || "French",
      exactLines: data.spokenDialogue?.exactLines || "",
    },
    preservationRules: {
      elementsToPreserve: data.preservationRules?.elementsToPreserve || "",
      mistakesToAvoid: data.preservationRules?.mistakesToAvoid || "",
    },
    negativeConstraints: Array.isArray(data.negativeConstraints)
      ? data.negativeConstraints
      : [],
    generatedPrompt: data.generatedPrompt || "",
    optimizedPrompt: data.optimizedPrompt || "",
    test5sPrompt: data.test5sPrompt || "",
    aiSuggestions: Array.isArray(data.aiSuggestions) ? data.aiSuggestions : [],
    lastModifiedAt: data.lastModifiedAt || new Date().toISOString(),
    h3Score: typeof data.h3Score === "number" ? data.h3Score : undefined,
  };
}

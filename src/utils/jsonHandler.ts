import { ProjectData } from "../types/minimax";
import { H3ProjectExport } from "../types/project";
import { ExtendedReferenceItem } from "../types/reference";
import { CURRENT_SCHEMA_VERSION, CURRENT_APP_VERSION } from "./schemaMigrations";
import { calculateH3ComplianceScore, validateProjectData } from "./rulesEngine";
import { compileMiniMaxH3Prompt, compile5sTestPrompt, compileBlockStructured } from "./compiler";

/**
 * Builds the canonical H3ProjectExport structure from the current project state.
 */
export function buildH3ProjectExportPayload(project: ProjectData): H3ProjectExport {
  const issues = validateProjectData(project);
  const h3Score = calculateH3ComplianceScore(project, issues);

  const fullPrompt = project.optimizedPrompt || compileMiniMaxH3Prompt(project);
  const test5sPrompt = compile5sTestPrompt(project);
  const blocks = compileBlockStructured(project);

  const nowIso = new Date().toISOString();

  const updatedProject: ProjectData = {
    ...project,
    generatedPrompt: fullPrompt,
    test5sPrompt: test5sPrompt,
    lastModifiedAt: nowIso,
    h3Score: h3Score,
  };

  // Convert references to extended format for maximum portability
  const extendedReferences: ExtendedReferenceItem[] = project.references.map((ref) => {
    const isBlobOrLocal =
      !ref.url ||
      ref.url.startsWith("blob:") ||
      ref.url.startsWith("file:") ||
      ref.url.startsWith("C:") ||
      ref.url.startsWith("/");

    return {
      id: ref.id,
      role: (ref.role as any) || "produit",
      label: ref.name || "Référence",
      sourceType: "image",
      fileName: `${(ref.name || "ref").toLowerCase().replace(/\s+/g, "_")}.jpg`,
      mediaAvailable: Boolean(ref.url && !isBlobOrLocal),
      preserve: ref.preserveText ? ref.preserveText.split(",").map((s) => s.trim()) : [],
      notes: ref.definesText,
      url: !isBlobOrLocal ? ref.url : undefined,
      previewUrl: !isBlobOrLocal ? ref.previewUrl || ref.url : undefined,
      definesText: ref.definesText,
      preserveText: ref.preserveText,
    };
  });

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appName: "MiniMax H3 Assistant",
    appVersion: CURRENT_APP_VERSION,
    exportedAt: nowIso,
    projectId: project.id || `proj_${Date.now()}`,
    projectName: project.title || "Projet Sans Titre",
    lastModifiedAt: nowIso,
    compatibility: {
      minAppVersion: "1.0.0",
      exportedWith: CURRENT_APP_VERSION,
      migrationRequired: false,
    },
    project: updatedProject,
    extendedReferences,
  };
}

/**
 * Triggers browser download of the full project JSON file.
 * Filename format: minimax-h3-nom-du-projet-YYYY-MM-DD-HHmm.json
 */
export function exportProjectToJson(project: ProjectData) {
  const payload = buildH3ProjectExportPayload(project);
  const jsonString = JSON.stringify(payload, null, 2);

  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const sanitizedSlug = (project.title || "projet")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const filename = `minimax-h3-${sanitizedSlug || "projet"}-${year}-${month}-${day}-${hours}${minutes}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Architecture helper preparing for future .h3project ZIP bundle.
 * Returns the file map that can be zipped in a future version.
 */
export function prepareH3ProjectBundleStructure(project: ProjectData) {
  const jsonPayload = buildH3ProjectExportPayload(project);
  const fullPrompt = project.optimizedPrompt || compileMiniMaxH3Prompt(project);

  return {
    "project.json": JSON.stringify(jsonPayload, null, 2),
    "previews/prompt.txt": fullPrompt,
    "references/manifest.json": JSON.stringify(jsonPayload.extendedReferences || [], null, 2),
  };
}

import { ImportAnalysisResult, ExtendedReferenceItem } from "../types/project";
import { ProjectData, ValidationIssue } from "../types/minimax";
import { validateProjectData, calculateH3ComplianceScore } from "./rulesEngine";
import { migrateProjectSchema, CURRENT_SCHEMA_VERSION } from "./schemaMigrations";

const MAX_JSON_SIZE_BYTES = 10 * 1024 * 1024; // 10MB safety limit

/**
 * Validates, analyzes, and prepares incoming JSON string or object for import into MiniMax H3 Assistant.
 */
export function analyzeAndValidateImportJson(rawInput: string | object): ImportAnalysisResult {
  const blockingErrors: string[] = [];
  const warnings: string[] = [];

  let parsedObj: any = null;

  // 1. Safe JSON Parsing
  if (typeof rawInput === "string") {
    if (rawInput.length > MAX_JSON_SIZE_BYTES) {
      return createFailedResult(["Le fichier JSON dépasse la taille maximale autorisée de 10 Mo."]);
    }
    try {
      parsedObj = JSON.parse(rawInput);
    } catch (e: any) {
      return createFailedResult([
        "Format JSON corrompu ou invalide. Impossible de lire la structure du fichier.",
      ]);
    }
  } else if (typeof rawInput === "object" && rawInput !== null) {
    parsedObj = rawInput;
  } else {
    return createFailedResult(["Entrée de projet non valide."]);
  }

  // 2. Check structure
  if (!parsedObj || typeof parsedObj !== "object") {
    return createFailedResult(["Le fichier ne contient pas un objet JSON valide."]);
  }

  // Check if schemaVersion exists or requires migration
  const hasSchemaVersion = Boolean(parsedObj.schemaVersion);
  if (!hasSchemaVersion) {
    warnings.push(
      "Propriété schemaVersion absente. Le fichier sera importé en mode compatibilité legacy."
    );
  }

  // 3. Migration pipeline execution
  let exportPayload;
  let migrationSummary;
  try {
    const migrationResult = migrateProjectSchema(parsedObj);
    exportPayload = migrationResult.exportPayload;
    migrationSummary = migrationResult.summary;
  } catch (err: any) {
    return createFailedResult([
      `Erreur lors de la migration du schéma : ${err.message || "Structure incompatible."}`,
    ]);
  }

  const projectData: ProjectData = exportPayload.project;

  // 4. Validate core fields presence
  if (!projectData.id) {
    blockingErrors.push("L'identifiant de projet (projectId) est manquant ou invalide.");
  }
  if (!projectData.title) {
    warnings.push("Nom du projet manquant : 'Projet Sans Titre' sera attribué.");
  }
  if (!Array.isArray(projectData.shots)) {
    blockingErrors.push("La liste des plans (shots) est invalide ou corrompue.");
  }
  if (!projectData.styleContract || typeof projectData.styleContract !== "object") {
    blockingErrors.push("Le contrat de style du projet est manquant.");
  }

  // 5. References & Media Analysis
  let missingMediaCount = 0;
  const totalReferencesCount = projectData.references?.length || 0;
  const extendedReferences: ExtendedReferenceItem[] = [];

  if (Array.isArray(projectData.references)) {
    projectData.references.forEach((ref, idx) => {
      // Check if reference has explicit role
      if (!ref.role) {
        blockingErrors.push(
          `La référence #${idx + 1} (${ref.name || "sans nom"}) n'a pas de rôle assigné.`
        );
      }

      // Detect if media is local / missing / requires re-import
      const isBlobOrLocal =
        !ref.url ||
        ref.url.startsWith("blob:") ||
        ref.url.startsWith("file:") ||
        ref.url.startsWith("C:") ||
        ref.url.startsWith("/");

      const isAvailable = Boolean(ref.url && !isBlobOrLocal);

      if (!isAvailable) {
        missingMediaCount++;
      }

      extendedReferences.push({
        id: ref.id,
        role: (ref.role as any) || "produit",
        label: ref.name || `Référence #${idx + 1}`,
        sourceType: "image",
        fileName: ref.name ? `${ref.name.toLowerCase().replace(/\s+/g, "_")}.jpg` : undefined,
        mediaAvailable: isAvailable,
        preserve: ref.preserveText ? ref.preserveText.split(",").map((s) => s.trim()) : [],
        notes: ref.definesText,
        url: isAvailable ? ref.url : undefined,
        previewUrl: isAvailable ? ref.previewUrl || ref.url : undefined,
        definesText: ref.definesText,
        preserveText: ref.preserveText,
      });
    });
  }

  if (missingMediaCount > 0) {
    warnings.push(
      `${missingMediaCount} média(s) de référence ne sont pas intégrés dans ce fichier. Vous devrez les réimporter avant la génération finale.`
    );
  }

  // 6. MiniMax H3 Rules Engine Re-validation
  const validationIssues: ValidationIssue[] = validateProjectData(projectData);
  const h3Score = calculateH3ComplianceScore(projectData, validationIssues);

  // Attach h3Score to projectData
  projectData.h3Score = h3Score;

  const isSchemaCompatible = blockingErrors.length === 0;

  return {
    isValidJson: true,
    isSchemaCompatible,
    schemaVersion: exportPayload.schemaVersion,
    appVersion: exportPayload.appVersion,
    projectId: exportPayload.projectId,
    projectName: exportPayload.projectName,
    exportedAt: exportPayload.exportedAt,
    migrationRequired: migrationSummary.migrationApplied,
    migrationSummary,
    projectData,
    extendedReferences,
    missingMediaCount,
    totalReferencesCount,
    validationIssues,
    h3Score,
    blockingErrors,
    warnings,
  };
}

function createFailedResult(blockingErrors: string[]): ImportAnalysisResult {
  return {
    isValidJson: false,
    isSchemaCompatible: false,
    schemaVersion: "inconnue",
    appVersion: "inconnue",
    projectId: "",
    projectName: "",
    exportedAt: new Date().toISOString(),
    migrationRequired: false,
    missingMediaCount: 0,
    totalReferencesCount: 0,
    validationIssues: [],
    h3Score: 0,
    blockingErrors,
    warnings: [],
  };
}

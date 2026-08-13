import { describe, it, expect } from "vitest";
import { analyzeAndValidateImportJson } from "./schemaValidator";
import { buildH3ProjectExportPayload } from "./jsonHandler";
import { validPerfumeProject } from "./__fixtures__/projectFixture";
import { CURRENT_SCHEMA_VERSION, CURRENT_APP_VERSION } from "./schemaMigrations";

describe("analyzeAndValidateImportJson", () => {
  it("accepts a valid v1.0.0 export payload", () => {
    const payload = buildH3ProjectExportPayload(validPerfumeProject);
    const json = JSON.stringify(payload);
    const result = analyzeAndValidateImportJson(json);

    expect(result.isValidJson).toBe(true);
    expect(result.isSchemaCompatible).toBe(true);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.appVersion).toBe(CURRENT_APP_VERSION);
    expect(result.projectId).toBe(validPerfumeProject.id);
    expect(result.projectName).toBe(validPerfumeProject.title);
    expect(result.migrationRequired).toBe(false);
  });

  it("flags corrupt JSON as invalid with blocking errors", () => {
    const result = analyzeAndValidateImportJson("{ not valid json");
    expect(result.isValidJson).toBe(false);
    expect(result.isSchemaCompatible).toBe(false);
    expect(result.blockingErrors.length).toBeGreaterThan(0);
  });

  it("flags files exceeding the 10MB size limit without parsing them", () => {
    // 11MB of "a" + a trailing closing brace
    const tooBig = "a".repeat(11 * 1024 * 1024);
    const result = analyzeAndValidateImportJson(tooBig);
    expect(result.isValidJson).toBe(false);
    expect(result.blockingErrors[0]).toMatch(/10 Mo/);
  });

  it("migrates a legacy (no schemaVersion) payload to v1.0.0 with a warning", () => {
    const legacy = {
      projectId: "proj_legacy",
      projectName: "Legacy Project",
      projectData: {
        ...validPerfumeProject,
        id: "proj_legacy",
        title: "Legacy Project",
      },
    };
    const result = analyzeAndValidateImportJson(JSON.stringify(legacy));
    expect(result.isValidJson).toBe(true);
    expect(result.migrationRequired).toBe(true);
    expect(result.migrationSummary).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("detects references without role and reports blocking errors", () => {
    const payload = buildH3ProjectExportPayload({
      ...validPerfumeProject,
      references: [
        {
          id: "r1",
          name: "No role ref",
          role: "" as any,
          definesText: "x",
          preserveText: "y",
        },
      ],
    });
    const result = analyzeAndValidateImportJson(JSON.stringify(payload));
    expect(result.blockingErrors.some((e) => e.includes("n'a pas de rôle"))).toBe(true);
  });

  it("counts missing media (blob:/file:/local URLs) in missingMediaCount", () => {
    const payload = buildH3ProjectExportPayload({
      ...validPerfumeProject,
      references: [
        {
          id: "r1",
          name: "Local ref",
          role: "produit",
          definesText: "x",
          preserveText: "y",
          url: "blob:http://localhost/abc-123",
        },
        {
          id: "r2",
          name: "Remote ref",
          role: "produit",
          definesText: "x",
          preserveText: "y",
          url: "https://example.com/img.jpg",
        },
      ],
    });
    const result = analyzeAndValidateImportJson(JSON.stringify(payload));
    expect(result.totalReferencesCount).toBe(2);
    expect(result.missingMediaCount).toBe(1);
  });

  it("computes the H3 compliance score during import", () => {
    const payload = buildH3ProjectExportPayload({
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
    });
    const result = analyzeAndValidateImportJson(JSON.stringify(payload));
    expect(result.h3Score).toBeLessThan(100);
    expect(result.validationIssues.some((i) => i.id === "err_missing_audio_block")).toBe(true);
  });

  it("falls back to 'Projet Sans Titre' when projectName is missing", () => {
    const payload = buildH3ProjectExportPayload({
      ...validPerfumeProject,
      title: "",
    });
    const result = analyzeAndValidateImportJson(JSON.stringify(payload));
    expect(result.projectName).toBe("Projet Sans Titre");
  });
});

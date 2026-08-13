import { describe, it, expect, vi } from "vitest";
import { buildH3ProjectExportPayload, exportProjectToJson } from "./jsonHandler";
import { analyzeAndValidateImportJson } from "./schemaValidator";
import { migrateProjectSchema } from "./schemaMigrations";
import { validateProjectData } from "./rulesEngine";
import { INITIAL_PROJECT_DATA } from "../constants/presets";
import { ProjectData } from "../types/minimax";

const buildFullProject = (): ProjectData => ({
  ...INITIAL_PROJECT_DATA,
  id: "proj_test_123",
  title: "Publicité Parfum Luxe",
});

const buildEmptyProject = (): ProjectData => ({
  id: "proj_empty",
  title: "",
  step: 1,
  videoType: "pub_produit",
  videoGoal: "vendre",
  emotion: "luxe",
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
  negativeConstraints: [],
});

describe("buildH3ProjectExportPayload", () => {
  it("exports a complete project with schema v1.0.0", () => {
    const exported = buildH3ProjectExportPayload(buildFullProject());
    expect(exported.schemaVersion).toBe("1.0.0");
    expect(exported.projectId).toBe("proj_test_123");
    expect(exported.projectName).toBe("Publicité Parfum Luxe");
  });

  it("preserves the shots array as-is in the export", () => {
    const exported = buildH3ProjectExportPayload(buildFullProject());
    expect(exported.project.shots.length).toBe(INITIAL_PROJECT_DATA.shots.length);
  });

  it("maps reference roles into extendedReferences", () => {
    const exported = buildH3ProjectExportPayload({
      ...buildFullProject(),
      references: [
        {
          id: "ref1",
          name: "Bottle",
          role: "produit",
          definesText: "Shape",
          preserveText: "Logo",
        },
      ],
    });
    expect(exported.extendedReferences?.[0]?.role).toBe("produit");
  });

  it("falls back to 'Projet Sans Titre' for an empty project name", () => {
    const exported = buildH3ProjectExportPayload(buildEmptyProject());
    expect(exported.projectName).toBe("Projet Sans Titre");
  });

  it("computes and attaches the H3 compliance score", () => {
    const exported = buildH3ProjectExportPayload(buildFullProject());
    expect(typeof exported.project.h3Score).toBe("number");
  });

  it("produces a payload that can be re-imported successfully", () => {
    const exported = buildH3ProjectExportPayload(buildFullProject());
    const roundTrip = analyzeAndValidateImportJson(JSON.stringify(exported));
    expect(roundTrip.isValidJson).toBe(true);
    expect(roundTrip.isSchemaCompatible).toBe(true);
  });
});

describe("exportProjectToJson", () => {
  it("triggers a browser download with a sensible filename (smoke test)", () => {
    // jsdom doesn't implement download, but we can at least assert no exceptions
    // are thrown and that the URL.createObjectURL spy is called.
    const createSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    expect(() => exportProjectToJson(buildFullProject())).not.toThrow();
    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();

    createSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });
});

describe("migrateProjectSchema", () => {
  it("upgrades a legacy v0.x payload to v1.0.0", () => {
    const legacy = {
      projectId: "proj_legacy",
      projectName: "Old Project",
      projectData: { ...INITIAL_PROJECT_DATA, id: "proj_legacy", title: "Old Project" },
    };
    const { exportPayload, summary } = migrateProjectSchema(legacy);
    expect(exportPayload.schemaVersion).toBe("1.0.0");
    expect(summary.migrationApplied).toBe(true);
    expect(summary.fromVersion).toContain("Legacy");
  });

  it("is a no-op for an already v1.0.0 payload", () => {
    const current = {
      schemaVersion: "1.0.0",
      projectId: "proj_v1",
      projectName: "V1 Project",
      project: { ...INITIAL_PROJECT_DATA, id: "proj_v1", title: "V1 Project" },
    };
    const { summary } = migrateProjectSchema(current);
    expect(summary.migrationApplied).toBe(false);
  });
});

describe("validateProjectData (re-exported sanity checks)", () => {
  it("flags a reference without a role", () => {
    const issues = validateProjectData({
      ...INITIAL_PROJECT_DATA,
      references: [{ id: "r1", name: "Ref", role: "" as any, definesText: "", preserveText: "" }],
    });
    expect(issues.some((i) => i.id.startsWith("err_ref_no_role_"))).toBe(true);
  });

  it("flags double camera motion", () => {
    const issues = validateProjectData({
      ...INITIAL_PROJECT_DATA,
      shots: [
        { id: "shot_1", shotNumber: 1, visualDescription: "", subjectAction: "", atmosphere: "" },
      ],
      cameraDirections: {
        shot_1: {
          shotId: "shot_1",
          framing: "medium",
          angle: "eye_level",
          motion: "tracking_forward",
          speed: "smooth",
          secondaryMotionAttempt: "zoom_in",
        },
      },
    });
    expect(issues.some((i) => i.id.startsWith("err_double_camera_"))).toBe(true);
  });

  it("flags a missing audio block", () => {
    const issues = validateProjectData({
      ...INITIAL_PROJECT_DATA,
      audioDesign: {
        ...INITIAL_PROJECT_DATA.audioDesign,
        isSilent: false,
        ambientSound: "",
        keySFX: "",
        musicDescription: "",
        hasMusic: false,
        hasVoiceoverOrDialogue: false,
      },
    });
    expect(issues.some((i) => i.id === "err_missing_audio_block")).toBe(true);
  });

  it("flags >3 shots for a 10s video", () => {
    const issues = validateProjectData({
      ...INITIAL_PROJECT_DATA,
      duration: "10s",
      shots: [
        { id: "s1", shotNumber: 1, visualDescription: "", subjectAction: "", atmosphere: "" },
        { id: "s2", shotNumber: 2, visualDescription: "", subjectAction: "", atmosphere: "" },
        { id: "s3", shotNumber: 3, visualDescription: "", subjectAction: "", atmosphere: "" },
        { id: "s4", shotNumber: 4, visualDescription: "", subjectAction: "", atmosphere: "" },
        { id: "s5", shotNumber: 5, visualDescription: "", subjectAction: "", atmosphere: "" },
      ],
    });
    expect(issues.some((i) => i.id === "err_shot_count_10s")).toBe(true);
  });
});

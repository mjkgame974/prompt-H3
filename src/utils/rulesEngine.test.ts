import { describe, it, expect } from "vitest";
import {
  validateProjectData,
  calculateH3ComplianceScore,
} from "./rulesEngine";
import {
  validPerfumeProject,
  short5sProject,
  projectWithoutAudio,
  projectWithDoubleCamera,
  emptyProject,
} from "./__fixtures__/projectFixture";

describe("validateProjectData", () => {
  it("returns no issues for a fully valid project", () => {
    const issues = validateProjectData(validPerfumeProject);
    expect(issues).toEqual([]);
  });

  it("returns no blocking issues for the empty default project (user starts blank)", () => {
    const issues = validateProjectData(emptyProject);
    // Empty project has 0 shots, silent audio, 3 negative constraints — should
    // produce no issues at all (no warnings, no errors).
    expect(issues).toEqual([]);
  });

  it("the empty default project starts at 70/100 (completeness penalties: 0 shots, no style contract)", () => {
    // The score function penalises incompleteness:
    //   - no condensedEnglishSentence: -10
    //   - 0 shots: -20
    // So an empty project lands at 70/100, and the user climbs back to 100
    // as they fill in the wizard.
    const score = calculateH3ComplianceScore(emptyProject);
    expect(score).toBe(70);
  });

  it("flags a 10s video with more than 3 shots", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      shots: [
        ...validPerfumeProject.shots,
        { id: "shot_3", shotNumber: 3, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "shot_4", shotNumber: 4, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
      ],
    });
    expect(issues.some((i) => i.id === "err_shot_count_10s")).toBe(true);
  });

  it("flags a 5s video with more than 2 shots", () => {
    const issues = validateProjectData({
      ...short5sProject,
      shots: [
        ...short5sProject.shots,
        { id: "shot_2b", shotNumber: 2, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "shot_3b", shotNumber: 3, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
      ],
    });
    expect(issues.some((i) => i.id === "err_shot_count_5s")).toBe(true);
  });

  it("does NOT flag a 15s video for shot count (long-form is flexible)", () => {
    // 15s and 30s videos don't have a strict shot count limit — let the user decide.
    const issues = validateProjectData({
      ...validPerfumeProject,
      duration: "15s",
      shots: [
        { id: "s1", shotNumber: 1, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "s2", shotNumber: 2, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "s3", shotNumber: 3, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "s4", shotNumber: 4, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "s5", shotNumber: 5, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
      ],
    });
    expect(issues.some((i) => i.id === "err_shot_count_5s" || i.id === "err_shot_count_10s")).toBe(false);
  });

  it("does NOT flag a 30s video for shot count", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      duration: "30s",
      shots: [
        { id: "s1", shotNumber: 1, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "s2", shotNumber: 2, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "s3", shotNumber: 3, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "s4", shotNumber: 4, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
        { id: "s5", shotNumber: 5, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
      ],
    });
    expect(issues.some((i) => i.id === "err_shot_count_5s" || i.id === "err_shot_count_10s")).toBe(false);
  });

  it("flags a timestamp on Shot 1 (it must be implicit at 00:00.000)", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      shots: [
        {
          ...validPerfumeProject.shots[0],
          timestamp: "00:00.000",
        },
        ...validPerfumeProject.shots.slice(1),
      ],
    });
    expect(issues.some((i) => i.id.startsWith("err_shot_1_timestamp_"))).toBe(true);
  });

  it("flags a missing timestamp on Shot 2+", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      shots: [
        validPerfumeProject.shots[0],
        { ...validPerfumeProject.shots[1], timestamp: undefined },
      ],
    });
    expect(issues.some((i) => i.id.startsWith("err_shot_missing_time_"))).toBe(true);
  });

  it("flags double camera motion (secondaryMotionAttempt set)", () => {
    const issues = validateProjectData(projectWithDoubleCamera);
    expect(issues.some((i) => i.id.startsWith("err_double_camera_"))).toBe(true);
  });

  it("flags a missing audio block (neither silent nor any audio content set)", () => {
    const issues = validateProjectData(projectWithoutAudio);
    expect(issues.some((i) => i.id === "err_missing_audio_block")).toBe(true);
  });

  it("does NOT flag the audio rule when isSilent is true (silent IS a valid audio block)", () => {
    const issues = validateProjectData({
      ...projectWithoutAudio,
      audioDesign: { ...projectWithoutAudio.audioDesign, isSilent: true },
    });
    expect(issues.some((i) => i.id === "err_missing_audio_block")).toBe(false);
  });

  it("flags a reference without a role", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      references: [
        {
          id: "ref1",
          name: "Some ref",
          role: "" as any,
          definesText: "",
          preserveText: "",
        },
      ],
    });
    expect(issues.some((i) => i.id.startsWith("err_ref_no_role_"))).toBe(true);
  });

  it("warns when references are present but no preservation rules are set", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      references: [
        { id: "r1", name: "Ref", role: "produit", definesText: "x", preserveText: "y" },
      ],
      preservationRules: { elementsToPreserve: "", mistakesToAvoid: "" },
    });
    expect(issues.some((i) => i.id === "warn_missing_preservation")).toBe(true);
  });

  it("warns when the on-screen text is described instead of cited verbatim", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      onScreenText: {
        hasText: true,
        exactString: "un texte qui dit hello world",
        isExactFormat: false,
      },
    });
    expect(issues.some((i) => i.id === "warn_descriptive_text")).toBe(true);
  });

  it("warns when there are fewer than 3 negative constraints", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      negativeConstraints: [
        { id: "n1", text: "no subtitles" },
      ],
    });
    expect(issues.some((i) => i.id === "warn_neg_too_few")).toBe(true);
  });

  it("warns when there are more than 6 negative constraints", () => {
    const issues = validateProjectData({
      ...validPerfumeProject,
      negativeConstraints: [
        { id: "n1", text: "no a" },
        { id: "n2", text: "no b" },
        { id: "n3", text: "no c" },
        { id: "n4", text: "no d" },
        { id: "n5", text: "no e" },
        { id: "n6", text: "no f" },
        { id: "n7", text: "no g" },
      ],
    });
    expect(issues.some((i) => i.id === "warn_neg_too_many")).toBe(true);
  });
});

describe("calculateH3ComplianceScore", () => {
  it("returns 100 for a fully valid project", () => {
    const issues = validateProjectData(validPerfumeProject);
    const score = calculateH3ComplianceScore(validPerfumeProject, issues);
    expect(score).toBe(100);
  });

  it("drops the score for each error (20 points)", () => {
    const score = calculateH3ComplianceScore(projectWithoutAudio);
    // -20 for the missing audio block
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("clamps the score to a [0, 100] range", () => {
    const score = calculateH3ComplianceScore({
      ...validPerfumeProject,
      shots: [],
      styleContract: { ...validPerfumeProject.styleContract, condensedEnglishSentence: "" },
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

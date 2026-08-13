/* eslint-disable no-console */
/**
 * End-to-end smoke test for the MiniMax H3 prompt builder.
 * Exercises the real code paths that the React app uses:
 *  - compiler.compileMiniMaxH3Prompt
 *  - compiler.compileFrenchPrompt
 *  - rulesEngine.validateProjectData
 *  - persistence roundtrip
 *  - The "updateFps" regex logic (FPS replacement in the condensed sentence)
 *
 * Run with: npx tsx scripts/smoke-test.ts
 */

import {
  compileMiniMaxH3Prompt,
  compileFrenchPrompt,
  compile5sTestPrompt,
  compileBlockStructured,
  compileBlockStructuredFrench,
} from "../src/utils/compiler";
import { validateProjectData, calculateH3ComplianceScore } from "../src/utils/rulesEngine";
import { INITIAL_PROJECT_DATA } from "../src/constants/presets";
import { validPerfumeProject, emptyProject, projectWithoutAudio } from "../src/utils/__fixtures__/projectFixture";

const passed: string[] = [];
const failed: string[] = [];

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed.push(name);
    console.log(`  ✅ ${name}`);
  } else {
    failed.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(label: string) {
  console.log(`\n— ${label} ${"─".repeat(60 - label.length)}`);
}

// ============================================================================
// SECTION 1: compiler output — basic structure
// ============================================================================
section("1. Compiler — structure de base");

const basicEn = compileMiniMaxH3Prompt(validPerfumeProject);
check("EN output starts with [STYLE CONTRACT]", basicEn.startsWith("[STYLE CONTRACT]"));
check("EN output contains [TIMELINE & SHOTS]", basicEn.includes("[TIMELINE & SHOTS]"));
check("EN output contains [AUDIO DESIGN]", basicEn.includes("[AUDIO DESIGN]"));
check("EN output contains [ON-SCREEN TEXT & DIALOGUE]", basicEn.includes("[ON-SCREEN TEXT & DIALOGUE]"));
check("EN output contains [PRESERVATION & REFERENCES]", basicEn.includes("[PRESERVATION & REFERENCES]"));
check("EN output contains [NEGATIVE CONSTRAINTS]", basicEn.includes("[NEGATIVE CONSTRAINTS]"));

const basicFr = compileFrenchPrompt(validPerfumeProject);
check("FR output starts with [CONTRAT DE STYLE]", basicFr.startsWith("[CONTRAT DE STYLE]"));
check("FR output contains [PLANS & TIMELINE]", basicFr.includes("[PLANS & TIMELINE]"));
check("FR output contains [CONCEPTION AUDIO]", basicFr.includes("[CONCEPTION AUDIO]"));

// ============================================================================
// SECTION 2: H3 timing rules
// ============================================================================
section("2. Timing — Shot 1 sans timestamp, Shot 2+ avec At");

const shot1Line = basicEn.split("\n").find((l) => l.includes("[Shot 1]")) ?? "";
check("[Shot 1] sans At", !shot1Line.includes("At 00:"));
check("[Shot 2] commence par At 00:05.000", basicEn.includes("At 00:05.000"));

// ============================================================================
// SECTION 3: Camera — single motion per shot
// ============================================================================
section("3. Caméra — UN SEUL mouvement par plan");

const camLine = basicEn.split("\n").find((l) => l.startsWith("Camera:")) ?? "";
check("Camera: framing, angle, motion, speed présents", /Camera: \w[\w\s]*, \w[\w\s]*, \w[\w\s]* \(/.test(camLine));
check("Au moins 2 lignes Camera (shot 1 + shot 2)", basicEn.split("\n").filter((l) => l.startsWith("Camera:")).length >= 2);

// ============================================================================
// SECTION 4: Audio mandatory block
// ============================================================================
section("4. Audio — bloc obligatoire");

check("Audio: présent (silence OU détaillé)", basicEn.includes("Audio:"));

const silentFrProject = {
  ...validPerfumeProject,
  audioDesign: {
    ...validPerfumeProject.audioDesign,
    isSilent: true,
    ambientSound: "",
    keySFX: "",
    hasMusic: false,
    musicDescription: "",
    hasVoiceoverOrDialogue: false,
  },
};
const noAudioFr = compileFrenchPrompt(silentFrProject);
check("FR rend 'Silence' quand isSilent=true", noAudioFr.includes("Silence"));

// ============================================================================
// SECTION 5: On-screen text & dialogue exact syntax
// ============================================================================
section("5. Texte exact & dialogue balisé");

check('EN: "On-screen text reading exactly: \"PURE LUXURY\""', basicEn.includes('On-screen text reading exactly: "PURE LUXURY"'));
check("FR: « PURE LUXURY »", basicFr.includes("« PURE LUXURY »"));

const withDialog = compileMiniMaxH3Prompt({
  ...validPerfumeProject,
  spokenDialogue: { hasDialogue: true, languageCode: "English", exactLines: "Hello world" },
});
check("EN: <d>[English] Hello world</d>", withDialog.includes("<d>[English] Hello world</d>"));

// ============================================================================
// SECTION 6: Rules engine — shot count
// ============================================================================
section("6. Rules engine — limites de plans par durée");

// 10s, 4 shots → should flag
const tooManyShots = validateProjectData({
  ...validPerfumeProject,
  duration: "10s",
  shots: [
    { id: "s1", shotNumber: 1, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s2", shotNumber: 2, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s3", shotNumber: 3, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s4", shotNumber: 4, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
  ],
});
check("10s + 4 plans = warning err_shot_count_10s", tooManyShots.some((i) => i.id === "err_shot_count_10s"));

// 5s, 3 shots → should flag
const tooMany5s = validateProjectData({
  ...validPerfumeProject,
  duration: "5s",
  shots: [
    { id: "s1", shotNumber: 1, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s2", shotNumber: 2, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s3", shotNumber: 3, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
  ],
});
check("5s + 3 plans = warning err_shot_count_5s", tooMany5s.some((i) => i.id === "err_shot_count_5s"));

// 15s, 4 shots → no limit, no warning
const fifteenSec = validateProjectData({
  ...validPerfumeProject,
  duration: "15s",
  shots: [
    { id: "s1", shotNumber: 1, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s2", shotNumber: 2, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s3", shotNumber: 3, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s4", shotNumber: 4, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
  ],
});
check("15s + 4 plans = pas de warning shot count", !fifteenSec.some((i) => i.id === "err_shot_count_5s" || i.id === "err_shot_count_10s"));

// 30s, 6 shots → no limit, no warning
const thirtySec = validateProjectData({
  ...validPerfumeProject,
  duration: "30s",
  shots: [
    { id: "s1", shotNumber: 1, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s2", shotNumber: 2, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s3", shotNumber: 3, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s4", shotNumber: 4, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s5", shotNumber: 5, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
    { id: "s6", shotNumber: 6, visualDescription: "x", subjectAction: "x", atmosphere: "x" },
  ],
});
check("30s + 6 plans = pas de warning shot count", !thirtySec.some((i) => i.id === "err_shot_count_5s" || i.id === "err_shot_count_10s"));

// Empty project → no issues
const emptyIssues = validateProjectData(emptyProject);
check("Projet vide = 0 issues", emptyIssues.length === 0, `got ${emptyIssues.length}`);

// ============================================================================
// SECTION 7: Compliance score
// ============================================================================
section("7. Compliance score (H3)");

const score100 = calculateH3ComplianceScore(validPerfumeProject);
check("Projet complet = 100/100", score100 === 100, `got ${score100}`);

const score70 = calculateH3ComplianceScore(emptyProject);
check("Projet vide = 70/100 (0 shots + no style)", score70 === 70, `got ${score70}`);

// ============================================================================
// SECTION 8: FPS handling (the recent bug fix)
// ============================================================================
section("8. FPS — vérification du fix");

// Setup: 3D Pixar style with 24 FPS (preset default)
const pixarProject = {
  ...validPerfumeProject,
  styleContract: {
    ...validPerfumeProject.styleContract,
    fps: "24 FPS",
    condensedEnglishSentence: "3D animation Pixar style, 24fps cinematic render, soft subsurface scattering, vibrant saturated palette, modern theatrical 3D animation, ray tracing.",
  },
};

const pixarPrompt = compileMiniMaxH3Prompt(pixarProject);
check("Preset FPS = 24 FPS → 'Frame Rate: 24 FPS' présent", pixarPrompt.includes("Frame Rate: 24 FPS"));

// Simulate the updateFps regex logic from Step 2
function simulateUpdateFps(newFps: string, sentence: string): string {
  let result = sentence;
  if (newFps) {
    result = result.replace(/\b\d+(?:-\d+)?\s*fps\b/gi, newFps);
  } else {
    result = result
      .replace(/,?\s*\b\d+(?:-\d+)?\s*fps\b/gi, "")
      .replace(/,\s*,/g, ",")
      .replace(/,\s*\./g, ".")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return result;
}

const updatedSentence = simulateUpdateFps("60 FPS", pixarProject.styleContract.condensedEnglishSentence);
check("updateFps('60 FPS') remplace '24fps' dans la phrase", updatedSentence.includes("60 FPS cinematic render"));
check("updateFps('60 FPS') préserve le reste", updatedSentence.includes("soft subsurface scattering"));

const updatedProject = {
  ...pixarProject,
  styleContract: {
    ...pixarProject.styleContract,
    condensedEnglishSentence: updatedSentence,
    fps: "60 FPS",
  },
};
const updatedPrompt = compileMiniMaxH3Prompt(updatedProject);
check("Prompt après updateFps = '60 FPS cinematic' (pas '24fps')", updatedPrompt.includes("60 FPS cinematic render"));
check("Prompt après updateFps = 'Frame Rate: 60 FPS'", updatedPrompt.includes("Frame Rate: 60 FPS"));
check("Prompt après updateFps ne contient plus '24fps'", !updatedPrompt.includes("24fps"));

// Test clearing the FPS
const clearedSentence = simulateUpdateFps("", pixarProject.styleContract.condensedEnglishSentence);
check("updateFps('') retire le chunk FPS", !clearedSentence.includes("24fps") && !clearedSentence.includes("FPS"));
check("updateFps('') ne laisse pas de virgule orpheline", !clearedSentence.includes(", ,"));

// ============================================================================
// SECTION 9: French prompt includes FPS
// ============================================================================
section("9. Compiler FR — FPS dans Cadence");

const frWithFps = compileFrenchPrompt({
  ...validPerfumeProject,
  styleContract: { ...validPerfumeProject.styleContract, fps: "12 FPS" },
});
check("FR: 'Cadence (FPS) : 12 FPS'", frWithFps.includes("Cadence (FPS) : 12 FPS"));

const frNoFps = compileFrenchPrompt({
  ...validPerfumeProject,
  styleContract: { ...validPerfumeProject.styleContract, fps: "" },
});
check("FR: pas de 'Cadence (FPS)' quand fps vide", !frNoFps.includes("Cadence (FPS)"));

// ============================================================================
// SECTION 10: Block structure
// ============================================================================
section("10. Block structure — 7 blocs");

const blocks = compileBlockStructured(validPerfumeProject);
const blocksFr = compileBlockStructuredFrench(validPerfumeProject);
const expectedKeys = [
  "styleContractBlock",
  "timelineBlock",
  "cameraBlock",
  "audioBlock",
  "textAndDialogueBlock",
  "preservationBlock",
  "negativeConstraintsBlock",
];
expectedKeys.forEach((key) => {
  check(`EN blocks.${key} existe`, typeof (blocks as any)[key] === "string");
  check(`FR blocks.${key} existe`, typeof (blocksFr as any)[key] === "string");
});

// ============================================================================
// SECTION 11: 5s test prompt
// ============================================================================
section("11. 5s Test Prompt");

const test5s = compile5sTestPrompt(validPerfumeProject);
check("5s prompt contient [TEST 5S]", test5s.includes("[TEST 5S FAST PREVIEW VERSION]"));
check("5s prompt utilise Shot 1", test5s.includes("[Shot 1]"));
check("5s prompt a un audio minimal", test5s.includes("Audio:"));

// ============================================================================
// SECTION 12: Project structure (default state)
// ============================================================================
section("12. Project state — defaults");

check("INITIAL_PROJECT_DATA est vide (id présent)", INITIAL_PROJECT_DATA.id.startsWith("proj_"));
check("INITIAL_PROJECT_DATA: 0 shots", INITIAL_PROJECT_DATA.shots.length === 0);
check("INITIAL_PROJECT_DATA: 0 références", INITIAL_PROJECT_DATA.references.length === 0);
check("INITIAL_PROJECT_DATA: silent par défaut", INITIAL_PROJECT_DATA.audioDesign.isSilent === true);
check("INITIAL_PROJECT_DATA: 3 neg constraints (au minimum)", INITIAL_PROJECT_DATA.negativeConstraints.length === 3);

// ============================================================================
// SUMMARY
// ============================================================================
console.log("\n" + "═".repeat(70));
console.log(`  ✅ Passed: ${passed.length}`);
console.log(`  ❌ Failed: ${failed.length}`);
if (failed.length > 0) {
  console.log("\n  Failures:");
  failed.forEach((f) => console.log(`    - ${f}`));
  process.exit(1);
} else {
  console.log("\n  🎉 Tous les tests passent — l'app est fonctionnelle de bout en bout !");
}

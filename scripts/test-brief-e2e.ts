/**
 * Smoke test E2E du flow "Brief" : brief libre → 2-3 questions Gemini
 * → clarifications → projet H3 complet.
 *
 * Usage : npx tsx scripts/test-brief-e2e.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  analyzeBriefForQuestions,
  briefToProject,
  GeminiError,
  type ClarificationAnswer,
} from "../src/services/gemini";
import { INITIAL_PROJECT_DATA } from "../src/constants/presets";

function readEnvVar(name: string): string | null {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === name) {
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return v || null;
      }
    }
  } catch { /* .env absent */ }
  return null;
}

const apiKey = readEnvVar("VITE_GEMINI_API_KEY");
if (!apiKey) {
  console.error("❌ VITE_GEMINI_API_KEY absente de .env");
  process.exit(1);
}
console.log(`✅ Clé chargée (${apiKey.length} chars)\n`);

const TEST_BRIEF = `Publicité 10s pour un parfum de luxe. Flacon doré sur velours noir, lumière chaude ambrée. Caméra qui orbite lentement autour du flacon. Ambiance mystérieuse, sensuelle, intime. Public cible : femmes 35-50 ans premium. Format 16:9 pour YouTube.`;

console.log("📋 Brief de test :");
console.log(`   "${TEST_BRIEF}"\n`);

// ─── Étape 1 : analyse → questions de clarification ────────────────────

console.log("📞 [1/2] Appel analyzeBriefForQuestions…");
const t1 = Date.now();
let questions;
try {
  questions = await analyzeBriefForQuestions(TEST_BRIEF, apiKey);
  console.log(`   ✅ ${questions.length} questions générées en ${Date.now() - t1}ms\n`);
} catch (err) {
  if (err instanceof GeminiError) {
    console.error(`   ❌ GeminiError [${err.code}]: ${err.message}`);
  } else {
    console.error("   ❌", err);
  }
  process.exit(1);
}

// Affiche les questions
console.log("   Questions générées :");
questions.forEach((q, i) => {
  console.log(`   ${i + 1}. [${q.id}] ${q.question}`);
  q.options.forEach((opt) => {
    console.log(`      - ${opt.value} → ${opt.label}`);
  });
});

// ─── Étape 2 : simulation des réponses utilisateur ────────────────────

// On simule des réponses basiques : on prend la 1ère option de chaque question
const simulatedAnswers: ClarificationAnswer[] = questions.map((q) => ({
  questionId: q.id,
  value: q.options[0]?.value ?? null,
}));

console.log("\n📋 Réponses simulées :");
simulatedAnswers.forEach((a, i) => {
  console.log(`   ${i + 1}. [${a.questionId}] → ${a.value ?? "(passé)"}`);
});

// ─── Étape 3 : génération du projet ───────────────────────────────────

console.log("\n📞 [2/2] Appel briefToProject…");
const t2 = Date.now();
let generated;
try {
  generated = await briefToProject(TEST_BRIEF, simulatedAnswers, apiKey);
  console.log(`   ✅ Projet généré en ${Date.now() - t2}ms\n`);
} catch (err) {
  if (err instanceof GeminiError) {
    console.error(`   ❌ GeminiError [${err.code}]: ${err.message}`);
  } else {
    console.error("   ❌", err);
  }
  process.exit(1);
}

// ─── Validation du projet généré ──────────────────────────────────────

console.log("🔍 Validation du projet généré :");
const checks: { name: string; ok: boolean; detail?: string }[] = [];

// Champs simples
checks.push({ name: "title", ok: typeof generated.title === "string" && generated.title.length > 0, detail: generated.title });
checks.push({ name: "videoType", ok: typeof generated.videoType === "string" && ["pub_produit","court_metrage","animation_2d","trailer","doublage","edition_video","autre"].includes(generated.videoType), detail: generated.videoType });
checks.push({ name: "videoGoal", ok: typeof generated.videoGoal === "string" && ["vendre","teaser","raconter","demonstrer","annoncer"].includes(generated.videoGoal), detail: generated.videoGoal });
checks.push({ name: "aspectRatio", ok: typeof generated.aspectRatio === "string", detail: generated.aspectRatio });
checks.push({ name: "duration", ok: typeof generated.duration === "string", detail: generated.duration });
checks.push({ name: "emotion", ok: typeof generated.emotion === "string" && generated.emotion.length > 5, detail: generated.emotion });

// styleContract
const sc = generated.styleContract;
checks.push({
  name: "styleContract.condensedEnglishSentence",
  ok: !!(sc && typeof sc.condensedEnglishSentence === "string" && sc.condensedEnglishSentence.length > 20),
  detail: sc?.condensedEnglishSentence?.slice(0, 60) + "...",
});

// shots
const shots = generated.shots;
checks.push({
  name: `shots (${shots?.length ?? 0} plans)`,
  ok: Array.isArray(shots) && shots.length >= 1 && shots.length <= 6,
  detail: shots ? shots.map((s) => s.shotNumber).join(",") : "absent",
});

// audioDesign
const audio = generated.audioDesign;
checks.push({
  name: "audioDesign",
  ok: !!(audio && typeof audio.isSilent === "boolean"),
  detail: audio ? `isSilent=${audio.isSilent}, music=${audio.hasMusic}` : "absent",
});

// negativeConstraints
const neg = generated.negativeConstraints;
checks.push({
  name: `negativeConstraints (${neg?.length ?? 0})`,
  ok: Array.isArray(neg) && neg.length >= 3 && neg.length <= 6,
  detail: neg?.map((n) => n.text).join(" | "),
});

// Affichage des checks
let passed = 0;
for (const c of checks) {
  const icon = c.ok ? "✅" : "❌";
  const detail = c.detail ? ` → ${c.detail}` : "";
  console.log(`   ${icon} ${c.name}${detail}`);
  if (c.ok) passed++;
}
console.log(`\n   ${passed}/${checks.length} checks OK`);

// ─── Test du merge avec INITIAL_PROJECT_DATA ─────────────────────────

console.log("\n🔗 Test du merge avec INITIAL_PROJECT_DATA :");
const merged = { ...INITIAL_PROJECT_DATA, ...generated };
const requiredFields = [
  "id", "title", "step", "videoType", "videoGoal", "emotion",
  "aspectRatio", "duration", "styleContract", "references", "shots",
  "cameraDirections", "audioDesign", "onScreenText", "spokenDialogue",
  "preservationRules", "negativeConstraints",
];
const missingFields = requiredFields.filter((f) => merged[f as keyof typeof merged] === undefined);
if (missingFields.length === 0) {
  console.log(`   ✅ Tous les ${requiredFields.length} champs requis sont présents après merge`);
} else {
  console.log(`   ❌ Champs manquants après merge : ${missingFields.join(", ")}`);
}

console.log(`\n${passed === checks.length ? "🎉" : "⚠️"} Test E2E terminé.`);
process.exit(passed === checks.length ? 0 : 2);

/**
 * Smoke test E2E du service Gemini.
 * Lit la clé depuis .env, fait un vrai appel optimizeH3Prompt sur un projet
 * miniature, affiche le streaming chunk par chunk, et valide la sortie.
 *
 * Usage : npx tsx scripts/test-gemini-e2e.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { optimizeH3Prompt, getApiKey, GeminiError } from "../src/services/gemini";
import { INITIAL_PROJECT_DATA } from "../src/constants/presets";

// Lit le .env à la mano (on est en script, pas dans Vite)
function readEnvVar(name: string): string | null {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === name) {
        let v = m[2];
        // Strip surrounding quotes
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return v || null;
      }
    }
  } catch {
    /* .env absent */
  }
  return null;
}

const apiKey = readEnvVar("VITE_GEMINI_API_KEY");
if (!apiKey) {
  console.error("❌ VITE_GEMINI_API_KEY absente de .env");
  process.exit(1);
}
console.log(`✅ Clé chargée (${apiKey.length} chars, format ${apiKey.slice(0, 3)}...)`);

// Mini projet de test
const project = {
  ...INITIAL_PROJECT_DATA,
  title: "Smoke Test E2E Gemini",
  videoType: "pub_produit" as const,
  videoGoal: "vendre" as const,
  emotion: "élégance, mystère, sensualité",
  duration: "10s" as const,
  aspectRatio: "16:9" as const,
  styleContract: {
    ...INITIAL_PROJECT_DATA.styleContract,
    condensedEnglishSentence:
      "Cinematic 4K product commercial for a luxury perfume bottle on black velvet, warm amber rim light, slow camera orbit, photorealistic render.",
  },
  shots: [
    {
      id: "shot1",
      shotNumber: 1,
      visualDescription: "Black velvet surface with golden light reflections",
      subjectAction: "Slow camera dolly forward revealing the perfume bottle",
      atmosphere: "Mysterious, elegant, intimate",
    },
    {
      id: "shot2",
      shotNumber: 2,
      timestamp: "00:04.000",
      visualDescription: "Extreme close-up on the golden cap of the bottle",
      subjectAction: "Camera orbit around the cap, soft light flares",
      atmosphere: "Precious, refined",
    },
  ],
  audioDesign: {
    isSilent: true,
    ambientSound: "",
    keySFX: "",
    hasMusic: false,
    musicDescription: "",
    hasVoiceoverOrDialogue: false,
    voiceType: "none" as const,
    spokenLanguage: "",
    voiceTone: "",
  },
  negativeConstraints: [
    { id: "n1", text: "no subtitles" },
    { id: "n2", text: "no lens flares" },
    { id: "n3", text: "no extra people" },
  ],
};

console.log("\n📞 Appel optimizeH3Prompt (avec streaming)...\n");

let chunkCount = 0;
let firstChunkAt = 0;
const start = Date.now();

try {
  const result = await optimizeH3Prompt({
    apiKey,
    project,
    onChunk: (text) => {
      chunkCount++;
      if (chunkCount === 1) firstChunkAt = Date.now() - start;
      // On affiche les 60 premiers chars de chaque chunk pour voir le flux
      const preview = text.length > 60 ? text.slice(0, 60) + "..." : text;
      process.stdout.write(`  [chunk ${chunkCount}] ${preview}\n`);
    },
  });

  const totalMs = Date.now() - start;
  console.log(`\n✅ Appel réussi en ${totalMs}ms (TTFB: ${firstChunkAt}ms, ${chunkCount} chunks)`);
  console.log(`📝 Longueur du prompt optimisé : ${result.length} chars`);
  console.log("\n--- Prompt optimisé complet ---");
  console.log(result);
  console.log("--- Fin ---\n");

  // Validation : doit contenir les blocs H3 de base
  const hasStyleBlock = /\[STYLE/i.test(result);
  const hasTimelineBlock = /\[TIMELINE|TIMING|SHOT/i.test(result);
  const hasAudioBlock = /\[AUDIO/i.test(result);
  const hasNegatives = /\[NEGATIVE/i.test(result);

  console.log("🔍 Validation de la structure H3 :");
  console.log(`   [STYLE]     : ${hasStyleBlock ? "✅" : "❌"}`);
  console.log(`   [TIMELINE]  : ${hasTimelineBlock ? "✅" : "❌"}`);
  console.log(`   [AUDIO]     : ${hasAudioBlock ? "✅" : "❌"}`);
  console.log(`   [NEGATIVE]  : ${hasNegatives ? "✅" : "❌"}`);

  if (hasStyleBlock && hasTimelineBlock && hasAudioBlock && hasNegatives) {
    console.log("\n🎉 Test E2E réussi ! Le service Gemini est opérationnel.");
    process.exit(0);
  } else {
    console.log("\n⚠️  Prompt reçu mais structure H3 incomplète.");
    process.exit(2);
  }
} catch (err) {
  if (err instanceof GeminiError) {
    console.error(`\n❌ GeminiError [${err.code}${err.status ? " " + err.status : ""}] : ${err.message}`);
  } else {
    console.error("\n❌ Erreur inattendue :", err);
  }
  process.exit(1);
}

/**
 * Service Gemini (Google AI Studio / Generative Language API).
 *
 * Responsabilités :
 * - Optimiser un prompt MiniMax H3 déjà compilé, en streaming SSE pour l'UX
 * - Suggérer un contenu pour un champ vide du projet (option avancée)
 *
 * Design :
 * - Pas de SDK Google : on parle directement à l'API REST via fetch
 *   (évite ~200 KB de bundle supplémentaire).
 * - `optimizeH3Prompt` stream les chunks via un callback `onChunk` que
 *   App.tsx utilise pour afficher le prompt qui s'écrit en temps réel.
 * - Timeout dur 30 s sur tous les appels (AbortController).
 * - Erreurs typées : on remonte un `GeminiError` avec un message FR clair
 *   pour que l'UI puisse afficher un toast/bandeau sans parser du JSON Google.
 *
 * Configuration :
 * - Clé attendue : VITE_GEMINI_API_KEY (lue par `getApiKey`)
 * - Modèle par défaut : `gemini-flash-latest` (pointeur auto vers le
 *   dernier Flash stable, compatible nouveaux comptes)
 * - Pas d'auth par header `x-goog-api-key` supporté officiellement, on
 *   l'utilise quand même car c'est le mode simple, et Gemini le tolère.
 */

import type { ProjectData } from "../types/minimax";
import { compileMiniMaxH3Prompt } from "../utils/compiler";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
// Note : `gemini-flash-latest` pointe vers `gemini-3.7-flash` qui a un quota
// gratuit de seulement 20 req/jour. `gemini-3.5-flash` a un quota séparé
// et plus généreux, c'est notre défaut.
const DEFAULT_MODEL = "gemini-3.5-flash";
const REQUEST_TIMEOUT_MS = 30_000;

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "no_api_key"
      | "invalid_key"
      | "rate_limited"
      | "timeout"
      | "server_error"
      | "network"
      | "unknown",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

/**
 * Récupère la clé API depuis l'environnement Vite.
 * Renvoie `null` si la variable n'est pas définie (l'app doit alors
 * basculer sur le mode dégradé sans Gemini).
 */
export function getApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (typeof key === "string" && key.trim().length > 10) return key.trim();
  return null;
}

// ---------------------------------------------------------------------------
// System prompt : la "personnalité" de l'optimiseur H3
// ---------------------------------------------------------------------------

const H3_OPTIMIZER_SYSTEM_PROMPT = `Tu es un expert senior en prompting vidéo pour le modèle MiniMax H3.

Tu reçois un prompt H3 déjà structuré en blocs techniques ([STYLE CONTRACT], [TIMELINE & SHOTS], [AUDIO DESIGN], [ON-SCREEN TEXT & DIALOGUE], [PRESERVATION & REFERENCES], [NEGATIVE CONSTRAINTS]) et ta mission est de l'ENRICHIR pour le rendre plus cinématographique, plus évocateur, et plus efficace auprès de MiniMax H3.

Règles strictes (non négociables) :
1. Tu CONSERVES la structure en blocs avec leurs titres en MAJUSCULES entre crochets. Tu ne fusionnes ni ne supprimes aucun bloc.
2. Tu CONSERVES toutes les contraintes techniques : timestamps (00:04.000), durées, negative constraints (no subtitles, no morphing, etc.), nombre de plans.
3. Tu CONSERVES tout le vocabulaire technique H3 existant (tracking shot, dolly, pan, orbit, close-up, golden hour, etc.).
4. Tu CONSERVES tout ce qui est factuel et précis (noms de produits, marques, lieux, ingrédients, dialogues mot pour mot).
5. Tu AMÉLIORES uniquement le vocabulaire descriptif et atmosphérique : adjectifs évocateurs, précisions sensorielles, références cinématographiques pertinentes. Par exemple :
   - "lumière douce" → "warm cinematic lighting with soft amber tones and gentle rim light"
   - "vue de la ville" → "sweeping urban skyline bathed in twilight blue"
   - "musique élégante" → "elegant minimalist piano underscore with subtle string swells"
6. Tu n'AJOUTES AUCUN fait nouveau qui n'était pas dans l'input utilisateur : pas d'invention de personnages, lieux, actions, produits, événements.
7. Tu n'écris RIEN avant ou après le prompt amélioré : ni préambule, ni explication, ni markdown, ni code fences.
8. Tu écris UNIQUEMENT en anglais, le format H3 est en anglais.
9. Tu vises un prompt 20-40% plus riche qu'à l'entrée, pas 5x plus long. La densité d'information prime sur la verbosité.

Réponds UNIQUEMENT avec le prompt H3 amélioré, point final.`;

// ---------------------------------------------------------------------------
// User prompt : on contextualise le brief pour que Gemini comprenne
// ---------------------------------------------------------------------------

function buildUserPrompt(project: ProjectData, currentPrompt: string): string {
  const styleSentence = project.styleContract?.condensedEnglishSentence || "(non renseigné)";
  return `Brief du projet :
- Type de vidéo : ${project.videoType}
- Objectif principal : ${project.videoGoal}
- Émotion / ambiance cible : ${project.emotion || "(non renseignée)"}
- Durée : ${project.duration}
- Format : ${project.aspectRatio}
- Style contract (1 phrase anglaise) : "${styleSentence}"

Prompt H3 actuel à améliorer :
---
${currentPrompt}
---

Renvoie le prompt H3 amélioré, conforme aux règles système, sans rien autour.`;
}

// ---------------------------------------------------------------------------
// Streaming SSE parser (Server-Sent Events de Google)
// ---------------------------------------------------------------------------

/**
 * Parse une réponse SSE Gemini et invoque `onChunk(text)` pour chaque
 * bout de texte reçu. Renvoie le texte complet concaténé.
 *
 * Format SSE Gemini : "data: {json}\n\n" répété. Le payload est
 * { candidates: [{ content: { parts: [{ text: "..." }] } }] }.
 */
async function consumeSseStream(
  response: Response,
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  if (!response.body) {
    throw new GeminiError("Réponse Gemini sans corps lisible", "server_error");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";

  try {
    while (true) {
      if (signal.aborted) {
        throw new GeminiError("Appel annulé par l'utilisateur", "unknown");
      }
      const { value, done } = await reader.read();
      if (done) break;
      // Gemini utilise des fins de ligne CRLF (cf. format HTTP/SSE) :
      // on normalise en LF pour que les séparateurs d'événements (\n\n)
      // soient bien détectés. Sans ce fix, \r\n\r\n ne contient pas
      // la sous-chaîne \n\n, et le parser reste bloqué.
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      // Un event SSE se termine par une ligne vide (\n\n). On split sur ça.
      let sepIndex: number;
      while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
        const eventBlock = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);

        // On ne garde que les lignes "data: ..." (ignorer "event:", "id:", etc.)
        const dataLines = eventBlock
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim());

        if (dataLines.length === 0) continue;
        const json = dataLines.join("\n");

        // Le marqueur "[DONE]" termine le stream (pas utilisé par Gemini
        // actuellement, mais on gère par sécurité)
        if (json === "[DONE]") continue;

        try {
          const payload = JSON.parse(json);
          const text = payload?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text || "")
            .join("");
          if (text) {
            fullText += text;
            onChunk(text);
          }
        } catch {
          // Chunk mal formé (rare), on continue
        }
      }
    }
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    throw new GeminiError(
      `Lecture du stream interrompue : ${err instanceof Error ? err.message : String(err)}`,
      "network",
    );
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

// ---------------------------------------------------------------------------
// Public API : optimizeH3Prompt (la fonction principale)
// ---------------------------------------------------------------------------

export interface OptimizeH3Options {
  apiKey: string;
  project: ProjectData;
  /** Prompt H3 déjà compilé qu'on veut améliorer. Si omis, on le recompile. */
  currentPrompt?: string;
  /** Modèle Gemini à utiliser. */
  model?: string;
  /** Callback streaming : appelé pour chaque chunk de texte reçu. */
  onChunk?: (text: string) => void;
  /** Permet d'annuler l'appel depuis l'UI. */
  signal?: AbortSignal;
}

/**
 * Optimise un prompt H3 via Gemini en streaming.
 *
 * @returns Le prompt complet optimisé (string).
 * @throws {GeminiError} en cas d'erreur API / réseau / quota / clé invalide.
 */
export async function optimizeH3Prompt(opts: OptimizeH3Options): Promise<string> {
  const {
    apiKey,
    project,
    currentPrompt,
    model = DEFAULT_MODEL,
    onChunk,
    signal,
  } = opts;

  if (!apiKey) {
    throw new GeminiError("Aucune clé API configurée", "no_api_key");
  }

  const prompt = currentPrompt ?? compileMiniMaxH3Prompt(project);
  const userPrompt = buildUserPrompt(project, prompt);

  // Timeout dur : si Gemini ne répond pas en 30s, on annule
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // Si l'UI passe son propre signal, on le chaîne
  if (signal) {
    if (signal.aborted) controller.abort();
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: H3_OPTIMIZER_SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096,
            // On désactive le thinking (mode "réflexion profonde" du modèle)
            // parce que pour optimiser un prompt, on n'en a pas besoin.
            // Effet : la réponse est plus rapide (~3-5s au lieu de 20s)
            // et le streaming devient réellement progressif (chunks visibles
            // au fur et à mesure au lieu d'un seul gros bloc en sortie).
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
        signal: controller.signal,
      },
    );
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new GeminiError(
        "Gemini a mis trop de temps à répondre (30s). Réessaie.",
        "timeout",
      );
    }
    throw new GeminiError(
      `Impossible de joindre Gemini : ${err instanceof Error ? err.message : String(err)}`,
      "network",
    );
  }

  clearTimeout(timeout);

  // Erreur API : on tente un fallback vers le non-streaming si c'est un 503
  // (le streaming endpoint est plus sujet à la surcharge côté Google que
  // l'endpoint classique generateContent).
  if (!response.ok) {
    // 503 / 500 / 502 → fallback non-streaming
    if (response.status === 503 || response.status === 502 || response.status === 500) {
      // On tente le fallback
      const fallbackResult = await tryNonStreamingFallback({
        apiKey,
        model,
        userPrompt,
        onChunk,
      });
      if (fallbackResult !== null) return fallbackResult;
    }

    // Sinon on parse l'erreur et on throw
    let detail = "";
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || "";
    } catch {
      /* ignore */
    }
    if (response.status === 401 || response.status === 403) {
      throw new GeminiError(
        "Clé API invalide ou restreinte. Vérifie VITE_GEMINI_API_KEY dans .env.",
        "invalid_key",
        response.status,
      );
    }
    if (response.status === 429) {
      throw new GeminiError(
        "Quota Gemini dépassé. Attends quelques minutes ou augmente ta limite.",
        "rate_limited",
        response.status,
      );
    }
    if (response.status >= 500) {
      throw new GeminiError(
        `Gemini a une erreur serveur (${response.status}). ${detail}`.trim(),
        "server_error",
        response.status,
      );
    }
    throw new GeminiError(
      `Erreur Gemini ${response.status}. ${detail}`.trim(),
      "unknown",
      response.status,
    );
  }

  return consumeSseStream(
    response,
    (text) => onChunk?.(text),
    controller.signal,
  );
}

/**
 * Fallback non-streaming : appelle generateContent (sans :streamGenerateContent)
 * et renvoie le texte en un seul chunk via onChunk. Renvoie `null` en cas
 * d'échec pour que l'appelant puisse remonter l'erreur originale.
 */
async function tryNonStreamingFallback(opts: {
  apiKey: string;
  model: string;
  userPrompt: string;
  onChunk?: (text: string) => void;
}): Promise<string | null> {
  try {
    const r = await fetch(
      `${GEMINI_API_BASE}/models/${opts.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": opts.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: opts.userPrompt }] }],
          systemInstruction: {
            parts: [{ text: H3_OPTIMIZER_SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    );
    if (!r.ok) return null;
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || "")
      .join("");
    if (!text) return null;
    // On simule le streaming avec un seul chunk pour l'UX
    opts.onChunk?.(text);
    return text;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sanity check : permet de vérifier la clé au démarrage de l'app
// ---------------------------------------------------------------------------

/**
 * Test rapide de la clé (1 token input, 1 token output).
 * Renvoie `true` si la clé est valide et que le modèle répond.
 */
export async function pingGemini(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${DEFAULT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
        }),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Mode "Brief" : transformer un brief libre en projet H3 structuré
// ---------------------------------------------------------------------------

/**
 * Helper : exécute un appel generateContent avec retry automatique sur
 * 503/502/500 (Google est notoire pour renvoyer 503 temporaires).
 * Les 401/403/429 (erreurs définitives) ne sont PAS retentés.
 */
async function generateContentWithRetry(
  url: string,
  apiKey: string,
  body: unknown,
  options: { maxRetries?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  const { maxRetries = 2, baseDelayMs = 1500 } = options;
  let lastResponse: Response | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      // Si réponse OK ou erreur définitive (4xx sauf 429), on retourne direct
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res;
      }

      // 503/502/500 ou 429 : on retente après un délai
      lastResponse = res;
      if (attempt < maxRetries) {
        // Délai exponentiel : 1.5s, 3s, 6s...
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      // Erreur réseau (DNS, connection lost, etc.)
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error("Unknown error after retries");
}

/**
 * Question de clarification posée à l'utilisateur après l'analyse du brief.
 * On limite à 2-3 questions max, chacune avec 3-5 options concrètes.
 * `allowSkip: true` ajoute une option "Choisis pour moi" en bout de liste.
 */
export interface ClarificationQuestion {
  id: string;
  question: string;
  options: { value: string; label: string }[];
  allowSkip: boolean;
}

export interface ClarificationAnswer {
  questionId: string;
  /** Valeur de l'option choisie, ou null si "Choisis pour moi" / passé. */
  value: string | null;
}

const BRIEF_QUESTION_GENERATOR_SYSTEM = `Tu es un assistant de clarification pour MiniMax H3, un modèle de génération vidéo IA.

On te donne un brief libre d'un utilisateur (description d'idée de vidéo). Tu dois identifier 2 ou 3 questions OBJECTIVES et CONCISES qui permettent de mieux structurer le brief en projet H3.

Règles strictes :
- Tu poses ENTRE 2 ET 3 questions MAXIMUM. Pas plus, pas moins.
- Chaque question est FACTUELLE (pas subjective) et a 3 à 5 options CONCRÈTES.
- Tu n'inventes PAS d'information que l'utilisateur n'a pas donnée : si le brief est trop vague sur un aspect (ex: format, durée, public), c'est justement pour ça que tu poses la question.
- L'ID de chaque question doit être en kebab-case anglais (ex: "format", "duree", "public-cible", "ton").
- Le champ "question" est en français, court et direct (max 8 mots).
- Le champ "options" propose 3 à 5 choix courts, chacun avec un "value" (valeur technique, anglais) et un "label" (texte affiché en français, max 5 mots).
- Le champ "allowSkip" est toujours true (l'utilisateur peut dire "Choisis pour moi").
- Tu ne retournes RIEN d'autre que le JSON. Pas de markdown, pas de préambule.

Exemples de BONNES questions :
- {"id": "format", "question": "Format d'image cible ?", "options": [{"value": "16:9", "label": "16:9 (YouTube, web)"}, {"value": "9:16", "label": "9:16 (TikTok, Reels)"}, {"value": "1:1", "label": "1:1 (Instagram)"}], "allowSkip": true}
- {"id": "duree", "question": "Durée de la vidéo ?", "options": [{"value": "5s", "label": "5s (format court)"}, {"value": "10s", "label": "10s (standard)"}, {"value": "15s", "label": "15s (étendu)"}, {"value": "30s", "label": "30s (premium)"}], "allowSkip": true}

Format de sortie OBLIGATOIRE (et RIEN d'autre, JSON strict) :
{
  "questions": [
    { "id": "...", "question": "...", "options": [...], "allowSkip": true }
  ]
}`;

const BRIEF_TO_PROJECT_SYSTEM = `Tu es un directeur artistique expert en MiniMax H3 (modèle de génération vidéo IA).

On te donne :
1. Un brief libre de l'utilisateur (description de son idée de vidéo)
2. Les réponses de l'utilisateur à 2-3 questions de clarification

Tu dois transformer ce brief en un objet JSON STRICT conforme au schéma ProjectData de MiniMax H3, en remplissant intelligemment les champs à partir du brief.

Règles strictes :
- Tu ne renvoies QUE le JSON, rien d'autre. Pas de markdown, pas de préambule, pas d'explication.
- Tu respectes SCRUPULEUSEMENT le schéma JSON fourni.
- Pour les champs énumérés (videoType, videoGoal, aspectRatio, duration, framing, angle, motion, speed), tu utilises EXACTEMENT les valeurs autorisées (cf. schéma).
- Tu NE INVENTES PAS d'information nouvelle : si le brief ne parle pas d'un aspect, tu mets une valeur par défaut raisonnable (cf. schéma).
- Tu fais des CHOIX ARTISTIQUES cohérents : si l'utilisateur dit "publicité parfum luxe", tu choisis un style "luxe" pas "streetwear", une ambiance "élégance" pas "énergie brute", etc.
- Pour shots : tu proposes 2-4 plans cohérents avec la durée (5s = 1-2 plans, 10s = 2-3 plans, 15s = 3-4 plans, 30s = 4-6 plans).
- Pour cameraDirections : tu assignes un cadrage, angle, mouvement et vitesse par plan, en cohérence avec le story-telling.
- Pour audioDesign : si isSilent=true, mets hasMusic=false, ambientSound="", etc.
- Pour negativeConstraints : tu mets 3 à 5 items génériques toujours pertinents (no subtitles, no morphing defects, no watermarks, etc.).
- Le title est un résumé court du brief (max 6 mots), tu le déduis du brief.

Format de sortie : JSON strict valide conforme au schéma ci-dessous. Aucun texte autour.`;

const PROJECT_DATA_JSON_SCHEMA = `{
  "title": string,                    // ex: "Publicité Parfum Luxe"
  "videoType": "pub_produit" | "court_metrage" | "animation_2d" | "trailer" | "doublage" | "edition_video" | "autre",
  "videoGoal": "vendre" | "teaser" | "raconter" | "demonstrer" | "annoncer",
  "emotion": string,                  // ex: "élégance, mystère, sensualité"
  "aspectRatio": "16:9" | "9:16" | "1:1" | "4:3" | "21:9",
  "duration": "5s" | "10s" | "15s" | "30s",
  "styleContract": {
    "medium": string,                 // ex: "Cinematic 4K"
    "texture": string,                // ex: "hyper-detailed metallic gloss"
    "palette": string,                // ex: "warm amber and deep black"
    "era": string,                    // ex: "contemporary luxury"
    "visualRendering": string,        // ex: "photorealistic commercial render"
    "fps"?: string,                   // ex: "24 FPS" (optionnel)
    "condensedEnglishSentence": string  // ex: "Cinematic 4K luxury perfume ad, golden light, slow camera orbit"
  },
  "shots": [
    {
      "id": string,                   // "shot_1", "shot_2", ...
      "shotNumber": number,           // 1, 2, 3, ...
      "timestamp"?: string,           // ex: "00:04.000" pour plan 2+
      "visualDescription": string,    // ex: "Black velvet surface with golden light reflections"
      "subjectAction": string,        // ex: "Slow camera dolly forward revealing the perfume bottle"
      "atmosphere": string,           // ex: "Mysterious, elegant, intimate"
      "transition"?: string           // ex: "Cut to next shot" (optionnel)
    }
  ],
  "cameraDirections": {
    "shot_1": {                       // clé = id du shot
      "shotId": "shot_1",
      "framing": "wide" | "medium" | "close_up" | "extreme_close_up" | "establishing",
      "angle": "eye_level" | "low_angle" | "high_angle" | "birds_eye" | "dutch_angle",
      "motion": "static" | "tracking_forward" | "tracking_backward" | "panning_left" | "panning_right" | "orbit" | "crane_up" | "crane_down" | "handheld" | "zoom_in" | "zoom_out",
      "speed": "subtle" | "smooth" | "fast" | "dynamic"
    }
  },
  "audioDesign": {
    "isSilent": boolean,
    "ambientSound": string,           // ex: "soft wind chimes, intimate atmosphere"
    "keySFX": string,                 // ex: "subtle glass clink at 00:02.000"
    "hasMusic": boolean,
    "musicDescription": string,       // ex: "elegant piano with subtle string swells"
    "hasVoiceoverOrDialogue": boolean,
    "voiceType": "voiceover" | "dialogue" | "both" | "none",
    "spokenLanguage": string,         // ex: "French"
    "voiceTone": string               // ex: "féminine grave, sensuelle, posée"
  },
  "onScreenText": {
    "hasText": boolean,
    "exactString": string             // ex: "ESSENCE DE NUIT"
  },
  "spokenDialogue": {
    "hasDialogue": boolean,
    "languageCode": string,           // ex: "French"
    "exactLines": string              // ex: "Découvrez l'élégance absolue."
  },
  "preservationRules": {
    "elementsToPreserve": string,     // ex: "Conserver la géométrie du flacon, la couleur du verre et le logo doré"
    "mistakesToAvoid": string         // ex: "Éviter les déformations du bouchon et les transitions floues"
  },
  "negativeConstraints": [
    { "id": string, "text": string }  // 3 à 5 items, ex: "no subtitles", "no morphing defects", "no watermarks"
  ]
}`;

/**
 * Analyse un brief libre et génère 2-3 questions de clarification objectives.
 * Renvoie un tableau de questions (toujours 2 ou 3 éléments).
 */
export async function analyzeBriefForQuestions(
  brief: string,
  apiKey: string,
  model: string = DEFAULT_MODEL,
): Promise<ClarificationQuestion[]> {
  if (!brief.trim()) {
    throw new GeminiError("Brief vide", "unknown");
  }

  const response = await generateContentWithRetry(
    `${GEMINI_API_BASE}/models/${model}:generateContent`,
    apiKey,
    {
      contents: [
        { parts: [{ text: `Brief utilisateur :\n---\n${brief}\n---\n\nGénère 2-3 questions de clarification pertinentes.` }] },
      ],
      systemInstruction: { parts: [{ text: BRIEF_QUESTION_GENERATOR_SYSTEM }] },
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
        // Force la sortie en JSON strict
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    { maxRetries: 2, baseDelayMs: 1500 },
  );

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || "";
    } catch { /* ignore */ }
    if (response.status === 401 || response.status === 403) {
      throw new GeminiError("Clé API invalide.", "invalid_key", response.status);
    }
    if (response.status === 429) {
      throw new GeminiError("Quota Gemini dépassé.", "rate_limited", response.status);
    }
    throw new GeminiError(
      `Erreur Gemini ${response.status}. ${detail}`.trim(),
      "server_error",
      response.status,
    );
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new GeminiError("Gemini a renvoyé une réponse vide.", "server_error");
  }

  // Gemini peut wrapper le JSON dans du markdown ```json ... ``` ou ajouter
  // du texte avant/après malgré responseMimeType. On extrait le bloc JSON
  // de manière défensive.
  const extracted = extractJsonBlock(raw);
  let parsed: { questions?: ClarificationQuestion[] };
  try {
    parsed = JSON.parse(extracted);
  } catch (err) {
    throw new GeminiError(
      `Gemini a renvoyé du JSON invalide : ${err instanceof Error ? err.message : ""}`,
      "server_error",
    );
  }

  const questions = parsed.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new GeminiError("Gemini n'a généré aucune question.", "server_error");
  }

  // Filet de sécurité : on borne à 2-3 questions, on valide chaque option
  return questions.slice(0, 3).map((q) => ({
    id: String(q.id || "unknown"),
    question: String(q.question || ""),
    options: Array.isArray(q.options)
      ? q.options
          .filter((o) => o && typeof o.value === "string" && typeof o.label === "string")
          .map((o) => ({ value: o.value, label: o.label }))
      : [],
    allowSkip: true, // toujours autoriser le skip
  }));
}

/**
 * Transforme un brief + les clarifications en un projet H3 partiel.
 * Le retour couvre les champs principaux du wizard (étapes 1-8).
 * L'étape 9 (génération prompt) reste calculée à la volée.
 */
export async function briefToProject(
  brief: string,
  clarifications: ClarificationAnswer[],
  apiKey: string,
  model: string = DEFAULT_MODEL,
): Promise<Partial<ProjectData>> {
  if (!brief.trim()) {
    throw new GeminiError("Brief vide", "unknown");
  }

  // On sérialise les clarifications dans le user prompt
  const clarifText = clarifications
    .filter((c) => c.value !== null)
    .map((c, i) => `${i + 1}. [${c.questionId}] → ${c.value}`)
    .join("\n");

  const userPrompt = `Brief utilisateur :
---
${brief}
---

Réponses aux questions de clarification :
${clarifText || "(aucune, l'utilisateur a tout passé — choisis les valeurs par défaut les plus cohérentes avec le brief)"}

Génère le JSON du projet H3 conforme au schéma. UNIQUEMENT le JSON, rien autour.`;

  const response = await generateContentWithRetry(
    `${GEMINI_API_BASE}/models/${model}:generateContent`,
    apiKey,
    {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: BRIEF_TO_PROJECT_SYSTEM }] },
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    { maxRetries: 2, baseDelayMs: 1500 },
  );

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || "";
    } catch { /* ignore */ }
    if (response.status === 401 || response.status === 403) {
      throw new GeminiError("Clé API invalide.", "invalid_key", response.status);
    }
    if (response.status === 429) {
      throw new GeminiError("Quota Gemini dépassé.", "rate_limited", response.status);
    }
    throw new GeminiError(
      `Erreur Gemini ${response.status}. ${detail}`.trim(),
      "server_error",
      response.status,
    );
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new GeminiError("Gemini a renvoyé une réponse vide.", "server_error");
  }

  let parsed: Partial<ProjectData>;
  try {
    parsed = JSON.parse(extractJsonBlock(raw));
  } catch (err) {
    throw new GeminiError(
      `Gemini a renvoyé du JSON invalide : ${err instanceof Error ? err.message : ""}`,
      "server_error",
    );
  }

  // Normalisation : Gemini n'a pas toujours respecté le schéma. On mappe
  // les synonymes, fixe les types, complète les champs manquants.
  return normalizeBriefResult(parsed);
}

/**
 * Extrait le bloc JSON principal d'une réponse Gemini brute.
 * Gère les cas où Gemini wrappe dans ```json ... ```, ``` ... ```,
 * ou ajoute du texte avant/après.
 */
function extractJsonBlock(raw: string): string {
  // 1. Strip des fences markdown ```json ... ``` ou ``` ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // 2. Pas de fence : on cherche le premier { et le dernier } correspondant
  const firstBrace = raw.indexOf("{");
  if (firstBrace === -1) return raw; // pas de JSON visible, on tente brut

  // On cherche le dernier } en respectant l'imbrication
  let depth = 0;
  let lastBrace = -1;
  for (let i = firstBrace; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") {
      depth--;
      if (depth === 0) {
        lastBrace = i;
        break;
      }
    }
  }

  if (lastBrace === -1) return raw; // pas de fermeture, on tente brut
  return raw.slice(firstBrace, lastBrace + 1);
}

// ---------------------------------------------------------------------------
// Normalisation post-génération : robuste aux approximations de Gemini
// ---------------------------------------------------------------------------

const VIDEO_TYPE_SYNONYMS: Record<string, string> = {
  commercial: "pub_produit",
  pub: "pub_produit",
  advertisement: "pub_produit",
  ad: "pub_produit",
  "publicité": "pub_produit",
  "short film": "court_metrage",
  "court-métrage": "court_metrage",
  short: "court_metrage",
  anime: "animation_2d",
  "2d": "animation_2d",
  "3d": "autre",
  "motion design": "autre",
  musicvideo: "autre",
  "music video": "autre",
  "clip": "autre",
  teaser: "trailer",
  trailer: "trailer",
  "lip-sync": "doublage",
  lipsync: "doublage",
  editing: "edition_video",
  "video editing": "edition_video",
};

const VIDEO_GOAL_SYNONYMS: Record<string, string> = {
  branding: "vendre",
  sell: "vendre",
  sales: "vendre",
  promote: "vendre",
  promotion: "vendre",
  "promouvoir": "vendre",
  advertise: "vendre",
  conversion: "vendre",
  storytelling: "raconter",
  story: "raconter",
  narrate: "raconter",
  "raconter": "raconter",
  explain: "demonstrer",
  demo: "demonstrer",
  tutoriel: "demonstrer",
  tutorial: "demonstrer",
  howto: "demonstrer",
  announce: "annoncer",
  "annonce": "annoncer",
  event: "annoncer",
  hype: "teaser",
  curiosity: "teaser",
  "buzz": "teaser",
};

const ASPECT_RATIO_SYNONYMS: Record<string, string> = {
  "16/9": "16:9",
  "1920x1080": "16:9",
  horizontal: "16:9",
  paysage: "16:9",
  landscape: "16:9",
  youtube: "16:9",
  web: "16:9",
  "9/16": "9:16",
  "1080x1920": "9:16",
  vertical: "9:16",
  portrait: "9:16",
  tiktok: "9:16",
  reels: "9:16",
  shorts: "9:16",
  "1/1": "1:1",
  square: "1:1",
  carre: "1:1",
  instagram: "1:1",
  "4/3": "4:3",
  "21/9": "21:9",
  ultrawide: "21:9",
  cinema: "21:9",
};

const DURATION_SYNONYMS: Record<string, string> = {
  "5": "5s",
  "10": "10s",
  "15": "15s",
  "30": "30s",
  "5s": "5s",
  "10s": "10s",
  "15s": "15s",
  "30s": "30s",
  "5 seconds": "5s",
  "10 seconds": "10s",
  "15 seconds": "15s",
  "30 seconds": "30s",
  court: "5s",
  short: "5s",
  medium: "10s",
  long: "15s",
  extended: "30s",
};

const FRAMING_SYNONYMS: Record<string, string> = {
  ws: "wide",
  ms: "medium",
  cu: "close_up",
  ecu: "extreme_close_up",
  est: "establishing",
  "establishing shot": "establishing",
};

const ANGLE_SYNONYMS: Record<string, string> = {
  eye: "eye_level",
  "eye level": "eye_level",
  normal: "eye_level",
  low: "low_angle",
  high: "high_angle",
  overhead: "birds_eye",
  aerial: "birds_eye",
  drone: "birds_eye",
  dutch: "dutch_angle",
  tilt: "dutch_angle",
};

const MOTION_SYNONYMS: Record<string, string> = {
  still: "static",
  none: "static",
  fixed: "static",
  dolly: "tracking_forward",
  "dolly in": "tracking_forward",
  "dolly out": "tracking_backward",
  "dolly forward": "tracking_forward",
  "dolly backward": "tracking_backward",
  pan: "panning_right",
  "pan left": "panning_left",
  "pan right": "panning_right",
  360: "orbit",
  orbital: "orbit",
  "crane up": "crane_up",
  "crane down": "crane_down",
  "hand held": "handheld",
  "hand-held": "handheld",
  shoulder: "handheld",
  zoom: "zoom_in",
};

function normalizeEnum(
  value: unknown,
  synonyms: Record<string, string>,
  fallback: string,
): string {
  if (typeof value !== "string") return fallback;
  const lower = value.toLowerCase().trim();
  if (synonyms[lower]) return synonyms[lower];
  // Si la valeur est déjà valide (présente dans les valeurs du schéma), on la garde
  if (Object.values(synonyms).includes(lower)) return lower;
  return fallback;
}

function normalizeDuration(value: unknown, fallback: string): string {
  if (typeof value === "number") {
    const s = `${value}s`;
    return DURATION_SYNONYMS[s] || fallback;
  }
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (DURATION_SYNONYMS[lower]) return DURATION_SYNONYMS[lower];
    if (/^\d+$/.test(lower)) return DURATION_SYNONYMS[lower] || `${lower}s`;
  }
  return fallback;
}

function normalizeBriefResult(parsed: Partial<ProjectData>): Partial<ProjectData> {
  const out: Partial<ProjectData> = { ...parsed };

  // Champs énumérés
  if (out.videoType !== undefined) {
    out.videoType = normalizeEnum(out.videoType, VIDEO_TYPE_SYNONYMS, "autre") as ProjectData["videoType"];
  }
  if (out.videoGoal !== undefined) {
    out.videoGoal = normalizeEnum(out.videoGoal, VIDEO_GOAL_SYNONYMS, "raconter") as ProjectData["videoGoal"];
  }
  if (out.aspectRatio !== undefined) {
    out.aspectRatio = normalizeEnum(out.aspectRatio, ASPECT_RATIO_SYNONYMS, "16:9") as ProjectData["aspectRatio"];
  }
  if (out.duration !== undefined) {
    out.duration = normalizeDuration(out.duration, "10s") as ProjectData["duration"];
  }

  // emotion : peut être manquant, on met un défaut
  if (typeof out.emotion !== "string" || out.emotion.trim().length === 0) {
    out.emotion = "élégance, raffinement";
  }

  // styleContract : peut être partiel ou absent, on garantit un objet complet
  if (!out.styleContract || typeof out.styleContract !== "object") {
    out.styleContract = {
      medium: "Cinematic 4K",
      texture: "smooth, premium",
      palette: "warm amber and deep black",
      era: "contemporary",
      visualRendering: "photorealistic",
      condensedEnglishSentence: "Cinematic 4K commercial with warm amber lighting, smooth premium texture, photorealistic render.",
    };
  } else {
    const sc = out.styleContract;
    if (typeof sc.medium !== "string" || !sc.medium.trim()) sc.medium = "Cinematic 4K";
    if (typeof sc.texture !== "string" || !sc.texture.trim()) sc.texture = "smooth, premium";
    if (typeof sc.palette !== "string" || !sc.palette.trim()) sc.palette = "warm amber and deep black";
    if (typeof sc.era !== "string" || !sc.era.trim()) sc.era = "contemporary";
    if (typeof sc.visualRendering !== "string" || !sc.visualRendering.trim()) sc.visualRendering = "photorealistic";
    if (typeof sc.condensedEnglishSentence !== "string" || sc.condensedEnglishSentence.trim().length === 0) {
      sc.condensedEnglishSentence = `${sc.medium} commercial, ${sc.palette}, ${sc.texture} texture, ${sc.visualRendering} render.`;
    }
  }

  // shots : normaliser les champs et les ids
  if (Array.isArray(out.shots)) {
    out.shots = out.shots
      .filter((s) => s && typeof s === "object")
      .map((s, idx) => ({
        ...s,
        id: typeof s.id === "string" && s.id.length > 0 ? s.id : `shot_${idx + 1}`,
        shotNumber: typeof s.shotNumber === "number" ? s.shotNumber : idx + 1,
        // timestamps : seul le 1er plan n'en a pas
        timestamp: idx === 0 ? undefined : s.timestamp,
      }));
  }

  // cameraDirections : normaliser les valeurs enum
  if (out.cameraDirections && typeof out.cameraDirections === "object") {
    const normalizedCam: Record<string, unknown> = {};
    for (const [key, dir] of Object.entries(out.cameraDirections)) {
      if (!dir || typeof dir !== "object") continue;
      normalizedCam[key] = {
        ...dir,
        framing: normalizeEnum((dir as { framing?: unknown }).framing, FRAMING_SYNONYMS, "medium"),
        angle: normalizeEnum((dir as { angle?: unknown }).angle, ANGLE_SYNONYMS, "eye_level"),
        motion: normalizeEnum((dir as { motion?: unknown }).motion, MOTION_SYNONYMS, "static"),
        speed: normalizeEnum((dir as { speed?: unknown }).speed, { subtle: "subtle", smooth: "smooth", lente: "subtle", lent: "subtle", rapide: "fast", "fast": "fast", dynamic: "dynamic" }, "subtle"),
      };
    }
    out.cameraDirections = normalizedCam as ProjectData["cameraDirections"];
  }

  // negativeConstraints : filtrer les items vides
  if (Array.isArray(out.negativeConstraints)) {
    out.negativeConstraints = out.negativeConstraints
      .filter((n) => n && typeof n === "object" && typeof n.text === "string" && n.text.trim().length > 0)
      .map((n, idx) => ({
        id: typeof n.id === "string" && n.id.length > 0 ? n.id : `neg_${idx + 1}`,
        text: n.text.trim(),
      }));

    // Si moins de 3 items, on complète avec des défauts génériques
    const defaults = [
      "no subtitles",
      "no soft dissolves",
      "no lens flares",
      "no morphing defects",
      "no watermarks",
    ];
    let di = 0;
    while (out.negativeConstraints.length < 3 && di < defaults.length) {
      const text = defaults[di++];
      if (!out.negativeConstraints.some((n) => n.text === text)) {
        out.negativeConstraints.push({ id: `neg_default_${di}`, text });
      }
    }
  }

  return out;
}

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
const DEFAULT_MODEL = "gemini-flash-latest";
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

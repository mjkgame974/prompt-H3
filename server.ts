import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "MiniMax H3 Prompt Assistant" });
});

// Prompt Optimization API using Gemini if GEMINI_API_KEY is configured
app.post("/api/optimize-prompt", async (req, res) => {
  try {
    const { rawPrompt, projectData } = req.body;

    if (!rawPrompt) {
      return res.status(400).json({ error: "rawPrompt est requis" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback response if no key configured
      return res.json({
        optimizedPrompt: rawPrompt,
        suggestions: [
          "Le prompt est déjà structuré selon le format MiniMax H3.",
          "Pour une optimisation IA avancée, configurez votre clé GEMINI_API_KEY.",
        ],
        source: "fallback",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Tu es un expert mondial en génération de vidéos IA et spécifiquement sur le modèle MiniMax H3.
Ta mission est d'optimiser le prompt vidéo fourni pour le modèle MiniMax H3 en respectant RIGOUREUSEMENT ces règles :
1. Le prompt final doit être rédigé exclusivement en ANGLAIS clair, descriptif et précis.
2. Structure stricte du prompt H3 :
   - Contrat de style (1 seule phrase fixe en tête)
   - Timeline & plans (maximum 2 à 3 moments sur 10 secondes. [Shot 1] sans temps, [Shot 2] At 00:0X.000 avec temps strictement croissants)
   - Mouvements caméra (exactement UN SEUL mouvement de caméra par plan)
   - Bloc audio obligatoire (ex: "Audio: Room tone only. No music." si pas de son)
   - Texte à l'écran : utiliser EXACTEMENT la syntaxe reading exactly: "TEXTE"
   - Dialogue : utiliser la balise <d>[Language] Text</d>
   - Consignes de préservation explicites
   - Liste négative courte (3 à 6 contraintes max, ex: no subtitles, no soft dissolves, no lens flares)
3. Améliore le vocabulaire visuel et la précision sans inventer de nouveaux éléments de narration.

Renvoie un objet JSON valide avec :
- "optimizedPrompt": le prompt final optimisé en anglais
- "suggestions": un tableau de 2-4 remarques/conseils d'amélioration en français.`;

    const promptText = `Voici les données du projet MiniMax H3 à optimiser :
Prompt brut :
${rawPrompt}

Détails contextuels :
${JSON.stringify(projectData || {}, null, 2)}

Optimise ce prompt en anglais pour MiniMax H3. Réponds UNIQUEMENT en JSON sous la forme :
{
  "optimizedPrompt": "...",
  "suggestions": ["...", "..."]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "";
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      parsedResult = {
        optimizedPrompt: rawPrompt,
        suggestions: ["Ajustements syntaxiques appliqués."],
      };
    }

    return res.json({
      optimizedPrompt: parsedResult.optimizedPrompt || rawPrompt,
      suggestions: parsedResult.suggestions || [],
      source: "gemini-2.5-flash",
    });
  } catch (error: any) {
    console.error("Erreur lors de l'optimisation du prompt:", error);
    return res.status(500).json({
      error: "Erreur serveur lors de l'optimisation par IA",
      details: error.message || String(error),
    });
  }
});

async function startServer() {
  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Assistant MiniMax H3 démarré sur http://localhost:${PORT}`);
  });
}

startServer();

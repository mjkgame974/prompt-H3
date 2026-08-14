import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { INITIAL_PROJECT_DATA, PRESET_TEMPLATES } from "./constants/presets";
import { ProjectData, ValidationIssue } from "./types/minimax";
import { ImportAnalysisResult } from "./types/project";
import { validateProjectData } from "./utils/rulesEngine";
import { analyzeAndValidateImportJson } from "./utils/schemaValidator";
import {
  loadProjectsFromLocalStorage,
  saveProjectsToLocalStorage,
  upsertProjectInStore,
  createEmptyStore,
  getLastSavedAt,
  isLocalStorageAvailable,
  ProjectsStore,
  StoredProject,
} from "./utils/persistence";
import { Navbar } from "./components/Navbar";
import { WizardProgress, WIZARD_STEPS } from "./components/WizardProgress";
import { LivePromptPreview } from "./components/LivePromptPreview";
import { ValidationBanner } from "./components/ValidationBanner";
import { PreFlightChecklist } from "./components/PreFlightChecklist";
import { ImportProjectModal } from "./components/ImportProjectModal";
import { PwaInstallBanner } from "./components/PwaInstallBanner";

// Steps
import { Step1Objective } from "./components/steps/Step1Objective";
import { Step2StyleContract } from "./components/steps/Step2StyleContract";
import { Step3References } from "./components/steps/Step3References";
import { Step4Timeline } from "./components/steps/Step4Timeline";
import { Step5Camera } from "./components/steps/Step5Camera";
import { Step6Audio } from "./components/steps/Step6Audio";
import { Step7TextDialogue } from "./components/steps/Step7TextDialogue";
import { Step8Constraints } from "./components/steps/Step8Constraints";
import { Step9Generation } from "./components/steps/Step9Generation";
import { compileMiniMaxH3Prompt } from "./utils/compiler";
import { exportProjectToJson } from "./utils/jsonHandler";
import {
  getApiKey,
  optimizeH3Prompt,
  GeminiError,
  analyzeBriefForQuestions,
  briefToProject,
  type ClarificationQuestion,
  type ClarificationAnswer,
} from "./services/gemini";
import { NewProjectChoiceModal } from "./components/NewProjectChoiceModal";
import { BriefInputModal } from "./components/BriefInputModal";
import { BriefClarificationModal } from "./components/BriefClarificationModal";

export default function App() {
  // ---- Multi-project store (history) ----
  // We keep two related pieces of state:
  //  - `project`     : the currently active project (the one the user is editing)
  //  - `store`       : the full history of all projects + which one is active
  // The store is synced from `project` on every change, then debounced-persisted.
  const [project, setProject] = useState<ProjectData>(() => {
    const loaded = loadProjectsFromLocalStorage();
    if (loaded?.activeProjectId) {
      const active = loaded.projects.find((p) => p.id === loaded.activeProjectId);
      if (active) return active.data;
    }
    return { ...INITIAL_PROJECT_DATA, id: `proj_${Date.now()}` };
  });

  const [store, setStore] = useState<ProjectsStore>(() => {
    const loaded = loadProjectsFromLocalStorage();
    if (loaded) return loaded;
    return createEmptyStore();
  });

  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Import Modal & Analysis State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Autosave indicator state
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => getLastSavedAt());
  const [justSaved, setJustSaved] = useState(false);
  const [storageAvailable] = useState<boolean>(() => isLocalStorageAvailable());

  // Streaming state for the "Optimiser par IA" button — affiche le prompt
  // qui s'écrit en temps réel dans le panneau de prévisualisation.
  const [streamingText, setStreamingText] = useState<string>("");
  // Message d'erreur API Gemini à afficher dans le bandeau
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // ── State machine "Nouveau projet" ──────────────────────────────────
  // Quand l'utilisateur clique sur "Nouveau" dans la navbar, on ouvre
  // d'abord la modale de choix (brief / zéro), puis on enchaîne.
  const [isNewProjectChoiceOpen, setIsNewProjectChoiceOpen] = useState(false);
  const [isBriefInputOpen, setIsBriefInputOpen] = useState(false);
  const [isBriefClarificationOpen, setIsBriefClarificationOpen] = useState(false);
  const [currentBrief, setCurrentBrief] = useState<string>("");
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [briefProcessingMessage, setBriefProcessingMessage] = useState<string>("");
  const [isBriefProcessing, setIsBriefProcessing] = useState<boolean>(false);
  const [aiFilledProject, setAiFilledProject] = useState<boolean>(false);

  // ---- Sync the active project into the store on every change ----
  useEffect(() => {
    setStore((prev) => upsertProjectInStore(prev, project));
  }, [project]);

  // ---- Debounced persist of the entire store to localStorage (500ms) ----
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const success = saveProjectsToLocalStorage(storeRef.current);
      if (success) {
        const now = new Date().toISOString();
        setLastSavedAt(now);
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 1500);
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [store]);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowPwaBanner(false);
      });
    }
  };

  // Run Rules Engine Validation on every project state change
  useEffect(() => {
    const activeIssues = validateProjectData(project);
    setIssues(activeIssues);
  }, [project]);

  const updateProject = (partial: Partial<ProjectData>) => {
    setProject((prev) => ({
      ...prev,
      ...partial,
      lastModifiedAt: new Date().toISOString(),
    }));
  };

  // ---- Explicit save: bypasses the 500ms debounce ----
  const handleSaveNow = useCallback(() => {
    const success = saveProjectsToLocalStorage(storeRef.current);
    if (success) {
      setLastSavedAt(new Date().toISOString());
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1500);
    }
  }, []);

  // ---- Switch to another project from the history ----
  const handleSwitchProject = useCallback((projectId: string) => {
    const target = storeRef.current.projects.find((p) => p.id === projectId);
    if (target) {
      setProject(target.data);
      setStore((prev) => ({ ...prev, activeProjectId: projectId }));
      setAiSuggestions([]);
    }
  }, []);

  // ---- Delete a project from the history ----
  const handleDeleteProject = useCallback((projectId: string) => {
    setStore((prev) => {
      const remaining = prev.projects.filter((p) => p.id !== projectId);
      const newActive =
        prev.activeProjectId === projectId
          ? remaining[0]?.id ?? null
          : prev.activeProjectId;
      return { ...prev, projects: remaining, activeProjectId: newActive };
    });
    // If the deleted project was the active one, load the new active (or default)
    setProject((currentActive) => {
      if (currentActive.id !== projectId) return currentActive;
      const remaining = storeRef.current.projects.filter((p) => p.id !== projectId);
      if (remaining.length > 0) return remaining[0].data;
      return { ...INITIAL_PROJECT_DATA, id: `proj_${Date.now()}` };
    });
  }, []);

  const handleExportJson = () => {
    exportProjectToJson(project);
  };

  const handleSelectFileForImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const analysis = analyzeAndValidateImportJson(text);
      setImportAnalysis(analysis);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleConfirmImport = (importedProject: ProjectData) => {
    // Make sure the imported project has a unique id and a fresh timestamp
    const stamped: ProjectData = {
      ...importedProject,
      id: importedProject.id || `proj_${Date.now()}`,
      lastModifiedAt: new Date().toISOString(),
    };
    setProject(stamped);
    setStore((prev) => upsertProjectInStore(prev, stamped));
    setAiSuggestions([]);
    setIsImportModalOpen(false);
    setImportAnalysis(null);
  };

  // ── "Nouveau" : ouvre la modale de choix (brief / zéro) ─────────────
  const handleNewProject = () => {
    setIsNewProjectChoiceOpen(true);
  };

  // L'utilisateur a choisi "Démarrer un brief" dans la modale de choix
  const handleChooseBrief = () => {
    setIsNewProjectChoiceOpen(false);
    // Petit délai pour que la fermeture de la modale choice soit visible
    setTimeout(() => setIsBriefInputOpen(true), 150);
  };

  // L'utilisateur a choisi "Partir de zéro" → crée un projet vide
  const handleChooseManual = () => {
    setIsNewProjectChoiceOpen(false);
    if (
      window.confirm(
        "Créer un nouveau projet ? Le projet actuel est sauvegardé automatiquement — tu le retrouveras dans l'historique."
      )
    ) {
      const newId = `proj_${Date.now()}`;
      const fresh: ProjectData = {
        ...INITIAL_PROJECT_DATA,
        id: newId,
        title: "Nouveau projet H3",
        lastModifiedAt: new Date().toISOString(),
      };
      setProject(fresh);
      setStore((prev) => upsertProjectInStore(prev, fresh));
      setAiSuggestions([]);
      setAiFilledProject(false);
    }
  };

  // L'utilisateur a soumis son brief → on demande à Gemini de générer
  // 2-3 questions de clarification objectives.
  const handleSubmitBrief = async (brief: string) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setGeminiError(
        "Clé Gemini absente (.env). Le mode brief nécessite Gemini. Configure VITE_GEMINI_API_KEY ou choisis 'Partir de zéro'.",
      );
      setIsBriefInputOpen(false);
      return;
    }

    setCurrentBrief(brief);
    setIsBriefProcessing(true);
    try {
      const questions = await analyzeBriefForQuestions(brief, apiKey);
      setClarificationQuestions(questions);
      setIsBriefInputOpen(false);
      setIsBriefProcessing(false);
      // Laisse la transition visuelle se faire
      setTimeout(() => setIsBriefClarificationOpen(true), 200);
    } catch (err) {
      const msg =
        err instanceof GeminiError
          ? err.message
          : err instanceof Error
          ? `Erreur : ${err.message}`
          : "Erreur inconnue";
      setGeminiError(`Impossible d'analyser le brief : ${msg}`);
      setIsBriefInputOpen(false);
      setIsBriefProcessing(false);
    }
  };

  // L'utilisateur a répondu aux clarifications (ou tout passé) →
  // on demande à Gemini de générer le projet complet.
  const handleSubmitClarifications = async (answers: ClarificationAnswer[]) => {
    const apiKey = getApiKey();
    if (!apiKey) return;

    setIsBriefProcessing(true);
    setBriefProcessingMessage("Génération du projet H3…");
    try {
      const generated = await briefToProject(currentBrief, answers, apiKey);

      // Merge avec INITIAL_PROJECT_DATA pour garantir tous les champs requis
      const newId = `proj_${Date.now()}`;
      const freshProject: ProjectData = {
        ...INITIAL_PROJECT_DATA,
        ...generated,
        id: newId,
        step: 1,
        title: generated.title || "Nouveau projet H3",
        lastModifiedAt: new Date().toISOString(),
        // Force la jump à l'étape 1
        // (l'utilisateur y verra la bannière "AI-filled")
      } as ProjectData;

      setProject(freshProject);
      setStore((prev) => upsertProjectInStore(prev, freshProject));
      setAiSuggestions([]);
      setAiFilledProject(true); // Affiche la bannière sur l'étape 1
      setIsBriefClarificationOpen(false);
      setIsBriefProcessing(false);
      setGeminiError(null);
    } catch (err) {
      const msg =
        err instanceof GeminiError
          ? err.message
          : err instanceof Error
          ? `Erreur : ${err.message}`
          : "Erreur inconnue";
      setGeminiError(`Impossible de générer le projet : ${msg}`);
      setIsBriefClarificationOpen(false);
      setIsBriefProcessing(false);
    }
  };

  // Reset la bannière "AI-filled" quand l'utilisateur change d'étape
  // (elle ne s'affiche qu'à l'arrivée à l'étape 1).
  useEffect(() => {
    if (project.step !== 1 && aiFilledProject) {
      setAiFilledProject(false);
    }
  }, [project.step, aiFilledProject]);

  const handleNextStep = () => {
    if (project.step < WIZARD_STEPS.length) {
      setProject((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handlePrevStep = () => {
    if (project.step > 1) {
      setProject((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const found = PRESET_TEMPLATES.find((t) => t.id === presetId);
    if (found && found.data) {
      setProject((prev) => ({
        ...prev,
        ...found.data,
        id: `proj_${Date.now()}`,
        step: 1,
        lastModifiedAt: new Date().toISOString(),
      }));
      setAiSuggestions([]);
    }
  };

  // Apply Quick-Fixes from Rule Engine
  const handleApplyFix = (issue: ValidationIssue) => {
    if (issue.id === "err_shot_count_10s" || issue.id === "err_shot_count_5s") {
      updateProject({ shots: project.shots.slice(0, 3) });
    } else if (issue.id.startsWith("err_shot_1_timestamp_")) {
      const updatedShots = project.shots.map((s, idx) =>
        idx === 0 ? { ...s, timestamp: "" } : s
      );
      updateProject({ shots: updatedShots });
    } else if (issue.id.startsWith("err_shot_missing_time_")) {
      const updatedShots = project.shots.map((s, idx) =>
        idx > 0 && (!s.timestamp || s.timestamp.trim() === "")
          ? { ...s, timestamp: `00:0${(idx * 4).toFixed(0)}.000` }
          : s
      );
      updateProject({ shots: updatedShots });
    } else if (issue.id.startsWith("err_double_camera_")) {
      const updatedDirections = { ...project.cameraDirections };
      Object.keys(updatedDirections).forEach((k) => {
        if (updatedDirections[k]) {
          updatedDirections[k] = {
            ...updatedDirections[k],
            secondaryMotionAttempt: null,
          };
        }
      });
      updateProject({ cameraDirections: updatedDirections });
    } else if (issue.id === "err_missing_audio_block") {
      updateProject({
        audioDesign: {
          ...project.audioDesign,
          isSilent: true,
          ambientSound: "",
          keySFX: "",
          hasMusic: false,
        },
      });
    } else if (issue.id === "warn_missing_preservation") {
      updateProject({
        preservationRules: {
          ...project.preservationRules,
          elementsToPreserve:
            "Conserver l'apparence originale, les formes et la palette de couleurs des produits/personnages.",
        },
      });
    } else if (issue.id === "warn_descriptive_text") {
      updateProject({
        onScreenText: {
          ...project.onScreenText,
          exactString: project.onScreenText.exactString
            .replace(/un texte qui dit/gi, "")
            .replace(/afficher le texte/gi, "")
            .replace(/qui dit/gi, "")
            .trim(),
        },
      });
    } else if (issue.id === "warn_neg_too_few") {
      updateProject({
        negativeConstraints: [
          ...project.negativeConstraints,
          { id: "neg_subtitles", text: "no subtitles or text overlays" },
          { id: "neg_dissolves", text: "no soft dissolves or crossfades" },
          { id: "neg_flares", text: "no unrealistic lens flares" },
        ],
      });
    } else if (issue.id === "warn_neg_too_many") {
      updateProject({
        negativeConstraints: project.negativeConstraints.slice(0, 6),
      });
    }
  };

  const handleOptimizeWithAi = async () => {
    setGeminiError(null);
    setAiSuggestions([]);

    const apiKey = getApiKey();
    if (!apiKey) {
      // Pas de clé configurée → on bascule sur le mode dégradé local
      // (compile le prompt + ajoute un wrapper, comme avant). L'utilisateur
      // est prévenu via le bandeau geminiError.
      setGeminiError(
        "Clé Gemini absente (.env) — optimisation locale utilisée. Configure VITE_GEMINI_API_KEY pour activer Gemini.",
      );
      setIsOptimizing(true);
      setTimeout(() => {
        const currentPrompt = compileMiniMaxH3Prompt(project);
        const optimized = `[STYLE & ART DIRECTION]: ${project.styleContract.condensedEnglishSentence}\n\n[TIMELINE & SHOT SEQUENCE]:\n${currentPrompt}\n\n[AUDIO DIRECTIVE]: Audio: Room tone only. No music.\n[QUALITY CONSTRAINTS]: Master cinematography, photorealistic 8K render, zero morphing artifacts.`;

        updateProject({ optimizedPrompt: optimized });
        setAiSuggestions([
          "Horodatages vérifiés : transition fluide à 00:04.000.",
          "Mouvements de caméra harmonisés : un seul axe par plan.",
          "Audio explicite inséré selon la norme MiniMax H3.",
        ]);
        setIsOptimizing(false);
      }, 800);
      return;
    }

    // Mode Gemini : appel réel avec streaming
    setIsOptimizing(true);
    setStreamingText("");
    try {
      const basePrompt = compileMiniMaxH3Prompt(project);
      const optimized = await optimizeH3Prompt({
        apiKey,
        project,
        currentPrompt: basePrompt,
        onChunk: (chunk) => {
          setStreamingText((prev) => prev + chunk);
        },
      });

      // On stocke le résultat final dans le projet, et on vide le streaming
      // (l'affichage bascule sur project.optimizedPrompt).
      updateProject({ optimizedPrompt: optimized });
      setAiSuggestions([
        "Prompt enrichi par Gemini avec vocabulaire cinématographique professionnel.",
        "Structure H3 en blocs préservée à 100% (timestamps, contraintes, négatifs).",
        "Vocabulaire descriptif et atmosphérique densifié (+20-40% de richesse).",
      ]);
    } catch (err) {
      const msg =
        err instanceof GeminiError
          ? err.message
          : err instanceof Error
          ? `Erreur inattendue : ${err.message}`
          : "Erreur inconnue lors de l'appel Gemini.";
      setGeminiError(msg);
    } finally {
      setIsOptimizing(false);
      setStreamingText("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Header Navigation */}
      <Navbar
        project={project}
        store={store}
        onLoadPreset={handleLoadPreset}
        onNewProject={handleNewProject}
        onSwitchProject={handleSwitchProject}
        onDeleteProject={handleDeleteProject}
        onSaveNow={handleSaveNow}
        onOpenChecklist={() => setIsChecklistOpen(true)}
        onExportJson={handleExportJson}
        onSelectFileForImport={handleSelectFileForImport}
        canInstallPwa={Boolean(deferredPrompt)}
        onInstallPwa={handleInstallPwa}
        lastSavedAt={lastSavedAt}
        justSaved={justSaved}
        storageAvailable={storageAvailable}
      />

      {/* PWA Banner if available */}
      {showPwaBanner && (
        <PwaInstallBanner
          onInstall={handleInstallPwa}
          onDismiss={() => setShowPwaBanner(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12 space-y-8 wizard-scale">
        {/* AI-Filled Banner (visible à l'étape 1 quand le projet vient d'être généré par brief) */}
        {aiFilledProject && project.step === 1 && (
          <div className="bg-indigo-950/40 border border-indigo-700/50 rounded-2xl p-4 flex items-start space-x-3 text-indigo-100 shadow-lg shadow-indigo-500/10">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-indigo-100">
                Projet généré à partir de ton brief 🎉
              </h3>
              <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                J'ai pré-rempli les 9 étapes au mieux. <strong>Contrôle chaque
                champ</strong> ci-dessous et ajuste ce qui ne te convient pas.
                Tu peux aussi régénérer tout depuis le bouton "Nouveau".
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAiFilledProject(false)}
              className="text-indigo-300 hover:text-indigo-100 text-[10px] font-bold uppercase"
            >
              Masquer
            </button>
          </div>
        )}

        {/* Wizard Progress Stepper */}
        <WizardProgress
          currentStep={project.step}
          onStepClick={(step) => setProject((prev) => ({ ...prev, step }))}
          issues={issues}
        />

        {/* Global Validation Issue Banner */}
        <ValidationBanner issues={issues} onApplyFix={handleApplyFix} />

        {/* Gemini API Error/Warning Banner */}
        {geminiError && (
          <div className="bg-amber-950/30 border border-amber-700/50 rounded-2xl p-3.5 flex items-start space-x-2.5 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <strong className="font-bold text-amber-300">Gemini :</strong> {geminiError}
            </div>
            <button
              type="button"
              onClick={() => setGeminiError(null)}
              className="text-amber-400 hover:text-amber-200 text-[10px] font-bold uppercase"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Grid Split: Left 7 Cols (Form Wizard), Right 5 Cols (Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Form Step (7 cols) */}
          <section className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl relative min-h-[600px] flex flex-col justify-between max-w-3xl mx-auto w-full">
            <div className="space-y-6 pt-2 lg:pt-4">
              {project.step === 1 && (
                <Step1Objective project={project} onChange={updateProject} />
              )}
              {project.step === 2 && (
                <Step2StyleContract
                  project={project}
                  onChange={(styleContract) => updateProject({ styleContract })}
                />
              )}
              {project.step === 3 && (
                <Step3References
                  project={project}
                  onChange={(references) => updateProject({ references })}
                />
              )}
              {project.step === 4 && (
                <Step4Timeline
                  project={project}
                  onChange={(shots) => updateProject({ shots })}
                />
              )}
              {project.step === 5 && (
                <Step5Camera
                  project={project}
                  onChange={(cameraDirections) => updateProject({ cameraDirections })}
                />
              )}
              {project.step === 6 && (
                <Step6Audio
                  project={project}
                  onChange={(audioDesign) => updateProject({ audioDesign })}
                />
              )}
              {project.step === 7 && (
                <Step7TextDialogue
                  project={project}
                  onScreenTextChange={(onScreenText) => updateProject({ onScreenText })}
                  spokenDialogueChange={(spokenDialogue) => updateProject({ spokenDialogue })}
                />
              )}
              {project.step === 8 && (
                <Step8Constraints
                  project={project}
                  onPreservationChange={(preservationRules) => updateProject({ preservationRules })}
                  onNegativeChange={(negativeConstraints) => updateProject({ negativeConstraints })}
                />
              )}
              {project.step === 9 && (
                <Step9Generation
                  project={project}
                  issues={issues}
                  onOptimizeWithAi={handleOptimizeWithAi}
                  isOptimizing={isOptimizing}
                  onOpenChecklist={() => setIsChecklistOpen(true)}
                  onExportJson={handleExportJson}
                  onSelectFileForImport={handleSelectFileForImport}
                />
              )}

              {/* Wizard Footer Navigation Controls */}
              <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={project.step === 1}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Étape Précédente</span>
                </button>

                <div className="flex items-center space-x-2">
                  {project.step < WIZARD_STEPS.length ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                      <span>Étape Suivante</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsChecklistOpen(true)}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider & Revoir Checklist</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Live Prompt Preview Panel (5 cols on desktop, sticky) */}
          <section className="lg:col-span-5 lg:sticky lg:top-20">
            <LivePromptPreview
              project={project}
              issues={issues}
              onOptimizeWithAi={handleOptimizeWithAi}
              isOptimizing={isOptimizing}
              aiSuggestions={aiSuggestions}
              streamingText={streamingText}
            />
          </section>
        </div>
      </main>

      {/* Pre-flight Checklist Modal */}
      <PreFlightChecklist
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        project={project}
        issues={issues}
      />

      {/* ── Modales du flow "Nouveau projet" ────────────────────────── */}
      <NewProjectChoiceModal
        isOpen={isNewProjectChoiceOpen}
        onClose={() => setIsNewProjectChoiceOpen(false)}
        onChooseBrief={handleChooseBrief}
        onChooseManual={handleChooseManual}
      />

      <BriefInputModal
        isOpen={isBriefInputOpen}
        onClose={() => !isBriefProcessing && setIsBriefInputOpen(false)}
        onSubmit={handleSubmitBrief}
        isProcessing={isBriefProcessing && isBriefInputOpen}
      />

      <BriefClarificationModal
        isOpen={isBriefClarificationOpen}
        questions={clarificationQuestions}
        onClose={() => !isBriefProcessing && setIsBriefClarificationOpen(false)}
        onSubmit={handleSubmitClarifications}
        isProcessing={isBriefProcessing && isBriefClarificationOpen}
        processingMessage={briefProcessingMessage}
      />

      {/* Import JSON Modal Preview & Confirmation */}
      <ImportProjectModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportAnalysis(null);
        }}
        analysis={importAnalysis}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}

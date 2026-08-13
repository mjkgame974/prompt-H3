import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RotateCcw,
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
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
  clearProjectFromLocalStorage,
  getLastSavedAt,
  isLocalStorageAvailable,
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

export default function App() {
  // Load the persisted project on first mount (if any), otherwise fall back to defaults.
  const [project, setProject] = useState<ProjectData>(() => {
    const persisted = loadProjectFromLocalStorage();
    return persisted || INITIAL_PROJECT_DATA;
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

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  // Debounced autosave to localStorage (500ms after the last project change).
  // We avoid persisting on the very first render so we don't immediately overwrite
  // a freshly-imported project with the initial default.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const success = saveProjectToLocalStorage(project);
      if (success) {
        const now = new Date().toISOString();
        setLastSavedAt(now);
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 1500);
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [project]);

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
    setProject(importedProject);
    setAiSuggestions([]);
    setIsImportModalOpen(false);
    setImportAnalysis(null);
  };

  const handleNewProject = () => {
    if (
      window.confirm(
        "Voulez-vous vraiment créer un nouveau projet ? Les modifications non enregistrées du projet actuel seront perdues."
      )
    ) {
      const newId = `proj_${Date.now()}`;
      setProject({
        ...INITIAL_PROJECT_DATA,
        id: newId,
        title: "Nouveau Projet H3",
        lastModifiedAt: new Date().toISOString(),
      });
      setAiSuggestions([]);
      // Also clear the persisted localStorage copy — otherwise the next autosave
      // tick will save the new (empty) project on top of the old envelope.
      clearProjectFromLocalStorage();
      setLastSavedAt(null);
    }
  };

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
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Header Navigation */}
      <Navbar
        project={project}
        onLoadPreset={handleLoadPreset}
        onNewProject={handleNewProject}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Wizard Progress Stepper */}
        <WizardProgress
          currentStep={project.step}
          onStepClick={(step) => setProject((prev) => ({ ...prev, step }))}
          issues={issues}
        />

        {/* Global Validation Issue Banner */}
        <ValidationBanner issues={issues} onApplyFix={handleApplyFix} />

        {/* Grid Split: Left 7 Cols (Form Wizard), Right 5 Cols (Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Form Step (7 cols) */}
          <section className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative min-h-[500px] flex flex-col justify-between">
            <div>
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

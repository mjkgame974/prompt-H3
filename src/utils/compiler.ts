import { ProjectData } from "../types/minimax";
import {
  ANGLE_TRANSLATIONS,
  FRAMING_TRANSLATIONS,
  MOTION_TRANSLATIONS,
  SPEED_TRANSLATIONS,
  ANGLE_TRANSLATIONS_FR,
  FRAMING_TRANSLATIONS_FR,
  MOTION_TRANSLATIONS_FR,
  SPEED_TRANSLATIONS_FR,
  translateFrenchToEnglish,
} from "./translator";

export interface StructuredPromptBlocks {
  styleContractBlock: string;
  timelineBlock: string;
  cameraBlock: string;
  audioBlock: string;
  textAndDialogueBlock: string;
  preservationBlock: string;
  negativeConstraintsBlock: string;
}

/**
 * Compiles the complete, clean English MiniMax H3 prompt string
 */
export function compileMiniMaxH3Prompt(data: ProjectData): string {
  const blocks = compileBlockStructured(data);

  const parts = [
    blocks.styleContractBlock,
    blocks.timelineBlock,
    blocks.audioBlock,
    blocks.textAndDialogueBlock,
    blocks.preservationBlock,
    blocks.negativeConstraintsBlock,
  ].filter((b) => b && b.trim() !== "");

  return parts.join("\n\n");
}

/**
 * Compiles a condensed 5-second test version prompt for low-cost iteration
 */
export function compile5sTestPrompt(data: ProjectData): string {
  const styleStr =
    data.styleContract.condensedEnglishSentence ||
    `${data.styleContract.medium}, ${data.styleContract.texture}, ${data.styleContract.palette}, ${data.styleContract.visualRendering}.`;

  // Focus only on Shot 1 or condensed key shot for 5s
  const shot1 = data.shots[0];
  const shot1Desc = shot1
    ? `${translateFrenchToEnglish(shot1.visualDescription)} ${translateFrenchToEnglish(shot1.subjectAction)}`
    : "Key product highlight shot.";

  const cam1 = shot1 ? data.cameraDirections[shot1.id] : null;
  const camStr = cam1
    ? `Camera: ${FRAMING_TRANSLATIONS[cam1.framing]}, ${ANGLE_TRANSLATIONS[cam1.angle]}, ${MOTION_TRANSLATIONS[cam1.motion]} (${SPEED_TRANSLATIONS[cam1.speed]}).`
    : "Camera: Medium shot, tracking shot forward.";

  const audioStr = data.audioDesign.isSilent
    ? "Audio: Room tone only. No music."
    : "Audio: Ambient sound with subtle music bed.";

  const negStr =
    data.negativeConstraints.length > 0
      ? data.negativeConstraints.slice(0, 4).map((c) => c.text).join(", ")
      : "no subtitles, no soft dissolves, no lens flares";

  return `[TEST 5S FAST PREVIEW VERSION]
[STYLE CONTRACT]
${styleStr}

[TIMELINE (5S SINGLE SHOT)]
[Shot 1] ${shot1Desc}
${camStr}

[AUDIO DESIGN]
${audioStr}

[NEGATIVE CONSTRAINTS]
${negStr}`;
}

/**
 * Compiles the structured prompt blocks object
 */
export function compileBlockStructured(data: ProjectData): StructuredPromptBlocks {
  // 1. Style Contract Block
  const styleContractBlock =
    data.styleContract.condensedEnglishSentence &&
    data.styleContract.condensedEnglishSentence.trim() !== ""
      ? `[STYLE CONTRACT]\n${data.styleContract.condensedEnglishSentence.trim()}`
      : `[STYLE CONTRACT]\n${data.styleContract.medium}, ${data.styleContract.texture}, ${data.styleContract.palette}, ${data.styleContract.era}, ${data.styleContract.visualRendering}.`;

  // 2. Timeline & Camera Combined Block (H3 Order)
  const timelineLines: string[] = [];
  data.shots.forEach((shot, index) => {
    const isFirstShot = index === 0;
    const shotHeader = isFirstShot
      ? `[Shot ${shot.shotNumber}]`
      : `[Shot ${shot.shotNumber}] At ${shot.timestamp || `00:0${(index * 4).toFixed(0)}.000`}.`;

    const englishVisual = translateFrenchToEnglish(shot.visualDescription);
    const englishAction = translateFrenchToEnglish(shot.subjectAction);
    const englishAtmosphere = translateFrenchToEnglish(shot.atmosphere);

    const fullShotDesc = `${englishVisual} ${englishAction} ${englishAtmosphere}`.trim();

    // Camera Direction
    const cam = data.cameraDirections[shot.id];
    let camLine = "";
    if (cam) {
      const framing = FRAMING_TRANSLATIONS[cam.framing] || cam.framing;
      const angle = ANGLE_TRANSLATIONS[cam.angle] || cam.angle;
      const motion = MOTION_TRANSLATIONS[cam.motion] || cam.motion;
      const speed = SPEED_TRANSLATIONS[cam.speed] || cam.speed;
      camLine = `Camera: ${framing}, ${angle}, ${motion} (${speed}).`;
    } else {
      camLine = "Camera: Medium shot, static locked camera.";
    }

    timelineLines.push(`${shotHeader} ${fullShotDesc}\n${camLine}`);
  });

  const timelineBlock = `[TIMELINE & SHOTS]\n${timelineLines.join("\n\n")}`;

  // Camera standalone summary block (for reference)
  const cameraBlock = `[CAMERA DIRECTIONS]\n${data.shots
    .map((s, idx) => {
      const c = data.cameraDirections[s.id];
      if (!c) return `Shot ${idx + 1}: Default static`;
      return `Shot ${idx + 1}: ${FRAMING_TRANSLATIONS[c.framing]}, ${ANGLE_TRANSLATIONS[c.angle]}, ${MOTION_TRANSLATIONS[c.motion]}`;
    })
    .join("\n")}`;

  // 3. Audio Block (MANDATORY)
  let audioContent = "";
  if (data.audioDesign.isSilent) {
    audioContent = "Audio: Room tone only. No music.";
  } else {
    const parts: string[] = [];
    if (data.audioDesign.ambientSound) {
      parts.push(`Ambient: ${translateFrenchToEnglish(data.audioDesign.ambientSound)}`);
    }
    if (data.audioDesign.keySFX) {
      parts.push(`SFX: ${translateFrenchToEnglish(data.audioDesign.keySFX)}`);
    }
    if (data.audioDesign.hasMusic && data.audioDesign.musicDescription) {
      parts.push(`Music: ${translateFrenchToEnglish(data.audioDesign.musicDescription)}`);
    } else if (!data.audioDesign.hasMusic) {
      parts.push("No music.");
    }
    if (data.audioDesign.hasVoiceoverOrDialogue) {
      parts.push(
        `Voice (${data.audioDesign.spokenLanguage || "French"}): ${translateFrenchToEnglish(
          data.audioDesign.voiceTone || "clear delivery"
        )}`
      );
    }
    audioContent = `Audio: ${parts.join(" | ")}`;
  }
  const audioBlock = `[AUDIO DESIGN]\n${audioContent}`;

  // 4. On-Screen Text & Dialogue
  const textDialogueLines: string[] = [];
  if (data.onScreenText.hasText && data.onScreenText.exactString.trim() !== "") {
    textDialogueLines.push(
      `On-screen text reading exactly: "${data.onScreenText.exactString.trim()}"`
    );
  }
  if (data.spokenDialogue.hasDialogue && data.spokenDialogue.exactLines.trim() !== "") {
    const lang = data.spokenDialogue.languageCode || "French";
    textDialogueLines.push(
      `Spoken dialogue: <d>[${lang}] ${data.spokenDialogue.exactLines.trim()}</d>`
    );
  }

  const textAndDialogueBlock =
    textDialogueLines.length > 0
      ? `[ON-SCREEN TEXT & DIALOGUE]\n${textDialogueLines.join("\n")}`
      : `[ON-SCREEN TEXT & DIALOGUE]\nNo on-screen text. No spoken dialogue.`;

  // 5. Preservation & References
  const preservationLines: string[] = [];
  if (data.references.length > 0) {
    data.references.forEach((ref, idx) => {
      preservationLines.push(
        `Reference ${idx + 1} (${ref.role.toUpperCase()}): ${translateFrenchToEnglish(
          ref.definesText
        )}. Preserve: ${translateFrenchToEnglish(ref.preserveText)}.`
      );
    });
  }
  if (data.preservationRules.elementsToPreserve) {
    preservationLines.push(
      `Preserve explicitly: ${translateFrenchToEnglish(data.preservationRules.elementsToPreserve)}`
    );
  }

  const preservationBlock =
    preservationLines.length > 0
      ? `[PRESERVATION & REFERENCES]\n${preservationLines.join("\n")}`
      : `[PRESERVATION & REFERENCES]\nPreserve key subject details and realistic physical proportions.`;

  // 6. Negative Constraints Block (3-6 constraints limit)
  let negStr = "";
  if (data.negativeConstraints.length > 0) {
    negStr = data.negativeConstraints.map((c) => c.text.trim()).join(", ");
  } else {
    negStr = "no subtitles, no soft dissolves, no lens flares, no extra people";
  }
  const negativeConstraintsBlock = `[NEGATIVE CONSTRAINTS]\n${negStr}`;

  return {
    styleContractBlock,
    timelineBlock,
    cameraBlock,
    audioBlock,
    textAndDialogueBlock,
    preservationBlock,
    negativeConstraintsBlock,
  };
}

/**
 * Compiles a French-readable version of the prompt.
 * Mirrors the H3 block structure but uses French labels and French cinema
 * terminology so the user can read and understand what will be sent to H3.
 * The technical content (camera enums, exact on-screen text, dialogue) is
 * rendered in French where possible; the user's own input is used as-is.
 */
export function compileFrenchPrompt(data: ProjectData): string {
  const blocks = compileBlockStructuredFrench(data);

  const parts = [
    blocks.styleContractBlock,
    blocks.timelineBlock,
    blocks.audioBlock,
    blocks.textAndDialogueBlock,
    blocks.preservationBlock,
    blocks.negativeConstraintsBlock,
  ].filter((b) => b && b.trim() !== "");

  return parts.join("\n\n");
}

/**
 * French equivalent of compileBlockStructured — returns the same 6 blocks
 * (no standalone camera block in French; camera info is integrated into the
 * timeline block like in the English version).
 */
export function compileBlockStructuredFrench(data: ProjectData): StructuredPromptBlocks {
  // 1. Style Contract (in French)
  const hasCondensed = data.styleContract.condensedEnglishSentence?.trim();
  const styleContractBlock = hasCondensed
    ? `[CONTRAT DE STYLE]\n${hasCondensed}\n\n(Même phrase utilisée en anglais dans le prompt final H3)`
    : data.styleContract.medium || data.styleContract.texture || data.styleContract.palette || data.styleContract.era
    ? `[CONTRAT DE STYLE]\n` +
      `Medium : ${data.styleContract.medium || "(non renseigné)"}\n` +
      `Texture : ${data.styleContract.texture || "(non renseigné)"}\n` +
      `Palette : ${data.styleContract.palette || "(non renseigné)"}\n` +
      `Époque : ${data.styleContract.era || "(non renseigné)"}\n` +
      `Rendu visuel : ${data.styleContract.visualRendering || "(non renseigné)"}`
    : `[CONTRAT DE STYLE]\n(Aucun style défini. Rendez-vous à l'étape 2 pour le configurer.)`;

  // 2. Timeline & Camera Combined Block (in French)
  const timelineLines: string[] = [];
  if (data.shots.length === 0) {
    timelineLines.push("(Aucun plan défini. Ajoutez vos plans à l'étape 4.)");
  } else {
    data.shots.forEach((shot, index) => {
      const isFirstShot = index === 0;
      const shotHeader = isFirstShot
        ? `[Plan ${shot.shotNumber}]`
        : `[Plan ${shot.shotNumber}] À ${shot.timestamp || `00:0${(index * 4).toFixed(0)}.000`}`;

      const visual = shot.visualDescription || "(à compléter)";
      const action = shot.subjectAction ? ` — ${shot.subjectAction}` : "";
      const atmosphere = shot.atmosphere ? ` — Ambiance : ${shot.atmosphere}` : "";

      // Camera Direction in French
      const cam = data.cameraDirections[shot.id];
      let camLine = "";
      if (cam) {
        const framing = FRAMING_TRANSLATIONS_FR[cam.framing] || cam.framing;
        const angle = ANGLE_TRANSLATIONS_FR[cam.angle] || cam.angle;
        const motion = MOTION_TRANSLATIONS_FR[cam.motion] || cam.motion;
        const speed = SPEED_TRANSLATIONS_FR[cam.speed] || cam.speed;
        camLine = `Caméra : ${framing}, ${angle}, ${motion}, ${speed}.`;
      } else {
        camLine = "Caméra : (configuration par défaut à définir à l'étape 5)";
      }

      timelineLines.push(`${shotHeader} ${visual}${action}${atmosphere}\n${camLine}`);
    });
  }
  const timelineBlock = `[PLANS & TIMELINE]\n${timelineLines.join("\n\n")}`;

  // 3. Audio Block (in French)
  let audioContent = "";
  if (data.audioDesign.isSilent) {
    audioContent = "Audio : Silence. Aucun son, aucune musique. (Room tone only.)";
  } else {
    const parts: string[] = [];
    if (data.audioDesign.ambientSound) {
      parts.push(`Ambiance : ${data.audioDesign.ambientSound}`);
    }
    if (data.audioDesign.keySFX) {
      parts.push(`Bruitages clés : ${data.audioDesign.keySFX}`);
    }
    if (data.audioDesign.hasMusic && data.audioDesign.musicDescription) {
      parts.push(`Musique : ${data.audioDesign.musicDescription}`);
    } else if (!data.audioDesign.hasMusic) {
      parts.push("Pas de musique.");
    }
    if (data.audioDesign.hasVoiceoverOrDialogue) {
      parts.push(
        `Voix (${data.audioDesign.spokenLanguage || "Français"}) : ${data.audioDesign.voiceTone || "ton neutre, diction claire"}`
      );
    }
    audioContent = parts.length > 0 ? `Audio : ${parts.join(" | ")}` : "Audio : (configuration à compléter à l'étape 6)";
  }
  const audioBlock = `[CONCEPTION AUDIO]\n${audioContent}`;

  // 4. On-Screen Text & Dialogue (in French)
  const textDialogueLines: string[] = [];
  if (data.onScreenText.hasText && data.onScreenText.exactString.trim() !== "") {
    textDialogueLines.push(
      `Texte à l'écran (affiché tel quel) : « ${data.onScreenText.exactString.trim()} »`
    );
  }
  if (data.spokenDialogue.hasDialogue && data.spokenDialogue.exactLines.trim() !== "") {
    const lang = data.spokenDialogue.languageCode || "Français";
    textDialogueLines.push(
      `Dialogue parlé (${lang}) : ${data.spokenDialogue.exactLines.trim()}`
    );
  }

  const textAndDialogueBlock =
    textDialogueLines.length > 0
      ? `[TEXTE À L'ÉCRAN & DIALOGUES]\n${textDialogueLines.join("\n")}`
      : `[TEXTE À L'ÉCRAN & DIALOGUES]\nAucun texte à l'écran. Aucun dialogue.`;

  // 5. Preservation & References (in French)
  const preservationLines: string[] = [];
  if (data.references.length > 0) {
    data.references.forEach((ref, idx) => {
      preservationLines.push(
        `Référence ${idx + 1} (rôle : ${ref.role}) : ${ref.definesText || "(définition non précisée)"}. À préserver : ${ref.preserveText || "(non précisé)"}.`
      );
    });
  }
  if (data.preservationRules.elementsToPreserve) {
    preservationLines.push(
      `Consignes de préservation : ${data.preservationRules.elementsToPreserve}`
    );
  }
  if (data.preservationRules.mistakesToAvoid) {
    preservationLines.push(
      `Erreurs à éviter : ${data.preservationRules.mistakesToAvoid}`
    );
  }

  const preservationBlock =
    preservationLines.length > 0
      ? `[PRÉSERVATION & RÉFÉRENCES]\n${preservationLines.join("\n")}`
      : `[PRÉSERVATION & RÉFÉRENCES]\nAucune consigne de préservation.`;

  // 6. Negative Constraints (in French)
  let negStr = "";
  if (data.negativeConstraints.length > 0) {
    negStr = data.negativeConstraints.map((c) => c.text.trim()).join(", ");
  } else {
    negStr = "(aucune — recommandé : 3 à 6 contraintes, ex : « no subtitles, no soft dissolves, no lens flares »)";
  }
  const negativeConstraintsBlock = `[CONTRAINTES NÉGATIVES]\n${negStr}`;

  // Standalone camera summary (not used in the main French prompt output
  // but kept for API parity with the English version).
  const cameraBlock = `[RÉCAP CAMÉRA]\n${data.shots
    .map((s, idx) => {
      const c = data.cameraDirections[s.id];
      if (!c) return `Plan ${idx + 1} : (à configurer)`;
      return `Plan ${idx + 1} : ${FRAMING_TRANSLATIONS_FR[c.framing]}, ${ANGLE_TRANSLATIONS_FR[c.angle]}, ${MOTION_TRANSLATIONS_FR[c.motion]}`;
    })
    .join("\n")}`;

  return {
    styleContractBlock,
    timelineBlock,
    cameraBlock,
    audioBlock,
    textAndDialogueBlock,
    preservationBlock,
    negativeConstraintsBlock,
  };
}

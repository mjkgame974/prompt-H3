import { ProjectData, ValidationIssue } from "../types/minimax";

/**
 * MiniMax H3 Rules Engine
 * Evaluates the project state against MiniMax H3 best practices and strict model constraints.
 */
export function validateProjectData(data: ProjectData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Rule 1: Shot Count vs Duration
  const shotCount = data.shots.length;
  if (data.duration === "10s" && shotCount > 3) {
    issues.push({
      id: "err_shot_count_10s",
      step: 4,
      field: "shots",
      severity: "warning",
      title: "Trop de plans pour 10 secondes (Max 2-3 moments)",
      message:
        "MiniMax H3 recommande un maximum de 2 à 3 moments sur une vidéo de 10 secondes pour éviter les saccades ou coupures brutales.",
      fixActionLabel: "Conserver seulement les 3 meilleurs plans",
    });
  } else if (data.duration === "5s" && shotCount > 2) {
    issues.push({
      id: "err_shot_count_5s",
      step: 4,
      field: "shots",
      severity: "warning",
      title: "Trop de plans pour une vidéo de 5 secondes",
      message:
        "Sur 5 secondes, limitez-vous idéalement à 1 ou 2 plans maximum pour laisser le temps au modèle de développer l'action.",
      fixActionLabel: "Réduire à 2 plans max",
    });
  }

  // Rule 2: Timeline Chronology & Timestamp Format
  data.shots.forEach((shot, index) => {
    if (index === 0 && shot.timestamp && shot.timestamp.trim() !== "") {
      issues.push({
        id: `err_shot_1_timestamp_${shot.id}`,
        step: 4,
        field: `shot_${shot.id}`,
        severity: "info",
        title: "Le premier plan ne doit pas être horodaté",
        message:
          "Selon le format MiniMax H3, le [Shot 1] commence implicitement à 00:00.000. Seuls les plans suivants doivent inclure At 00:0X.000.",
        fixActionLabel: "Supprimer l'horodatage du Shot 1",
      });
    }

    if (index > 0) {
      if (!shot.timestamp || shot.timestamp.trim() === "") {
        issues.push({
          id: `err_shot_missing_time_${shot.id}`,
          step: 4,
          field: `shot_${shot.id}`,
          severity: "warning",
          title: `Horodatage manquant pour le Plan ${shot.shotNumber}`,
          message: `Le plan ${shot.shotNumber} doit inclure un horodatage explicite (ex: At 00:0${(index * 4).toFixed(0)}.000).`,
          fixActionLabel: "Générer automatiquement le temps",
        });
      }
    }
  });

  // Rule 3: Single Camera Motion Per Shot (STRICT)
  data.shots.forEach((shot) => {
    const cam = data.cameraDirections[shot.id];
    if (cam && cam.secondaryMotionAttempt) {
      issues.push({
        id: `err_double_camera_${shot.id}`,
        step: 5,
        field: `camera_${shot.id}`,
        severity: "error",
        title: `Règle stricte MiniMax H3 : Un seul mouvement caméra (Plan ${shot.shotNumber})`,
        message:
          "Vous avez sélectionné plusieurs mouvements de caméra pour ce plan. MiniMax H3 autorise un SEUL mouvement caméra par plan pour préserver la stabilité visuelle.",
        fixActionLabel: "Conserver un seul mouvement caméra",
      });
    }
  });

  // Rule 4: Mandatory Audio Block
  if (
    !data.audioDesign.isSilent &&
    !data.audioDesign.ambientSound &&
    !data.audioDesign.keySFX &&
    !data.audioDesign.musicDescription &&
    !data.audioDesign.hasVoiceoverOrDialogue
  ) {
    issues.push({
      id: "err_missing_audio_block",
      step: 6,
      field: "audioDesign",
      severity: "error",
      title: "Bloc audio obligatoire manquant",
      message:
        "MiniMax H3 impose la présence d'un bloc audio explicite, même en cas de silence. Si aucun son n'est souhaité, cochez l'option silence.",
      fixActionLabel: "Appliquer 'Audio: Room tone only. No music.'",
    });
  }

  // Rule 5: Reference Without Role (BLOCKING)
  data.references.forEach((ref, idx) => {
    if (!ref.role || ref.role.trim() === "") {
      issues.push({
        id: `err_ref_no_role_${ref.id}`,
        step: 3,
        field: `ref_${ref.id}`,
        severity: "error",
        title: `Rôle obligatoire manquant pour l'image référence ${idx + 1}`,
        message:
          "Chaque référence doit recevoir un rôle explicite (ambiance, personnage, produit, décor, logo).",
        fixActionLabel: "Assigner un rôle à la référence",
      });
    }
  });

  // Rule 6: Missing Preservation Rules when references exist
  if (data.references.length > 0 && !data.preservationRules.elementsToPreserve) {
    issues.push({
      id: "warn_missing_preservation",
      step: 8,
      field: "preservationRules",
      severity: "warning",
      title: "Consignes de préservation manquantes",
      message:
        "Des références ont été ajoutées, mais aucun élément à préserver n'est précisé à l'étape 8. Formulez ce qui doit rester inchangé.",
      fixActionLabel: "Ajouter les consignes de préservation",
    });
  }

  // Rule 7: On-screen Text Exact Syntax Check
  if (data.onScreenText.hasText) {
    const txt = data.onScreenText.exactString || "";
    if (
      txt.toLowerCase().includes("un texte qui") ||
      txt.toLowerCase().includes("afficher le texte") ||
      txt.toLowerCase().includes("qui dit") ||
      txt.toLowerCase().includes("écrit")
    ) {
      issues.push({
        id: "warn_descriptive_text",
        step: 7,
        field: "onScreenText",
        severity: "warning",
        title: "Texte décrit au lieu d'être cité mot pour mot",
        message:
          "Ne décrivez pas le texte (ex: 'un texte qui dit bonjour'). Inscrivez uniquement la chaîne exacte qui apparaîtra à l'écran.",
        fixActionLabel: "Corriger avec le texte exact",
      });
    }
  }

  // Rule 8: Negative Constraints Range (3 to 6 useful items)
  const negCount = data.negativeConstraints.length;
  if (negCount < 3) {
    issues.push({
      id: "warn_neg_too_few",
      step: 8,
      field: "negativeConstraints",
      severity: "info",
      title: "Liste négative recommandée : 3 à 6 contraintes",
      message:
        "Ajoutez 3 à 6 contraintes utiles (ex: no subtitles, no soft dissolves, no lens flares) pour guider efficacement le modèle.",
      fixActionLabel: "Ajouter les contraintes recommandées",
    });
  } else if (negCount > 6) {
    issues.push({
      id: "warn_neg_too_many",
      step: 8,
      field: "negativeConstraints",
      severity: "warning",
      title: "Liste négative trop longue (> 6 contraintes)",
      message:
        "Trop de contraintes négatives peuvent étouffer la créativité du modèle ou dégrader la cohérence de la vidéo. Limitez-vous aux 6 plus importantes.",
      fixActionLabel: "Garder seulement les 6 meilleures",
    });
  }

  return issues;
}

/**
 * Calculates a 0-100% compliance score for MiniMax H3 rules
 */
export function calculateH3ComplianceScore(
  data: ProjectData,
  existingIssues?: ValidationIssue[]
): number {
  const issues = existingIssues || validateProjectData(data);
  let score = 100;

  issues.forEach((issue) => {
    if (issue.severity === "error") score -= 20;
    else if (issue.severity === "warning") score -= 8;
    else if (issue.severity === "info") score -= 3;
  });

  // Check completeness bonuses/penalties
  if (!data.styleContract.condensedEnglishSentence) score -= 10;
  if (data.shots.length === 0) score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}


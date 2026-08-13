import { ProjectData } from "../../types/minimax";
import { INITIAL_PROJECT_DATA } from "../../constants/presets";

/**
 * Reusable test fixture: a complete, valid MiniMax H3 project that should
 * produce no validation errors. Based on INITIAL_PROJECT_DATA but with
 * a stable id/title so tests stay deterministic.
 */
export const validPerfumeProject: ProjectData = {
  ...INITIAL_PROJECT_DATA,
  id: "proj_test_fixture",
  title: "Test Perfume Ad",
};

/**
 * A 5-second project fixture (used to test shot count rules).
 */
export const short5sProject: ProjectData = {
  ...validPerfumeProject,
  duration: "5s",
  shots: [validPerfumeProject.shots[0]],
  cameraDirections: {
    [validPerfumeProject.shots[0].id]: validPerfumeProject.cameraDirections[validPerfumeProject.shots[0].id],
  },
};

/**
 * A project with no audio configured (used to test the mandatory audio block rule).
 */
export const projectWithoutAudio: ProjectData = {
  ...validPerfumeProject,
  audioDesign: {
    ...validPerfumeProject.audioDesign,
    isSilent: false,
    ambientSound: "",
    keySFX: "",
    musicDescription: "",
    hasMusic: false,
    hasVoiceoverOrDialogue: false,
  },
};

/**
 * A project with double camera motion (used to test the single-motion rule).
 */
export const projectWithDoubleCamera: ProjectData = {
  ...validPerfumeProject,
  cameraDirections: {
    ...validPerfumeProject.cameraDirections,
    [validPerfumeProject.shots[0].id]: {
      ...validPerfumeProject.cameraDirections[validPerfumeProject.shots[0].id],
      secondaryMotionAttempt: "zoom_in",
    },
  },
};

import { describe, it, expect } from "vitest";
import {
  compileMiniMaxH3Prompt,
  compile5sTestPrompt,
  compileBlockStructured,
  compileFrenchPrompt,
  compileBlockStructuredFrench,
} from "./compiler";
import {
  validPerfumeProject,
  short5sProject,
  emptyProject,
} from "./__fixtures__/projectFixture";

describe("compileMiniMaxH3Prompt", () => {
  it("starts with a [STYLE CONTRACT] block containing the condensed English sentence", () => {
    const prompt = compileMiniMaxH3Prompt(validPerfumeProject);
    expect(prompt).toMatch(/^\[STYLE CONTRACT\]/);
    expect(prompt).toContain(
      "Macro studio commercial camera, flawless metallic sheen"
    );
  });

  it("renders Shot 1 without a timestamp and Shot 2+ with explicit At HH:MM:SS timestamps", () => {
    const prompt = compileMiniMaxH3Prompt(validPerfumeProject);
    expect(prompt).toMatch(/\[Shot 1\][^[]*$/m); // Shot 1 header
    expect(prompt).toContain("At 00:05.000");
    // Shot 1 should NOT contain "At 00:" prefix
    const shot1Line = prompt.split("\n").find((l) => l.includes("[Shot 1]")) ?? "";
    expect(shot1Line).not.toMatch(/At 00:/);
  });

  it("always emits a [AUDIO DESIGN] block (mandatory per H3 spec)", () => {
    const prompt = compileMiniMaxH3Prompt(validPerfumeProject);
    expect(prompt).toContain("[AUDIO DESIGN]");
  });

  it("outputs the exact H3 on-screen text syntax 'reading exactly: \"...\"' when text is set", () => {
    const prompt = compileMiniMaxH3Prompt(validPerfumeProject);
    expect(prompt).toContain('On-screen text reading exactly: "PURE LUXURY"');
  });

  it("outputs the dialogue tag <d>[Language] Text</d> when dialogue is configured", () => {
    const prompt = compileMiniMaxH3Prompt({
      ...validPerfumeProject,
      spokenDialogue: {
        hasDialogue: true,
        languageCode: "English",
        exactLines: "Hello world",
      },
    });
    expect(prompt).toContain("<d>[English] Hello world</d>");
  });

  it("emits a fallback audio line when isSilent is true", () => {
    const prompt = compileMiniMaxH3Prompt({
      ...validPerfumeProject,
      audioDesign: { ...validPerfumeProject.audioDesign, isSilent: true },
    });
    expect(prompt).toContain("Audio: Room tone only. No music.");
  });

  it("emits a default negative constraints list when none are configured", () => {
    const prompt = compileMiniMaxH3Prompt({
      ...validPerfumeProject,
      negativeConstraints: [],
    });
    expect(prompt).toContain("[NEGATIVE CONSTRAINTS]");
    expect(prompt).toContain("no subtitles");
  });

  it("uses the configured negative constraints verbatim", () => {
    const prompt = compileMiniMaxH3Prompt({
      ...validPerfumeProject,
      negativeConstraints: [
        { id: "n1", text: "no plastic look" },
        { id: "n2", text: "no pixelated artifacts" },
        { id: "n3", text: "no slow motion" },
      ],
    });
    expect(prompt).toContain("no plastic look, no pixelated artifacts, no slow motion");
  });

  it("includes camera framing/angle/motion/speed for every shot", () => {
    const prompt = compileMiniMaxH3Prompt(validPerfumeProject);
    expect(prompt).toContain("Camera: Medium shot, Low angle shot, Tracking shot forward");
    expect(prompt).toContain("Camera: Close-up, Eye level angle, Static locked camera");
  });

  it("falls back to a default camera line when a shot has no cameraDirections entry", () => {
    const prompt = compileMiniMaxH3Prompt({
      ...validPerfumeProject,
      cameraDirections: {},
    });
    expect(prompt).toContain("Camera: Medium shot, static locked camera.");
  });
});

describe("compile5sTestPrompt", () => {
  it("produces a single-shot version with a [TEST 5S] header", () => {
    const prompt = compile5sTestPrompt(validPerfumeProject);
    expect(prompt).toMatch(/\[TEST 5S FAST PREVIEW VERSION\]/);
  });

  it("uses the first shot only (no second-shot timestamp)", () => {
    const prompt = compile5sTestPrompt(validPerfumeProject);
    expect(prompt).toContain("[Shot 1]");
    expect(prompt).not.toContain("At 00:05.000");
  });

  it("truncates negative constraints to 4 items max in the 5s test version", () => {
    const prompt = compile5sTestPrompt({
      ...validPerfumeProject,
      negativeConstraints: [
        { id: "n1", text: "no a" },
        { id: "n2", text: "no b" },
        { id: "n3", text: "no c" },
        { id: "n4", text: "no d" },
        { id: "n5", text: "no e" },
      ],
    });
    expect(prompt).toContain("no a, no b, no c, no d");
    expect(prompt).not.toContain("no e");
  });
});

describe("compileBlockStructured", () => {
  it("returns all 7 expected blocks", () => {
    const blocks = compileBlockStructured(validPerfumeProject);
    expect(blocks).toHaveProperty("styleContractBlock");
    expect(blocks).toHaveProperty("timelineBlock");
    expect(blocks).toHaveProperty("cameraBlock");
    expect(blocks).toHaveProperty("audioBlock");
    expect(blocks).toHaveProperty("textAndDialogueBlock");
    expect(blocks).toHaveProperty("preservationBlock");
    expect(blocks).toHaveProperty("negativeConstraintsBlock");
  });

  it("uses the condensedEnglishSentence when available", () => {
    const blocks = compileBlockStructured(validPerfumeProject);
    expect(blocks.styleContractBlock).toContain(
      "Macro studio commercial camera, flawless metallic sheen"
    );
  });

  it("synthesizes a style contract from individual fields when no condensed sentence is provided", () => {
    const blocks = compileBlockStructured({
      ...validPerfumeProject,
      styleContract: {
        ...validPerfumeProject.styleContract,
        condensedEnglishSentence: "",
      },
    });
    expect(blocks.styleContractBlock).toContain("Macro studio commercial camera");
    expect(blocks.styleContractBlock).toContain("gold, obsidian black");
  });

  it("emits a preservation block listing each reference with role", () => {
    const blocks = compileBlockStructured({
      ...validPerfumeProject,
      references: [
        {
          id: "ref1",
          name: "Bottle hero",
          role: "produit",
          definesText: "Bottle silhouette",
          preserveText: "Gold cap intact",
        },
      ],
    });
    expect(blocks.preservationBlock).toContain("Reference 1 (PRODUIT)");
    expect(blocks.preservationBlock).toContain("Bottle silhouette");
    expect(blocks.preservationBlock).toContain("Gold cap intact");
  });

  it("emits the default preservation fallback when no references and no rules are set", () => {
    const blocks = compileBlockStructured({
      ...validPerfumeProject,
      references: [],
      preservationRules: { elementsToPreserve: "", mistakesToAvoid: "" },
    });
    expect(blocks.preservationBlock).toContain("Preserve key subject details");
  });
});

describe("compileFrenchPrompt", () => {
  it("emits French block labels ([CONTRAT DE STYLE], [PLANS & TIMELINE]...)", () => {
    const prompt = compileFrenchPrompt(validPerfumeProject);
    expect(prompt).toContain("[CONTRAT DE STYLE]");
    expect(prompt).toContain("[PLANS & TIMELINE]");
    expect(prompt).toContain("[CONCEPTION AUDIO]");
    expect(prompt).toContain("[TEXTE À L'ÉCRAN & DIALOGUES]");
    expect(prompt).toContain("[PRÉSERVATION & RÉFÉRENCES]");
    expect(prompt).toContain("[CONTRAINTES NÉGATIVES]");
  });

  it("uses the condensedEnglishSentence as-is (with a French explanation note)", () => {
    const prompt = compileFrenchPrompt(validPerfumeProject);
    expect(prompt).toContain("Macro studio commercial camera, flawless metallic sheen");
    expect(prompt).toContain("utilisée en anglais dans le prompt final H3");
  });

  it("renders Shot 1 without a timestamp and Shot 2+ with [Plan N] À HH:MM:SS", () => {
    const prompt = compileFrenchPrompt(validPerfumeProject);
    expect(prompt).toContain("[Plan 1]");
    expect(prompt).toContain("[Plan 2] À 00:05.000");
  });

  it("uses French camera terminology (Plan moyen, Contre-plongée, Travelling avant...)", () => {
    const prompt = compileFrenchPrompt(validPerfumeProject);
    expect(prompt).toContain("Plan moyen");
    expect(prompt).toContain("Contre-plongée");
    expect(prompt).toContain("Travelling avant");
    expect(prompt).toContain("à vitesse subtile");
  });

  it("renders the on-screen text with French guillemets and exact content", () => {
    const prompt = compileFrenchPrompt(validPerfumeProject);
    expect(prompt).toContain('« PURE LUXURY »');
  });

  it("renders dialogue with the language name in French", () => {
    const prompt = compileFrenchPrompt({
      ...validPerfumeProject,
      spokenDialogue: {
        hasDialogue: true,
        languageCode: "English",
        exactLines: "Hello world",
      },
    });
    expect(prompt).toContain("Dialogue parlé (English) : Hello world");
  });

  it("shows a placeholder when the project is empty (no shots, no style)", () => {
    const prompt = compileFrenchPrompt(emptyProject);
    expect(prompt).toContain("[CONTRAT DE STYLE]");
    expect(prompt).toContain("(Aucun plan défini");
    expect(prompt).toContain("Silence");
  });

  it("synthesises a style contract from individual fields when no condensed sentence is set", () => {
    const prompt = compileFrenchPrompt({
      ...validPerfumeProject,
      styleContract: {
        ...validPerfumeProject.styleContract,
        condensedEnglishSentence: "",
      },
    });
    expect(prompt).toContain("Medium : Macro studio commercial camera");
    expect(prompt).toContain("Palette : gold, obsidian black");
  });

  it("emits negative constraints verbatim (the user typed them in English)", () => {
    const prompt = compileFrenchPrompt({
      ...validPerfumeProject,
      negativeConstraints: [
        { id: "n1", text: "no plastic look" },
        { id: "n2", text: "no pixelated artifacts" },
        { id: "n3", text: "no slow motion" },
      ],
    });
    expect(prompt).toContain("no plastic look, no pixelated artifacts, no slow motion");
  });
});

describe("compileBlockStructuredFrench", () => {
  it("returns all 7 expected blocks (matches the English API)", () => {
    const blocks = compileBlockStructuredFrench(validPerfumeProject);
    expect(blocks).toHaveProperty("styleContractBlock");
    expect(blocks).toHaveProperty("timelineBlock");
    expect(blocks).toHaveProperty("cameraBlock");
    expect(blocks).toHaveProperty("audioBlock");
    expect(blocks).toHaveProperty("textAndDialogueBlock");
    expect(blocks).toHaveProperty("preservationBlock");
    expect(blocks).toHaveProperty("negativeConstraintsBlock");
  });

  it("renders references in French with their role", () => {
    const blocks = compileBlockStructuredFrench({
      ...validPerfumeProject,
      references: [
        {
          id: "ref1",
          name: "Bottle hero",
          role: "produit",
          definesText: "Forme du flacon",
          preserveText: "Logo intact",
        },
      ],
    });
    expect(blocks.preservationBlock).toContain("Référence 1 (rôle : produit)");
    expect(blocks.preservationBlock).toContain("Forme du flacon");
    expect(blocks.preservationBlock).toContain("À préserver : Logo intact");
  });
});

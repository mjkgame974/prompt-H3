import { PresetTemplate, ProjectData } from "../types/minimax";

export interface StylePreset {
  id: string;
  name: string;
  medium: string;
  texture: string;
  palette: string;
  era: string;
  visualRendering: string;
  condensedEnglish: string;
  previewColor: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "cinematic_35mm",
    name: "35mm Cinématique",
    medium: "35mm analog film shot on anamorphic lens",
    texture: "fine organic film grain, soft cinematic blooming highlights",
    palette: "warm amber, deep teal, rich shadows",
    era: "contemporary high-end cinema",
    visualRendering: "ultra-photorealistic 8k movie render",
    condensedEnglish: "Cinematic 35mm analog film shot on anamorphic lens, fine organic film grain with blooming highlights, warm amber and deep teal palette, contemporary high-end cinema, ultra-photorealistic 8k movie render.",
    previewColor: "from-amber-600 to-cyan-900",
  },
  {
    id: "luxury_product",
    name: "Studio Produit Luxe",
    medium: "Macro studio commercial camera",
    texture: "flawless metallic sheen, razor-sharp focus, liquid refraction",
    palette: "gold, obsidian black, crisp silver accent",
    era: "modern premium luxury advertisement",
    visualRendering: "photorealistic studio lighting with raytraced reflections",
    condensedEnglish: "Macro studio commercial camera, flawless metallic sheen with razor-sharp focus and liquid refraction, gold and obsidian black palette, modern premium luxury advertisement, photorealistic studio lighting with raytraced reflections.",
    previewColor: "from-amber-400 to-stone-900",
  },
  {
    id: "anime_2d",
    name: "Animation 2D High-Detail",
    medium: "Hand-drawn 2D digital anime artwork",
    texture: "crisp cell shading, painterly watercolor background, vivid lineart",
    palette: "vibrant pastel blues, sunset pinks and deep indigo",
    era: "modern anime film aesthetic",
    visualRendering: "high-budget theatrical anime animation render",
    condensedEnglish: "Hand-drawn 2D digital anime artwork, crisp cell shading with painterly watercolor background, vibrant pastel blues and sunset pinks, modern anime film aesthetic, high-budget theatrical anime animation render.",
    previewColor: "from-indigo-500 to-rose-400",
  },
  {
    id: "retro_vhs_90s",
    name: "Rétro VHS 90s",
    medium: "1990s magnetic tape camcorder video",
    texture: "scanlines, subtle tape distortion, soft chromatic aberration",
    palette: "saturated neon magentas, electric cyan, grainy darks",
    era: "1990s retro nostalgic vibe",
    visualRendering: "authentic vintage analog VHS capture",
    condensedEnglish: "1990s magnetic tape camcorder video, scanlines and subtle tape distortion with chromatic aberration, saturated neon magenta and electric cyan, 1990s retro nostalgic vibe, authentic vintage analog VHS capture.",
    previewColor: "from-fuchsia-600 to-cyan-500",
  },
  {
    id: "dark_thriller_noir",
    name: "Dark Noir / Thriller",
    medium: "Digital cinema camera with low-light sensor",
    texture: "heavy atmospheric fog, wet pavement glisten, moody grain",
    palette: "desaturated icy blue, deep charcoal, single warm street light key",
    era: "neo-noir contemporary mystery",
    visualRendering: "dramatic high-contrast chiaroscuro lighting",
    condensedEnglish: "Digital cinema camera with low-light sensor, heavy atmospheric fog and wet pavement glisten, desaturated icy blue and charcoal palette with warm key light, neo-noir contemporary mystery, dramatic high-contrast chiaroscuro lighting.",
    previewColor: "from-slate-900 to-blue-950",
  },
];

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "perfume_ad_example",
    name: "Pub Produit Luxe (Parfum)",
    description: "Exemple prérempli complet : Publicité parfum premium 10s avec 3 plans, audio design et texte exact.",
    badge: "Exemple Complet",
    data: {
      title: "Publicité Parfum Luxe - Essence de Nuit",
      videoType: "pub_produit",
      videoGoal: "vendre",
      emotion: "Élégance, mystère, désir et raffinement",
      aspectRatio: "16:9",
      duration: "10s",
      styleContract: {
        medium: "Macro studio commercial camera",
        texture: "flawless metallic sheen, razor-sharp focus, liquid refraction",
        palette: "gold, obsidian black, crisp silver accent",
        era: "modern premium luxury advertisement",
        visualRendering: "photorealistic studio lighting with raytraced reflections",
        condensedEnglishSentence:
          "Macro studio commercial camera, flawless metallic sheen with razor-sharp focus and liquid refraction, gold and obsidian black palette, modern premium luxury advertisement, photorealistic studio lighting with raytraced reflections.",
      },
      references: [
        {
          id: "ref_1",
          name: "Flacon Parfum Référence",
          role: "produit",
          definesText: "Flacon en verre sombre facetté avec bouchon doré cylindrique",
          preserveText: "Conserver exactement la géométrie du flacon, le logo doré et la teinte du verre",
        },
        {
          id: "ref_2",
          name: "Décor Plateau Studio",
          role: "decor",
          definesText: "Socle en obsidienne noire avec fine pellicule d'eau en surface",
          preserveText: "Garder la texture de roche noire polie et les reflets dorés",
        },
      ],
      shots: [
        {
          id: "shot_1",
          shotNumber: 1,
          visualDescription:
            "Un flacon de parfum de luxe reposant au centre d'une surface en obsidienne noire mouillée, une brume délicate s'élève doucement autour du socle.",
          subjectAction: "Le flacon demeure majestueux tandis qu'une vapeur fine serpente à sa base.",
          atmosphere: "Éclairage studio feutré avec contre-jour doré subtil.",
        },
        {
          id: "shot_2",
          shotNumber: 2,
          timestamp: "00:04.000",
          visualDescription:
            "Des gouttes d'eau cristalline tombent lentement sur le bouchon cylindrique doré, créant de micro-ondulations lumineuses.",
          subjectAction: "L'eau rebondit en ralenti extrême sur le métal doré.",
          atmosphere: "Macro précision, réfractions étincelantes sous les spots.",
        },
        {
          id: "shot_3",
          shotNumber: 3,
          timestamp: "00:07.500",
          visualDescription:
            "Une lueur ambrée traverse le jus contenu dans le verre sombre, révélant la transparence dorée interne.",
          subjectAction: "La lumière glisse de gauche à droite à travers le flacon.",
          atmosphere: "Ambiance chaleureuse, fond s'estompant doucement.",
        },
      ],
      cameraDirections: {
        shot_1: {
          shotId: "shot_1",
          framing: "medium",
          angle: "low_angle",
          motion: "tracking_forward",
          speed: "subtle",
        },
        shot_2: {
          shotId: "shot_2",
          framing: "extreme_close_up",
          angle: "high_angle",
          motion: "static",
          speed: "subtle",
        },
        shot_3: {
          shotId: "shot_3",
          framing: "close_up",
          angle: "eye_level",
          motion: "orbit",
          speed: "smooth",
        },
      },
      audioDesign: {
        isSilent: false,
        ambientSound: "Bruit d'ambiance de studio calme avec léger chuchotement d'eau",
        keySFX: "Plouf cristallin au goutte-à-goutte à 00:04.000",
        hasMusic: true,
        musicDescription: "Nappe synthétique ambiante élégante et profonde avec violoncelle discret",
        hasVoiceoverOrDialogue: true,
        voiceType: "voiceover",
        spokenLanguage: "French",
        voiceTone: "Voix féminine grave, sensuelle et posée",
      },
      onScreenText: {
        hasText: true,
        exactString: "ESSENCE DE NUIT",
        isExactFormat: true,
      },
      spokenDialogue: {
        hasDialogue: true,
        languageCode: "French",
        exactLines: "Découvrez l'élégance absolue de la nuit.",
      },
      preservationRules: {
        elementsToPreserve:
          "Conserver rigoureusement la forme du flacon, le logo doré sur la face avant et la couleur du jus ambré.",
        mistakesToAvoid: "Ne pas déformer le bouchon, éviter les reflets parasites incontrôlés.",
      },
      negativeConstraints: [
        { id: "neg_1", text: "no subtitles" },
        { id: "neg_2", text: "no soft dissolves" },
        { id: "neg_3", text: "no lens flares" },
        { id: "neg_4", text: "no extra people" },
        { id: "neg_5", text: "no camera shake" },
      ],
    },
  },
  {
    id: "trailer_cinematic",
    name: "Trailer Cinématique Sci-Fi",
    description: "Structure pour teaser de film de science-fiction avec révélations progressives.",
    badge: "Trailer",
    data: {
      title: "Teaser Sci-Fi - Horizon Zéro",
      videoType: "trailer",
      videoGoal: "teaser",
      emotion: "Intensité, suspense et mystère technologique",
      aspectRatio: "21:9",
      duration: "10s",
      styleContract: {
        medium: "8k IMAX anamorphic digital cinema camera",
        texture: "clean volumetric light, dense fog particles, cold metallic sheen",
        palette: "cyan blue, deep indigo, stark orange warning lights",
        era: "futuristic sci-fi dystopian 2150",
        visualRendering: "hyper-realistic photorealistic VFX film quality",
        condensedEnglishSentence:
          "8k IMAX anamorphic digital cinema camera, clean volumetric light with dense fog particles and cold metallic sheen, cyan blue and orange warning light palette, futuristic sci-fi dystopian 2150, hyper-realistic photorealistic VFX film quality.",
      },
      references: [
        {
          id: "ref_1",
          name: "Vaisseau Spatial Référence",
          role: "produit",
          definesText: "Coque en acier sombre avec lignes lumineuses bleues",
          preserveText: "Maintenir la silhouette angulaire et les turbines néon",
        },
      ],
      shots: [
        {
          id: "shot_1",
          shotNumber: 1,
          visualDescription:
            "Un gigantesque vaisseau spatial émerge lentement d'un nuage de brume orbitale sombre.",
          subjectAction: "Le vaisseau avance à vitesse majestueuse.",
          atmosphere: "Espace infini avec lumière rasante de planète distante.",
        },
        {
          id: "shot_2",
          shotNumber: 2,
          timestamp: "00:05.000",
          visualDescription:
            "Un pilote en combinaison futuriste se retourne dans son cockpit alors que les réacteurs s'allument en orange intense.",
          subjectAction: "Son casque reflète les voyants d'urgence qui clignotent.",
          atmosphere: "Cockpit sombre illuminé par des holos orange.",
        },
      ],
      cameraDirections: {
        shot_1: {
          shotId: "shot_1",
          framing: "wide",
          angle: "low_angle",
          motion: "tracking_forward",
          speed: "subtle",
        },
        shot_2: {
          shotId: "shot_2",
          framing: "close_up",
          angle: "eye_level",
          motion: "static",
          speed: "subtle",
        },
      },
      audioDesign: {
        isSilent: false,
        ambientSound: "Grondeur basse fréquence de propulsion et souffle d'oxygène",
        keySFX: "Bip d'urgence synthétique à 00:05.000",
        hasMusic: true,
        musicDescription: "Basse de synthèse lourde et montée crescendo cinématique",
        hasVoiceoverOrDialogue: false,
        voiceType: "none",
        spokenLanguage: "",
        voiceTone: "",
      },
      onScreenText: {
        hasText: true,
        exactString: "PROCHAINEMENT EN 2027",
        isExactFormat: true,
      },
      spokenDialogue: {
        hasDialogue: false,
        languageCode: "",
        exactLines: "",
      },
      preservationRules: {
        elementsToPreserve: "Conserver le design du casque du pilote et la silhouette du vaisseau.",
        mistakesToAvoid: "Ne pas ajouter d'explosion excessive ou d'artefacts vidéo.",
      },
      negativeConstraints: [
        { id: "neg_1", text: "no cartoon elements" },
        { id: "neg_2", text: "no fast cuts" },
        { id: "neg_3", text: "no text overlay before ending" },
        { id: "neg_4", text: "no watermarks" },
      ],
    },
  },
  {
    id: "anime_transformation",
    name: "Animation 2D (Combat / Super Pouvoir)",
    description: "Exemple pour animation d'action dynamique style anime japonais.",
    badge: "Anime 2D",
    data: {
      title: "Animation Action 2D - Éveil Électrique",
      videoType: "animation_2d",
      videoGoal: "raconter",
      emotion: "Énergie explosive et puissance héroïque",
      aspectRatio: "16:9",
      duration: "10s",
      styleContract: {
        medium: "Hand-drawn 2D digital anime artwork",
        texture: "vivid lineart, speedlines, energetic impact frames",
        palette: "electric blue, bright gold aura, dark violet background",
        era: "modern shonen anime feature film",
        visualRendering: "high-fps fluid sakuga hand-drawn animation",
        condensedEnglishSentence:
          "Hand-drawn 2D digital anime artwork, vivid lineart with speedlines and energetic impact frames, electric blue and bright gold aura palette, modern shonen anime feature film, high-fps fluid sakuga hand-drawn animation.",
      },
      references: [
        {
          id: "ref_1",
          name: "Personnage Héro",
          role: "personnage",
          definesText: "Jeune guerrier aux cheveux hérissés argentés et manteau sombre",
          preserveText: "Conserver la coupe de cheveux et l'emblème sur l'épaule",
        },
      ],
      shots: [
        {
          id: "shot_1",
          shotNumber: 1,
          visualDescription:
            "Le guerrier ferme les yeux alors que des étincelles bleues crépitent autour de ses poings.",
          subjectAction: "Sa chevelure commence à flotter contre la gravité.",
          atmosphere: "Champs d'énergie montante avec poussière en lévitation.",
        },
        {
          id: "shot_2",
          shotNumber: 2,
          timestamp: "00:04.500",
          visualDescription:
            "Il ouvre de grands yeux dorés lumineux et déclenche une onde de choc fulgurante vers l'avant.",
          subjectAction: "Extension brutale du bras vers la caméra avec aura dorée.",
          atmosphere: "Éclairs aveuglants et speedlines d'impact.",
        },
      ],
      cameraDirections: {
        shot_1: {
          shotId: "shot_1",
          framing: "medium",
          angle: "eye_level",
          motion: "zoom_in",
          speed: "smooth",
        },
        shot_2: {
          shotId: "shot_2",
          framing: "close_up",
          angle: "low_angle",
          motion: "handheld",
          speed: "dynamic",
        },
      },
      audioDesign: {
        isSilent: false,
        ambientSound: "Grondeur d'énergie électrique puis détonation d'impact",
        keySFX: "Éclair assourdissant à 00:04.500",
        hasMusic: true,
        musicDescription: "Guitare électrique frénétique style rock anime",
        hasVoiceoverOrDialogue: true,
        voiceType: "dialogue",
        spokenLanguage: "Japanese",
        voiceTone: "Cri de puissance héroïque déterminé",
      },
      onScreenText: {
        hasText: false,
        exactString: "",
        isExactFormat: false,
      },
      spokenDialogue: {
        hasDialogue: true,
        languageCode: "Japanese",
        exactLines: "LIMIT BREAK!",
      },
      preservationRules: {
        elementsToPreserve: "Garder le style de dessin sakuga 2D pur sans passer en 3D.",
        mistakesToAvoid: "Éviter les visages déformés hors style anime.",
      },
      negativeConstraints: [
        { id: "neg_1", text: "no 3D render look" },
        { id: "neg_2", text: "no blurry frames" },
        { id: "neg_3", text: "no extra weapons" },
      ],
    },
  },
];

export const INITIAL_PROJECT_DATA: ProjectData = {
  id: "proj_default",
  title: "Nouveau Projet MiniMax H3",
  step: 1,
  videoType: "pub_produit",
  videoGoal: "vendre",
  emotion: "Élégance, modernité et désir",
  aspectRatio: "16:9",
  duration: "10s",
  styleContract: {
    medium: "Macro studio commercial camera",
    texture: "flawless metallic sheen, razor-sharp focus, liquid refraction",
    palette: "gold, obsidian black, crisp silver accent",
    era: "modern premium luxury advertisement",
    visualRendering: "photorealistic studio lighting with raytraced reflections",
    condensedEnglishSentence:
      "Macro studio commercial camera, flawless metallic sheen with razor-sharp focus and liquid refraction, gold and obsidian black palette, modern premium luxury advertisement, photorealistic studio lighting with raytraced reflections.",
  },
  references: [],
  shots: [
    {
      id: "shot_1",
      shotNumber: 1,
      visualDescription:
        "Un flacon de parfum de luxe repose au centre d'un socle noir sous un spot de studio.",
      subjectAction: "Le flacon scintille doucement tandis qu'une vapeur s'élève.",
      atmosphere: "Éclairage studio feutré.",
    },
    {
      id: "shot_2",
      shotNumber: 2,
      timestamp: "00:05.000",
      visualDescription:
        "Gros plan sur le bouchon doré gravé alors qu'une goutte d'eau glisse délicatement.",
      subjectAction: "L'eau coule lentement le long de la surface en métal poli.",
      atmosphere: "Macro précision avec reflets dorés.",
    },
  ],
  cameraDirections: {
    shot_1: {
      shotId: "shot_1",
      framing: "medium",
      angle: "low_angle",
      motion: "tracking_forward",
      speed: "subtle",
    },
    shot_2: {
      shotId: "shot_2",
      framing: "close_up",
      angle: "eye_level",
      motion: "static",
      speed: "subtle",
    },
  },
  audioDesign: {
    isSilent: false,
    ambientSound: "Calme de studio avec souffle d'eau très discret",
    keySFX: "Goutte d'eau cristalline à 00:05.000",
    hasMusic: true,
    musicDescription: "Nappe synthétique profonde et raffinée",
    hasVoiceoverOrDialogue: false,
    voiceType: "none",
    spokenLanguage: "French",
    voiceTone: "",
  },
  onScreenText: {
    hasText: true,
    exactString: "PURE LUXURY",
    isExactFormat: true,
  },
  spokenDialogue: {
    hasDialogue: false,
    languageCode: "French",
    exactLines: "",
  },
  preservationRules: {
    elementsToPreserve: "Garder la forme du flacon et la gravure sur le bouchon.",
    mistakesToAvoid: "Pas de reflets flous ni de texte déformé.",
  },
  negativeConstraints: [
    { id: "neg_1", text: "no subtitles" },
    { id: "neg_2", text: "no soft dissolves" },
    { id: "neg_3", text: "no lens flares" },
    { id: "neg_4", text: "no extra people" },
  ],
};

import { PresetTemplate, ProjectData } from "../types/minimax";

export interface StylePreset {
  id: string;
  name: string;
  /** Short tagline shown next to the preset (e.g. "24 FPS — anamorphic film") */
  tagline: string;
  /** Frame rate cible (e.g. "24 FPS", "60 FPS", "12-24 FPS") */
  fps: string;
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
    id: "cinematic_film",
    name: "Cinématique / Film 35mm",
    tagline: "24 FPS — standard cinéma avec flou de mouvement naturel",
    fps: "24 FPS",
    medium: "35mm analog film shot on anamorphic lens",
    texture: "fine organic film grain, soft cinematic blooming highlights, natural motion blur",
    palette: "warm amber, deep teal, rich shadows, color graded",
    era: "contemporary high-end cinema",
    visualRendering:
      "ultra-photorealistic 8k movie render, 24fps cinematic motion blur, shallow depth of field",
    condensedEnglish:
      "Cinematic 35mm analog film shot on anamorphic lens, 24fps film motion blur, fine organic film grain with blooming highlights, warm amber and deep teal color graded palette, shallow depth of field, contemporary high-end cinema, ultra-photorealistic 8k movie render.",
    previewColor: "from-amber-600 to-cyan-900",
  },
  {
    id: "hyper_realistic_hd",
    name: "Hyper-Réaliste / Documentaire HD",
    tagline: "30-60 FPS — détail extrême caméra numérique ou sport/action",
    fps: "60 FPS",
    medium: "High-definition digital cinema camera (RED-style sensor)",
    texture: "ultra-detailed photorealistic textures, no stylization, no grain",
    palette: "natural lighting, true-to-life color science, neutral whites",
    era: "contemporary ultra-HD documentary / sports / action footage",
    visualRendering:
      "photorealistic 8k resolution, 60fps ultra-smooth movement, ultra-detailed textures, studio lighting",
    condensedEnglish:
      "Hyper-realistic digital cinema, 60fps ultra-smooth movement, 8k resolution, ultra-detailed photorealistic textures, shot on RED camera, studio lighting, natural true-to-life palette, contemporary ultra-HD documentary aesthetic.",
    previewColor: "from-slate-700 to-emerald-800",
  },
  {
    id: "3d_animation_pixar",
    name: "Animation 3D / Style Pixar",
    tagline: "24-60 FPS — animation 3D long-métrage ou rendu cinématique de jeu",
    fps: "24 FPS",
    medium: "3D computer animation, Pixar-style character render",
    texture: "soft subsurface scattering, stylized cartoon shading, smooth surfaces",
    palette: "vibrant saturated colors, expressive lighting, colorful shadows",
    era: "modern theatrical 3D animation",
    visualRendering:
      "ray-traced 3D render, 24fps cinematic animation, Pixar style, stylized characters, octane render quality",
    condensedEnglish:
      "3D animation Pixar style, 24fps cinematic render, soft subsurface scattering, stylized cartoon shading, vibrant saturated palette, expressive colorful lighting, ray tracing, modern theatrical 3D animation, Unreal Engine 5 quality.",
    previewColor: "from-sky-500 to-pink-500",
  },
  {
    id: "anime_manga",
    name: "Anime / Animation Japonaise",
    tagline: "12-24 FPS — animation traditionnelle « on twos » style Ghibli",
    fps: "12 FPS",
    medium: "2D hand-drawn anime, cel-shaded, manga-inspired lineart",
    texture: "crisp cell shading, painterly watercolor background, vivid expressive lineart",
    palette: "vibrant anime colors, expressive lighting, dramatic contrasts",
    era: "modern anime film aesthetic, Studio Ghibli inspired",
    visualRendering:
      "12fps hand-drawn animation on twos, 2D cel shading, Studio Ghibli aesthetic, vibrant anime colors",
    condensedEnglish:
      "Anime style 2D hand-drawn animation, 12fps on twos for traditional hand-drawn feel, Studio Ghibli aesthetic, crisp cel shading, vivid lineart, vibrant anime palette, painterly watercolor background, modern anime film aesthetic.",
    previewColor: "from-indigo-500 to-rose-400",
  },
  {
    id: "cyberpunk_retro",
    name: "Cyberpunk / Rétro-Futuriste",
    tagline: "24-30 FPS — dystopie néon, brume et reflets nocturnes",
    fps: "24 FPS",
    medium: "Digital cinema camera, neon-saturated grading",
    texture: "atmospheric fog, wet pavement glisten, chromatic aberration, light bloom",
    palette: "saturated neon magenta, electric cyan, deep dark blues, accent hot pink",
    era: "near-future dystopian retro-futurism",
    visualRendering:
      "24fps cinematic, synthwave aesthetic, neon lighting, dark rainy streets, glowing reflections",
    condensedEnglish:
      "Cyberpunk retro-futuriste, 24fps cinematic motion, neon-saturated lighting, dark rainy streets, atmospheric fog and wet pavement glisten, synthwave aesthetic, glowing reflections, futuristic city, deep dark blues with magenta and cyan accents.",
    previewColor: "from-fuchsia-600 to-cyan-500",
  },
  {
    id: "stop_motion_clay",
    name: "Stop-Motion / Claymation",
    tagline: "12 FPS — animation image par image, pâte à modeler ou papier découpé",
    fps: "12 FPS",
    medium: "Stop-motion frame-by-frame, claymation or paper-cutout puppets",
    texture: "handcrafted tactile feel, slight frame jitter, fingerprint textures",
    palette: "warm nostalgic colors, crafted lighting, handpainted backgrounds",
    era: "classic stop-motion animation, Aardman / Laika studio aesthetic",
    visualRendering:
      "12fps choppy frame rate, claymation style, handcrafted texture, tactile feel, frame-by-frame puppet animation",
    condensedEnglish:
      "Stop-motion animation, 12fps choppy frame rate, claymation style, handcrafted tactile texture, slight frame jitter, warm nostalgic palette, crafted lighting, handpainted backgrounds, puppet animation, Aardman / Laika studio aesthetic.",
    previewColor: "from-orange-500 to-amber-700",
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
  title: "",
  step: 1,
  videoType: "pub_produit",
  videoGoal: "vendre",
  emotion: "",
  aspectRatio: "16:9",
  duration: "10s",
  styleContract: {
    medium: "",
    texture: "",
    palette: "",
    era: "",
    visualRendering: "",
    condensedEnglishSentence: "",
  },
  references: [],
  shots: [],
  cameraDirections: {},
  audioDesign: {
    isSilent: true,
    ambientSound: "",
    keySFX: "",
    hasMusic: false,
    musicDescription: "",
    hasVoiceoverOrDialogue: false,
    voiceType: "none",
    spokenLanguage: "French",
    voiceTone: "",
  },
  onScreenText: { hasText: false, exactString: "", isExactFormat: true },
  spokenDialogue: { hasDialogue: false, languageCode: "French", exactLines: "" },
  preservationRules: { elementsToPreserve: "", mistakesToAvoid: "" },
  negativeConstraints: [
    { id: "neg_1", text: "no subtitles" },
    { id: "neg_2", text: "no soft dissolves" },
    { id: "neg_3", text: "no lens flares" },
  ],
};

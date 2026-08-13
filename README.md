# 🎬 Assistant Prompting MiniMax H3

> **PWA React/TypeScript** qui guide la création de prompts vidéo optimisés pour le modèle **MiniMax H3** (génération vidéo IA), avec validation en temps réel, export JSON et mode hors-ligne.

---

## ✨ À quoi ça sert ?

Cette application t'accompagne dans la conception d'un prompt MiniMax H3 qui respecte les **règles strictes du modèle** :

- **Style contract** (1 phrase anglaise condensée en tête)
- **Timeline & shots** (2-3 moments max sur 10s, timestamps croissants, Shot 1 sans timestamp)
- **1 seul mouvement caméra** par plan
- **Bloc audio obligatoire** (même en cas de silence)
- **Texte à l'écran** : syntaxe exacte `reading exactly: "TEXTE"`
- **Dialogue** : balise `<d>[Language] Text</d>`
- **Consignes de préservation** et **liste négative 3-6 items**

Tu traverses un **wizard 9 étapes** avec validation en temps réel (bandeau + auto-fix), prévisualisation live du prompt, et **3 vues** : prompt complet, version test 5s économique, vue structurée par blocs.

---

## 🚀 Démarrage rapide

### Pré-requis

- **Node.js ≥ 20** (testé sur 22)
- **npm ≥ 10** (le projet utilise npm, pas bun/yarn)

### Installation

```bash
npm install
```

### Lancer en développement

```bash
npm run dev
```

L'app s'ouvre sur **http://localhost:3000** (Vite + serveur Express intégré).

### Construire pour la production

```bash
npm run build      # produit dist/ (front) + dist/server.cjs (back)
npm start          # lance le serveur de prod sur le port 3000
```

### Tester

```bash
npm test           # lance la suite Vitest (55 tests, ~400ms)
npm run test:ui    # interface graphique (http://localhost:51204)
npm run test:watch # mode watch pendant le dev
```

### Linter

```bash
npm run lint       # tsc --noEmit (vérification de types stricte)
```

---

## 📦 Stack technique

| Couche | Techno |
|---|---|
| Front | React 19 + TypeScript 5.8 + Vite 6 |
| Styling | Tailwind v4 + Lucide icons + Motion |
| Backend | Express 4.21 + tsx (dev) + esbuild (build) |
| PWA | Service Worker custom + manifest.json |
| Tests | Vitest 4 + jsdom |
| Lockfile | package-lock.json (npm) |

---

## 🗂️ Structure du projet

```
.
├── server.ts                       # Express + intégration Vite middleware
├── public/
│   ├── sw.js                       # Service Worker (PWA offline)
│   ├── manifest.json               # PWA manifest
│   ├── pwa-icon-192.png
│   └── pwa-icon-512.png
├── src/
│   ├── App.tsx                     # Composant racine + wizard
│   ├── main.tsx                    # Entry point + registration SW
│   ├── types/
│   │   ├── minimax.ts              # ProjectData, Shot, CameraDirection…
│   │   ├── reference.ts
│   │   └── project.ts              # H3ProjectExport, MigrationSummary
│   ├── constants/presets.ts        # 5 styles + templates de projets
│   ├── utils/
│   │   ├── compiler.ts             # compile le prompt H3 final
│   │   ├── rulesEngine.ts          # validation des règles H3
│   │   ├── schemaValidator.ts      # import JSON
│   │   ├── schemaMigrations.ts     # migrations de schéma (v0 → v1)
│   │   ├── jsonHandler.ts          # export JSON
│   │   ├── translator.ts           # traductions cinématiques FR→EN
│   │   ├── __fixtures__/           # fixtures de tests
│   │   ├── compiler.test.ts        # tests compilateur
│   │   ├── rulesEngine.test.ts     # tests validation
│   │   ├── schemaValidator.test.ts # tests import
│   │   └── jsonHandler.test.ts     # tests export
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── WizardProgress.tsx
│   │   ├── ValidationBanner.tsx
│   │   ├── PreFlightChecklist.tsx
│   │   ├── LivePromptPreview.tsx
│   │   ├── ImportProjectModal.tsx
│   │   ├── PwaInstallBanner.tsx
│   │   ├── ExportProjectButton.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ProjectSummary.tsx
│   │   └── steps/
│   │       ├── Step1Objective.tsx
│   │       ├── Step2StyleContract.tsx
│   │       ├── Step3References.tsx
│   │       ├── Step4Timeline.tsx
│   │       ├── Step5Camera.tsx
│   │       ├── Step6Audio.tsx
│   │       ├── Step7TextDialogue.tsx
│   │       ├── Step8Constraints.tsx
│   │       └── Step9Generation.tsx
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## 📐 Format d'export JSON (schéma v1.0.0)

Le bouton **Sauvegarder JSON** (étape 9) télécharge un fichier `minimax-h3-<slug>-YYYY-MM-DD-HHmm.json` avec cette structure :

```json
{
  "schemaVersion": "1.0.0",
  "appName": "MiniMax H3 Assistant",
  "appVersion": "1.0.0",
  "exportedAt": "2026-08-13T07:30:00.000Z",
  "projectId": "proj_1234567890",
  "projectName": "Publicité Parfum Luxe",
  "lastModifiedAt": "2026-08-13T07:30:00.000Z",
  "compatibility": {
    "minAppVersion": "1.0.0",
    "exportedWith": "1.0.0",
    "migrationRequired": false
  },
  "project": { /* ProjectData complet */ },
  "extendedReferences": [
    {
      "id": "ref1",
      "role": "produit",
      "label": "Bottle hero",
      "sourceType": "image",
      "fileName": "bottle_hero.jpg",
      "mediaAvailable": true,
      "preserve": ["Conserver le bouchon doré", "Garder la forme du flacon"],
      "notes": "Forme octogonale",
      "url": "https://...",
      "previewUrl": "https://...",
      "definesText": "Forme octogonale et bouchon doré",
      "preserveText": "Conserver le logo gravé intact"
    }
  ]
}
```

### Import / Migration

L'import d'un ancien fichier (sans `schemaVersion`) déclenche automatiquement la **migration v0.x → v1.0.0** avec un rapport affiché dans la modale de prévisualisation. Le projet est validé, son score H3 est recalculé, et les médias manquants (URLs `blob:`, `file:`, locales) sont signalés.

---

## 🎯 Règles MiniMax H3 appliquées

| Règle | Validation | Auto-fix |
|---|---|---|
| ≤3 plans pour 10s, ≤2 pour 5-6s | ✅ Warning | Tronque aux N premiers |
| Shot 1 sans timestamp | ✅ Info | Supprime le timestamp |
| Timestamps explicites pour Shot 2+ | ✅ Warning | Génère `00:0N.000` |
| 1 seul mouvement caméra par plan | ✅ Error | Supprime le mouvement secondaire |
| Bloc audio obligatoire | ✅ Error | Bascule en mode silencieux |
| Rôle assigné à chaque référence | ✅ Error | (manuel) |
| Consignes de préservation si références | ✅ Warning | Ajoute un texte par défaut |
| Texte cité mot pour mot (pas décrit) | ✅ Warning | Nettoie les descriptions |
| 3-6 contraintes négatives | ✅ Info/Warning | Ajoute ou tronque |

Le **score de conformité H3** (0-100) est recalculé en temps réel et pénalisé par chaque violation (-20 erreur, -8 warning, -3 info).

---

## 📲 Installation comme PWA

L'application supporte l'installation comme PWA :

- **Chrome / Edge (desktop)** : icône "Installer" dans la barre d'adresse
- **Safari (iOS)** : bouton "Partager" → "Sur l'écran d'accueil"
- **Safari (macOS)** : menu "Fichier" → "Ajouter au Dock"

Une fois installée, l'app fonctionne **hors-ligne** grâce au service worker (`public/sw.js`) qui pré-cache le shell de l'app.

---

## 💾 Sauvegarde automatique (localStorage)

Le projet en cours est **autosauvegardé** dans le `localStorage` du navigateur à chaque modification (debounce 500 ms). Tu vois un indicateur discret dans la barre de navigation :

- ✅ **« Sauvegardé »** (vert, 1.5 s) — juste après une sauvegarde
- ☁️ **« il y a 2 min »** (gris) — dernier enregistrement
- ⚠️ **« Pas de sauvegarde auto »** (ambre) — si localStorage est indisponible (mode privé)

La sauvegarde se déclenche automatiquement à chaque champ modifié. Tu peux aussi continuer à utiliser les boutons **Sauvegarder JSON** / **Importer JSON** pour des exports explicites et portables.

> Note : la persistance locale est liée à un seul navigateur/profil. Pour transporter un projet entre machines, utilise l'export JSON.

---

## ⚙️ Configuration

Aucun fichier `.env` n'est requis pour utiliser l'app. Le serveur Express reste fonctionnel en mode dégradé si `GEMINI_API_KEY` n'est pas défini (le prompt est compilé localement). Voir `.env.example` pour les variables optionnelles.

---

## 🤝 Contribution

- **Tests** : ajouter un test dans le fichier `.test.ts` approprié sous `src/utils/`. La suite tourne via `npm test`.
- **Nouvelle règle H3** : ajouter la validation dans `src/utils/rulesEngine.ts` + un test dans `rulesEngine.test.ts`.
- **Nouveau bloc de prompt** : étendre `compileBlockStructured` dans `src/utils/compiler.ts` et exposer le bloc dans `compileMiniMaxH3Prompt`.

---

## 📄 Licence

Usage interne — MiniMax H3 Assistant.

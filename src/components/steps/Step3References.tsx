import React from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { ProjectData, ReferenceItem, ReferenceRole } from "../../types/minimax";
import { WizardContextBox } from "../WizardContextBox";

interface Step3ReferencesProps {
  project: ProjectData;
  onChange: (references: ReferenceItem[]) => void;
}

const ROLES: { id: ReferenceRole; label: string; example: string }[] = [
  { id: "produit", label: "Produit (ex: Flacon, Objet)", example: "Forme exacte, couleur, matériau, étiquette" },
  { id: "personnage", label: "Personnage / Acteur", example: "Visage, coiffure, style vestimentaire" },
  { id: "ambiance", label: "Ambiance / Lumière", example: "Éclairage feutré, brume, ambiance colorée" },
  { id: "decor", label: "Décor / Arrière-plan", example: "Plateau, surface, arrière-plan visuel" },
  { id: "logo", label: "Logo / Marque", example: "Gravure, typographie, emplacement" },
  { id: "style", label: "Style Graphique", example: "Texture du grain, palette dominante" },
  { id: "autre", label: "Autre Référence", example: "Élément spécifique à préserver" },
];

export const Step3References: React.FC<Step3ReferencesProps> = ({
  project,
  onChange,
}) => {
  const addReference = () => {
    const newRef: ReferenceItem = {
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `Référence ${project.references.length + 1}`,
      role: "produit",
      definesText: "",
      preserveText: "",
    };
    onChange([...project.references, newRef]);
  };

  const updateReference = (id: string, updated: Partial<ReferenceItem>) => {
    onChange(project.references.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  };

  const removeReference = (id: string) => {
    onChange(project.references.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <WizardContextBox
        icon={ImageIcon}
        title="Étape 3 — Références Visuelles (description textuelle)"
        description={
          <>
            Décris les <strong>éléments visuels</strong> que le modèle doit prendre en compte
            (produit, personnage, décor, ambiance…). Ces descriptions seront injectées dans le bloc
            <code className="text-amber-300 mx-1">[PRESERVATION &amp; REFERENCES]</code> du prompt
            final, à côté de tes pièces jointes que tu transmettras directement à l'IA.
          </>
        }
      />

      {/* Helper banner */}
      <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-xl flex items-start space-x-2.5 text-xs text-blue-200">
        <Lightbulb className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
        <p className="leading-relaxed">
          <strong>Tu n'as pas besoin d'attacher de fichier ici.</strong> L'app est un constructeur de
          prompt : tu décris en texte ce que tu veux, et tu transmettras toi-même les images/vidéos à
          l'IA en parallèle (dans l'interface MiniMax H3). Cette étape sert à <em>dire au modèle</em>{" "}
          quoi préserver et quel style viser.
        </p>
      </div>

      {/* Reference List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {project.references.length} Référence(s) textuelle(s)
          </h4>
          <button
            type="button"
            onClick={addReference}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Référence</span>
          </button>
        </div>

        {project.references.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 border border-dashed border-slate-800 rounded-2xl">
            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              Aucune référence textuelle pour le moment.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Si tu n'as pas d'élément visuel spécifique à décrire, tu peux passer à l'étape suivante.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {project.references.map((ref, idx) => {
              const hasNoRole = !ref.role;
              return (
                <div
                  key={ref.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    hasNoRole
                      ? "bg-rose-950/20 border-rose-800/80 ring-1 ring-rose-500/50"
                      : "bg-slate-950 border-slate-800"
                  }`}
                >
                  {/* Header: index + name + delete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20 shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => updateReference(ref.id, { name: e.target.value })}
                        placeholder="Nom de la référence (ex: Flacon principal)"
                        className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeReference(ref.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition shrink-0"
                      title="Supprimer cette référence"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mandatory Role Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>
                        Rôle <span className="text-rose-400">*</span>
                      </span>
                      {hasNoRole && (
                        <span className="text-[10px] text-rose-400 font-bold flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Rôle requis !</span>
                        </span>
                      )}
                    </label>

                    <select
                      value={ref.role}
                      onChange={(e) =>
                        updateReference(ref.id, { role: e.target.value as ReferenceRole })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition"
                    >
                      {ROLES.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 italic">
                      {ROLES.find((r) => r.id === ref.role)?.example}
                    </p>
                  </div>

                  {/* Field: What it defines */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Ce que cette référence définit
                    </label>
                    <input
                      type="text"
                      value={ref.definesText}
                      onChange={(e) => updateReference(ref.id, { definesText: e.target.value })}
                      placeholder="Ex: Flacon facetté sombre avec bouchon doré gravé du logo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Field: What to preserve */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-amber-400/90">
                      À préserver à l'identique
                    </label>
                    <input
                      type="text"
                      value={ref.preserveText}
                      onChange={(e) => updateReference(ref.id, { preserveText: e.target.value })}
                      placeholder="Ex: Ne pas déformer la silhouette du flacon ni effacer le logo gravé"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

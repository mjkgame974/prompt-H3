import React from "react";
import { Image as ImageIcon, Plus, Trash2, AlertCircle, ShieldCheck } from "lucide-react";
import { ProjectData, ReferenceItem, ReferenceRole } from "../../types/minimax";

interface Step3ReferencesProps {
  project: ProjectData;
  onChange: (references: ReferenceItem[]) => void;
}

const ROLES: { id: ReferenceRole; label: string; example: string }[] = [
  { id: "produit", label: "Produit (ex: Flacon, Objet)", example: "Définit la forme exacte du flacon" },
  { id: "personnage", label: "Personnage / Acteur", example: "Définit le visage et les cheveux du sujet" },
  { id: "ambiance", label: "Ambiance / Lumière", example: "Définit l'éclairage feutré et la brume" },
  { id: "decor", label: "Décor / Arrière-plan", example: "Définit le plateau en obsidienne noire" },
  { id: "logo", label: "Logo / Marque", example: "Définit la gravure du nom de la marque" },
  { id: "style", label: "Style Graphique", example: "Définit la texture du grain et la palette" },
  { id: "autre", label: "Autre Référence", example: "Élément spécifique" },
];

export const Step3References: React.FC<Step3ReferencesProps> = ({
  project,
  onChange,
}) => {
  const addReference = () => {
    const newRef: ReferenceItem = {
      id: `ref_${Date.now()}`,
      name: `Référence ${project.references.length + 1}`,
      role: "produit",
      definesText: "Description de ce que montre cette image...",
      preserveText: "Conserver cet élément exactement intact...",
    };
    onChange([...project.references, newRef]);
  };

  const updateReference = (id: string, updated: Partial<ReferenceItem>) => {
    const newList = project.references.map((r) =>
      r.id === id ? { ...r, ...updated } : r
    );
    onChange(newList);
  };

  const removeReference = (id: string) => {
    onChange(project.references.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">
              Étape 3 — Références Visuelles & Rôles Objets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Toute image ou vidéo transmise à MiniMax H3 <strong>doit posséder un rôle obligatoire</strong>. Indiquez précisément ce que chaque image définit et ce qu'il faut préserver à l'identique.
            </p>
          </div>
        </div>
      </div>

      {/* Reference List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {project.references.length} Image(s) / Vidéo(s) de Référence
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
              Aucune image de référence ajoutée pour le moment.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Si vous n'utilisez pas d'images d'entrée, vous pouvez passer à l'étape suivante.
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => updateReference(ref.id, { name: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeReference(ref.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mandatory Role Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>
                        Rôle Obligatoire <span className="text-rose-400">*</span>
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
                  </div>

                  {/* Field 1: What it defines */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Ce que montre cette référence (Visual Details)
                    </label>
                    <input
                      type="text"
                      value={ref.definesText}
                      onChange={(e) => updateReference(ref.id, { definesText: e.target.value })}
                      placeholder="Ex: Flacon facetté sombre avec bouchon doré"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Field 2: What to preserve */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-amber-400/90">
                      Éléments à préserver exactement (Preservation Constraint)
                    </label>
                    <input
                      type="text"
                      value={ref.preserveText}
                      onChange={(e) => updateReference(ref.id, { preserveText: e.target.value })}
                      placeholder="Ex: Ne pas déformer la silhouette ni effacer le logo"
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

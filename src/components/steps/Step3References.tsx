import React, { useRef, useState } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  X,
  Video as VideoIcon,
  AlertTriangle,
} from "lucide-react";
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

// Local-storage-friendly size caps. Above these, autosave to localStorage will
// start failing (5 MB per-origin quota). The user can still export as JSON.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5 MB

const ACCEPTED_MIME = "image/*,video/mp4,video/webm,video/quicktime";

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/i.test(url) || url.startsWith("data:video");
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|$)/i.test(url) || url.startsWith("data:image");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const Step3References: React.FC<Step3ReferencesProps> = ({
  project,
  onChange,
}) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const addReference = () => {
    const newRef: ReferenceItem = {
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `Référence ${project.references.length + 1}`,
      role: "produit",
      definesText: "Description de ce que montre cette image...",
      preserveText: "Conserver cet élément exactement intact...",
    };
    onChange([...project.references, newRef]);
  };

  const updateReference = (id: string, updated: Partial<ReferenceItem>) => {
    onChange(project.references.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  };

  const removeReference = (id: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onChange(project.references.filter((r) => r.id !== id));
  };

  const handleFileSelected = (refId: string, file: File | undefined) => {
    if (!file) return;

    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    const kind = isVideo ? "vidéo" : "image";

    if (!isImage && !isVideo) {
      setErrors((prev) => ({ ...prev, [refId]: `Type de fichier non supporté. Choisis une image ou une ${kind}.` }));
      return;
    }

    if (file.size > limit) {
      setErrors((prev) => ({
        ...prev,
        [refId]: `${kind} trop lourde (${formatBytes(file.size)}). Maximum : ${formatBytes(limit)}. Réduis la taille ou utilise une URL distante.`,
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, [refId]: null }));

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setErrors((prev) => ({ ...prev, [refId]: "Impossible de lire le fichier." }));
        return;
      }
      updateReference(refId, {
        url: dataUrl,
        previewUrl: dataUrl,
        // Auto-name from filename if the user hasn't customized it
        name: project.references.find((r) => r.id === refId)?.name?.startsWith("Référence ")
          ? file.name.replace(/\.[^.]+$/, "")
          : project.references.find((r) => r.id === refId)?.name ?? file.name,
      });
    };
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, [refId]: "Erreur de lecture du fichier." }));
    };
    reader.readAsDataURL(file);

    // Reset the file input so the user can re-upload the same file if needed
    const input = fileInputRefs.current[refId];
    if (input) input.value = "";
  };

  const handleClearMedia = (refId: string) => {
    updateReference(refId, { url: undefined, previewUrl: undefined });
    setErrors((prev) => ({ ...prev, [refId]: null }));
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
              Toute image ou vidéo transmise à MiniMax H3 <strong>doit posséder un rôle obligatoire</strong>.
              Uploade un fichier depuis ton appareil ou colle une URL distante, puis indique le rôle et ce qu'il faut préserver.
            </p>
          </div>
        </div>
      </div>

      {/* Reference List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {project.references.length} Référence(s) — Image ou Vidéo
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
              Aucune référence ajoutée pour le moment.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Si tu n'utilises pas d'images/vidéos d'entrée, tu peux passer à l'étape suivante.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {project.references.map((ref, idx) => {
              const hasNoRole = !ref.role;
              const err = errors[ref.id];
              const hasMedia = Boolean(ref.url);
              const isVideo = hasMedia && isVideoUrl(ref.url ?? "");
              const isImage = hasMedia && isImageUrl(ref.url ?? "");

              return (
                <div
                  key={ref.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    hasNoRole
                      ? "bg-rose-950/20 border-rose-800/80 ring-1 ring-rose-500/50"
                      : "bg-slate-950 border-slate-800"
                  }`}
                >
                  {/* Header row: number + name + delete */}
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
                      title="Supprimer cette référence"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Media preview + file/URL upload */}
                  <div className="space-y-2">
                    {hasMedia ? (
                      <div className="relative group">
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                          {isImage ? (
                            <img
                              src={ref.previewUrl || ref.url}
                              alt={ref.name}
                              className="w-full max-h-56 object-contain"
                            />
                          ) : isVideo ? (
                            <video
                              src={ref.url}
                              controls
                              className="w-full max-h-56"
                            />
                          ) : (
                            <div className="p-4 text-xs text-slate-400 flex items-center space-x-2">
                              <LinkIcon className="w-4 h-4" />
                              <span className="truncate">{ref.url}</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleClearMedia(ref.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-rose-500/80 text-slate-200 transition"
                          title="Retirer le média"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-2 left-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] text-slate-300 font-mono">
                          {isVideo ? (
                            <>
                              <VideoIcon className="w-3 h-3" />
                              <span>Vidéo</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-3 h-3" />
                              <span>Image</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-xl">
                        <ImageIcon className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                        <p className="text-[11px] text-slate-500">
                          Aucun média attaché. Uploade une image ou une vidéo, ou colle une URL.
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={(el) => {
                          fileInputRefs.current[ref.id] = el;
                        }}
                        type="file"
                        accept={ACCEPTED_MIME}
                        onChange={(e) => handleFileSelected(ref.id, e.target.files?.[0])}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[ref.id]?.click()}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>{hasMedia ? "Remplacer" : "Uploader"} un fichier</span>
                      </button>

                      <div className="flex-1 flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <input
                          type="url"
                          value={ref.url && !isImageUrl(ref.url) && !isVideoUrl(ref.url) ? ref.url : ""}
                          onChange={(e) => {
                            const url = e.target.value.trim();
                            updateReference(ref.id, {
                              url: url || undefined,
                              previewUrl: url || undefined,
                            });
                            setErrors((prev) => ({ ...prev, [ref.id]: null }));
                          }}
                          placeholder="…ou colle une URL (https://… ou data:image/…)"
                          className="flex-1 min-w-0 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {err && (
                      <div className="flex items-start space-x-1.5 text-[11px] text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-lg px-2.5 py-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    )}
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
                    <p className="text-[10px] text-slate-500 italic">
                      {ROLES.find((r) => r.id === ref.role)?.example}
                    </p>
                  </div>

                  {/* Field: What it defines */}
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

                  {/* Field: What to preserve */}
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

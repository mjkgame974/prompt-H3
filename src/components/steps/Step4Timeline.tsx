import React from "react";
import { Clock, Plus, Trash2, AlertTriangle, Sparkles } from "lucide-react";
import { ProjectData, Shot } from "../../types/minimax";

interface Step4TimelineProps {
  project: ProjectData;
  onChange: (shots: Shot[]) => void;
}

export const Step4Timeline: React.FC<Step4TimelineProps> = ({
  project,
  onChange,
}) => {
  const addShot = () => {
    const shotNum = project.shots.length + 1;
    const defaultTime = `00:0${(shotNum * 3.5).toFixed(0)}.000`;

    const newShot: Shot = {
      id: `shot_${Date.now()}`,
      shotNumber: shotNum,
      timestamp: shotNum > 1 ? defaultTime : undefined,
      visualDescription: `Description du Plan ${shotNum}...`,
      subjectAction: "Action du sujet ou mouvement principal...",
      atmosphere: "Ambiance et éclairage spécifique...",
    };

    onChange([...project.shots, newShot]);
  };

  const updateShot = (id: string, updated: Partial<Shot>) => {
    const newList = project.shots.map((s) =>
      s.id === id ? { ...s, ...updated } : s
    );
    onChange(newList);
  };

  const removeShot = (id: string) => {
    const filtered = project.shots.filter((s) => s.id !== id);
    // Renumber shots
    const renumbered = filtered.map((s, idx) => ({
      ...s,
      shotNumber: idx + 1,
      timestamp: idx === 0 ? undefined : s.timestamp || `00:0${(idx * 4).toFixed(0)}.000`,
    }));
    onChange(renumbered);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Context Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">
              Étape 4 — Timeline & Séquence des Plans (Règle 2-3 Moments)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Pour 10 secondes de vidéo, <strong>limitez à 2 ou 3 plans au maximum</strong>. Le premier plan [Shot 1] n'est pas horodaté. Les plans suivants reçoivent un horodatage strictement croissant au format <code className="text-amber-300">At 00:0X.000</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Shot Count Warning if > 3 */}
      {project.shots.length > 3 && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Recommandation H3 :</strong> Vous avez créé {project.shots.length} plans. Sur 10s, réduisez idéalement à 3 plans pour un rendu plus fluide.
          </span>
        </div>
      )}

      {/* Shots List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Séquence des Plans ({project.shots.length} Plan(s))
          </h4>
          <button
            type="button"
            onClick={addShot}
            disabled={project.shots.length >= 5}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Plan</span>
          </button>
        </div>

        {project.shots.map((shot, idx) => {
          const isFirstShot = idx === 0;

          return (
            <div
              key={shot.id}
              className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                    P{shot.shotNumber}
                  </span>
                  <div>
                    <h5 className="font-bold text-xs text-slate-200">
                      [Shot {shot.shotNumber}]
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      {isFirstShot
                        ? "Début à 00:00.000 (Implicite sans horodatage)"
                        : "Plan horodaté séquentiel"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Timestamp Input for Shot 2+ */}
                  {!isFirstShot && (
                    <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                      <span className="text-[10px] font-bold text-amber-400">At</span>
                      <input
                        type="text"
                        value={shot.timestamp || "00:04.000"}
                        onChange={(e) => updateShot(shot.id, { timestamp: e.target.value })}
                        placeholder="00:04.000"
                        className="w-20 bg-transparent text-slate-100 font-mono text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {project.shots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeShot(shot.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description inputs */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Ce qu'on voit à l'écran (Visual Details)
                  </label>
                  <textarea
                    rows={2}
                    value={shot.visualDescription}
                    onChange={(e) => updateShot(shot.id, { visualDescription: e.target.value })}
                    placeholder="Ex: Un flacon de parfum de luxe reposant au centre d'une surface noire mouillée..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Action du sujet (Subject Motion)
                    </label>
                    <input
                      type="text"
                      value={shot.subjectAction}
                      onChange={(e) => updateShot(shot.id, { subjectAction: e.target.value })}
                      placeholder="Ex: Le bouchon tourne doucement sous la lumière..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Ambiance visuelle (Lighting & Fog)
                    </label>
                    <input
                      type="text"
                      value={shot.atmosphere}
                      onChange={(e) => updateShot(shot.id, { atmosphere: e.target.value })}
                      placeholder="Ex: Éclairage studio avec brume délicate..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

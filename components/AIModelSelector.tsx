"use client";

import { CELESTIA_AI_MODELS, CelestiaAIModelId } from "@/lib/ai/modelCatalog";

interface AIModelSelectorProps {
  value: CelestiaAIModelId;
  onChange: (value: CelestiaAIModelId) => void;
}

export function AIModelSelector({ value, onChange }: AIModelSelectorProps) {
  const selected = CELESTIA_AI_MODELS.find((model) => model.id === value) ?? CELESTIA_AI_MODELS[0];

  return (
    <section className="rounded-xl border border-amber-500/30 bg-slate-950/90 p-4 space-y-3" aria-label="AI model selection">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Choose your AI model</h3>
          <p className="text-xs text-slate-400">Choose a model by its tested role and description. This selection is used for Oracle and Blueprint requests.</p>
        </div>
        <span className="text-[10px] rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300 w-fit">APInex free catalogue</span>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-300">Model</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as CelestiaAIModelId)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none focus:border-amber-500"
        >
          {CELESTIA_AI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} — {model.role} ({model.quotaWeight})
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm text-amber-300">{selected.name}</strong>
          <span className="text-[10px] text-slate-300 rounded border border-slate-700 px-1.5 py-0.5">{selected.role}</span>
          <span className="text-[10px] text-slate-400">Quota weight {selected.quotaWeight}</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{selected.description}</p>
        <p className="text-[10px] text-slate-500">Quota weight is a usage multiplier, not a cash price. If APInex is unavailable, configured fallback providers may use their own default model instead.</p>
      </div>
    </section>
  );
}

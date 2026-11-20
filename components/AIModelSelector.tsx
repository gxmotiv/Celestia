"use client";

import { useEffect, useState } from "react";
import {
  CELESTIA_AI_MODELS,
  CelestiaAIModelId,
  CelestiaAIProviderId,
} from "@/lib/ai/modelCatalog";

interface AIModelSelectorProps {
  value: CelestiaAIModelId;
  onChange: (value: CelestiaAIModelId) => void;
}

const PROVIDERS: CelestiaAIProviderId[] = ["apinex", "freemodel", "nararouter", "openrouter"];
const PROVIDER_LABELS: Record<CelestiaAIProviderId, string> = {
  apinex: "APInex",
  freemodel: "FreeModel",
  nararouter: "NaraRouter",
  openrouter: "OpenRouter",
};

type ProviderConfiguration = Partial<Record<CelestiaAIProviderId, boolean>>;

export function AIModelSelector({ value, onChange }: AIModelSelectorProps) {
  const selected = CELESTIA_AI_MODELS.find((model) => model.id === value) ?? CELESTIA_AI_MODELS[0];
  const [providerConfiguration, setProviderConfiguration] = useState<ProviderConfiguration | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/astrology/ai-providers", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Provider status unavailable");
        return response.json();
      })
      .then((data: { providers?: ProviderConfiguration }) => {
        if (active && data.providers) setProviderConfiguration(data.providers);
      })
      .catch(() => {
        if (active) setProviderConfiguration(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedProviderConfigured = providerConfiguration?.[selected.providerId];
  const selectedStatus = selectedProviderConfigured === true
    ? "Server key configured"
    : selectedProviderConfigured === false
      ? `Missing server secret: ${selected.secretName}`
      : `Requires server secret: ${selected.secretName}`;

  return (
    <section className="rounded-xl border border-amber-500/30 bg-slate-950/90 p-4 space-y-3" aria-label="AI provider and model selection">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Choose AI provider and model</h3>
          <p className="text-xs text-slate-400">Choose the provider and model for Oracle and Blueprint. Celestia sends the request only to the provider you select.</p>
        </div>
        <span className="text-[10px] rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300 w-fit">Free API options</span>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-300">Provider / model</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as CelestiaAIModelId)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none focus:border-amber-500"
        >
          {PROVIDERS.map((providerId) => {
            const providerModels = CELESTIA_AI_MODELS.filter((model) => model.providerId === providerId);
            if (providerModels.length === 0) return null;
            const configured = providerConfiguration?.[providerId];
            const suffix = configured === true ? " · key ready" : configured === false ? " · key required" : "";
            return (
              <optgroup key={providerId} label={PROVIDER_LABELS[providerId] + suffix}>
                {providerModels.map((model) => (
                  <option key={model.id} value={model.id} disabled={configured === false}>
                    {model.name} — {model.role}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </label>

      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm text-amber-300">{selected.providerName} · {selected.name}</strong>
          <span className="text-[10px] text-slate-300 rounded border border-slate-700 px-1.5 py-0.5">{selected.role}</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{selected.description}</p>
        <p className="text-[10px] leading-relaxed text-slate-400">{selected.quotaNote}</p>
        <p className={`text-[10px] ${selectedProviderConfigured === true ? "text-emerald-300" : "text-amber-300"}`}>
          {selectedStatus}
        </p>
        <p className="text-[10px] text-slate-500">Provider credentials stay on the server. Missing keys are never requested in the browser or sent back to the page. Free quotas and model availability can change; Celestia does not fall back to a paid model for an explicit selection.</p>
      </div>
    </section>
  );
}

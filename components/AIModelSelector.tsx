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
  privacyRiskAcknowledged: boolean;
  onPrivacyRiskAcknowledgedChange: (value: boolean) => void;
}

interface LivePollinationsModel {
  id: string;
  name: string;
  description: string;
  inputPrice: number;
  outputPrice: number;
  health: string;
  privacyRisk?: boolean;
  community?: boolean;
  publisher?: string;
  healthSuccessRate?: number | null;
  healthRequests?: number;
  contextLength?: number | null;
  reasoning?: boolean;
  tools?: boolean;
}

const PROVIDERS: CelestiaAIProviderId[] = ["pollinations", "freemodel", "nararouter", "openrouter"];
const PROVIDER_LABELS: Record<CelestiaAIProviderId, string> = {
  pollinations: "Pollinations — zero-priced official + community",
  freemodel: "FreeModel",
  nararouter: "NaraRouter",
  openrouter: "OpenRouter",
};

type ProviderConfiguration = Partial<Record<CelestiaAIProviderId, boolean>>;

export function AIModelSelector({ value, onChange, privacyRiskAcknowledged, onPrivacyRiskAcknowledgedChange }: AIModelSelectorProps) {
  const [providerConfiguration, setProviderConfiguration] = useState<ProviderConfiguration | null>(null);
  const [pollinationsModels, setPollinationsModels] = useState<LivePollinationsModel[]>([]);
  const [manualOnlyModels, setManualOnlyModels] = useState<LivePollinationsModel[]>([]);
  const [catalogueError, setCatalogueError] = useState("");
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);

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

    fetch("/api/astrology/pollinations-models", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Pollinations catalogue unavailable");
        return data as { models?: LivePollinationsModel[]; manualOnlyModels?: LivePollinationsModel[] };
      })
      .then((data) => {
        if (active) {
          setPollinationsModels(Array.isArray(data.models) ? data.models : []);
          setManualOnlyModels(Array.isArray(data.manualOnlyModels) ? data.manualOnlyModels : []);
          setCatalogueError("");
          setCatalogueLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setCatalogueError(error instanceof Error ? error.message : "Pollinations catalogue unavailable");
          setCatalogueLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const isKnownStatic = CELESTIA_AI_MODELS.some((model) => model.id === value);
    const isKnownLive = value.startsWith("pollinations:") &&
      (value === "pollinations:auto-free" || [...pollinationsModels, ...manualOnlyModels].some((model) => `pollinations:${model.id}` === value));
    if (!isKnownStatic && !isKnownLive) onChange("pollinations:auto-free");
  }, [value, pollinationsModels, manualOnlyModels, onChange]);

  const staticSelected = CELESTIA_AI_MODELS.find((model) => model.id === value) ?? CELESTIA_AI_MODELS[0];
  const liveSelected = value.startsWith("pollinations:")
    ? [...pollinationsModels, ...manualOnlyModels].find((model) => `pollinations:${model.id}` === value)
    : undefined;
  const selectedProviderId = value.startsWith("pollinations:") ? "pollinations" : staticSelected.providerId;
  const selectedName = liveSelected?.name ?? staticSelected.name;
  const selectedDescription = liveSelected?.description ?? staticSelected.description;
  const selectedQuota = liveSelected
    ? `Published input price: 0 · output price: 0 · ${liveSelected.community ? `community publisher: ${liveSelected.publisher ?? "unknown"}` : "official source"} · healthy status`
    : staticSelected.quotaNote;
  const selectedProviderConfigured = providerConfiguration?.[selectedProviderId];
  const selectedSecret = selectedProviderId === "pollinations" ? "POLLINATIONS_API_KEY" : staticSelected.secretName;
  const selectedStatus = selectedProviderConfigured === true
    ? "Server key configured"
    : selectedProviderConfigured === false
      ? `Missing server secret: ${selectedSecret}`
      : `Requires server secret: ${selectedSecret}`;

  return (
    <section className="rounded-xl border border-amber-500/30 bg-slate-950/90 p-4 space-y-3" aria-label="AI provider and model selection">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Choose AI provider and model</h3>
          <p className="text-xs text-slate-400">Choose the provider and model for Oracle and Blueprint. Explicit selections are sent only to that provider.</p>
        </div>
        <span className="text-[10px] rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300 w-fit">Zero-priced models only</span>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-300">Provider / model</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none focus:border-amber-500"
        >
          {PROVIDERS.map((providerId) => {
            const configured = providerConfiguration?.[providerId];
            const suffix = configured === true ? " · key ready" : configured === false ? " · key required" : "";
            if (providerId === "pollinations") {
              return (
                <optgroup key={providerId} label={PROVIDER_LABELS[providerId] + suffix}>
                  <option value="pollinations:auto-free" disabled={configured === false || (catalogueLoaded && pollinationsModels.length === 0)}>
                    Automatic — best available eligible free model
                  </option>
                  {pollinationsModels.map((model) => (
                    <option key={model.id} value={`pollinations:${model.id}`} disabled={configured === false}>
                      {model.name} — $0 input / $0 output
                    </option>
                  ))}
                  {manualOnlyModels.map((model) => (
                    <option key={model.id} value={`pollinations:${model.id}`} disabled={configured === false}>
                      {model.name} — {model.community ? "community · manual opt-in" : "privacy warning · manual opt-in"}
                    </option>
                  ))}
                </optgroup>
              );
            }
            const providerModels = CELESTIA_AI_MODELS.filter((model) => model.providerId === providerId);
            if (providerModels.length === 0) return null;
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

      {catalogueError ? <p className="text-xs text-amber-300">{catalogueError}</p> : null}
      {catalogueLoaded && !catalogueError && pollinationsModels.length === 0 ? (
        <p className="text-xs text-amber-300">
          No official privacy-safe model is currently available for automatic selection. Manual-only community models and models with explicit data-handling warnings may still appear in the selector.
        </p>
      ) : null}
      {liveSelected && (liveSelected.privacyRisk || liveSelected.community) ? (
        <label className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-100">
          <input
            type="checkbox"
            checked={privacyRiskAcknowledged}
            onChange={(event) => onPrivacyRiskAcknowledgedChange(event.target.checked)}
            className="mt-0.5 accent-amber-500"
          />
          <span>
            <strong className="block mb-1">Manual provider-risk acknowledgement required</strong>
            {liveSelected?.community ? `This model is published by ${liveSelected.publisher || "a community publisher"} and runs on independent provider infrastructure. Pollinations says community providers control their own storage, sharing, security, and training practices; it does not verify them. ` : "This model's provider warns that prompts and replies may be retained and used for training, and zero-data-retention is unavailable. "}
            Celestia sends the current birth details, chart data, and question to this provider. I understand and explicitly consent to using this model for this reading. I will not send confidential information.
          </span>
        </label>
      ) : null}
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm text-amber-300">{selectedProviderId === "pollinations" ? "Pollinations" : staticSelected.providerName} · {selectedName}</strong>
          <span className="text-[10px] text-slate-300 rounded border border-slate-700 px-1.5 py-0.5">{liveSelected ? "Live catalogue model" : staticSelected.role}</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{selectedDescription}</p>
        <p className="text-[10px] leading-relaxed text-slate-400">{selectedQuota}</p>
        {liveSelected ? (
          <p className="text-[10px] leading-relaxed text-slate-400">
            {liveSelected.healthSuccessRate === null || liveSelected.healthSuccessRate === undefined ? "Health sample unavailable" : `${liveSelected.healthSuccessRate.toFixed(1)}% recent success · ${liveSelected.healthRequests ?? 0} requests`}
            {liveSelected.contextLength ? ` · ${(liveSelected.contextLength / 1000).toFixed(0)}K context` : ""}
            {liveSelected.reasoning ? " · reasoning" : ""}{liveSelected.tools ? " · tool calling" : ""}
          </p>
        ) : null}
        <p className={`text-[10px] ${selectedProviderConfigured === true ? "text-emerald-300" : "text-amber-300"}`}>
          {selectedStatus}
        </p>
        <p className="text-[10px] text-slate-500">Automatic selection includes only privacy-safe, official, healthy, zero-priced general-purpose models. Community-hosted models and models with explicit retention/training warnings are manual-only and require a fresh acknowledgement. Discovery is public; generation needs a server-side secret key. No paid fallback is performed.</p>
      </div>
    </section>
  );
}

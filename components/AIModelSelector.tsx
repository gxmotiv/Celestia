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
  externalDataConsent: boolean;
  onExternalDataConsentChange: (value: boolean) => void;
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

interface LiveNaraRouterModel {
  id: string;
  name: string;
  description: string;
  free: true;
}

interface LiveFreeModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number | null;
  capabilities: string[];
}

interface LiveGroqModel {
  id: string;
  name: string;
  quota: string;
  description: string;
}

interface LiveOpenRouterModel {
  id: string;
  name: string;
}

const PROVIDERS: CelestiaAIProviderId[] = ["pollinations", "cloudflare-workers-ai", "freemodel", "nararouter", "openrouter", "groq"];
const PROVIDER_LABELS: Record<CelestiaAIProviderId, string> = {
  pollinations: "Pollinations — zero-priced official + community",
  freemodel: "FreeModel",
  nararouter: "NaraRouter",
  openrouter: "OpenRouter — free models only",
  groq: "Groq — verified Free-plan models",
  "cloudflare-workers-ai": "Cloudflare Workers AI — Workers Free only",
};

interface ProviderConfiguration extends Partial<Record<CelestiaAIProviderId, boolean>> {
  freemodelKeyConfigured?: boolean;
  freemodelFreePlanConfirmed?: boolean;
  groqKeyConfigured?: boolean;
  groqFreePlanConfirmed?: boolean;
  cloudflareWorkersAiFreePlanConfirmed?: boolean;
  cloudflareWorkersAiBindingConfigured?: boolean;
}

export function AIModelSelector({ value, onChange, privacyRiskAcknowledged, onPrivacyRiskAcknowledgedChange, externalDataConsent, onExternalDataConsentChange }: AIModelSelectorProps) {
  const [providerConfiguration, setProviderConfiguration] = useState<ProviderConfiguration | null>(null);
  const [pollinationsModels, setPollinationsModels] = useState<LivePollinationsModel[]>([]);
  const [manualOnlyModels, setManualOnlyModels] = useState<LivePollinationsModel[]>([]);
  const [naraModels, setNaraModels] = useState<LiveNaraRouterModel[]>([]);
  const [freeModels, setFreeModels] = useState<LiveFreeModel[]>([]);
  const [freeModelError, setFreeModelError] = useState("");
  const [freeModelLoaded, setFreeModelLoaded] = useState(false);
  const [groqModels, setGroqModels] = useState<LiveGroqModel[]>([]);
  const [groqError, setGroqError] = useState("");
  const [groqLoaded, setGroqLoaded] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState<LiveOpenRouterModel[]>([]);
  const [openRouterError, setOpenRouterError] = useState("");
  const [openRouterLoaded, setOpenRouterLoaded] = useState(false);
  const [naraError, setNaraError] = useState("");
  const [naraLoaded, setNaraLoaded] = useState(false);
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
    fetch("/api/astrology/freemodel-models", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "FreeModel catalogue unavailable");
        return data as { models?: LiveFreeModel[]; error?: string };
      })
      .then((data) => {
        if (active) {
          setFreeModels(Array.isArray(data.models) ? data.models : []);
          setFreeModelError(data.error || "");
          setFreeModelLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setFreeModelError(error instanceof Error ? error.message : "FreeModel catalogue unavailable");
          setFreeModelLoaded(true);
        }
      });
    fetch("/api/astrology/groq-models", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Groq catalogue unavailable");
        return data as { models?: LiveGroqModel[]; error?: string };
      })
      .then((data) => {
        if (active) {
          setGroqModels(Array.isArray(data.models) ? data.models : []);
          setGroqError(data.error || "");
          setGroqLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setGroqError(error instanceof Error ? error.message : "Groq catalogue unavailable");
          setGroqLoaded(true);
        }
      });
    fetch("/api/astrology/openrouter-models", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "OpenRouter catalogue unavailable");
        return data as { models?: LiveOpenRouterModel[]; error?: string };
      })
      .then((data) => {
        if (active) {
          setOpenRouterModels(Array.isArray(data.models) ? data.models : []);
          setOpenRouterError(data.error || "");
          setOpenRouterLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setOpenRouterError(error instanceof Error ? error.message : "OpenRouter catalogue unavailable");
          setOpenRouterLoaded(true);
        }
      });
    fetch("/api/astrology/nararouter-models", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "NaraRouter catalogue unavailable");
        return data as { models?: LiveNaraRouterModel[]; error?: string };
      })
      .then((data) => {
        if (active) {
          setNaraModels(Array.isArray(data.models) ? data.models : []);
          setNaraError(data.error || "");
          setNaraLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setNaraError(error instanceof Error ? error.message : "NaraRouter catalogue unavailable");
          setNaraLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedModelIsListed =
    (value.startsWith("groq:") && (!groqLoaded || groqModels.some((model) => `groq:${model.id}` === value))) ||
    (value === "openrouter:openrouter/free" && (!openRouterLoaded || openRouterModels.length > 0)) ||
    CELESTIA_AI_MODELS.some((model) => model.id === value && model.providerId !== "groq" && model.providerId !== "openrouter") ||
    (value.startsWith("pollinations:") && (value === "pollinations:auto-free" ||
      [...pollinationsModels, ...manualOnlyModels].some((model) => `pollinations:${model.id}` === value))) ||
    (value.startsWith("nararouter:") && naraModels.some((model) => `nararouter:${model.id}` === value)) ||
    (value.startsWith("freemodel:") && (!freeModelLoaded || freeModels.some((model) => `freemodel:${model.id}` === value)));

  const staticSelected = CELESTIA_AI_MODELS.find((model) => model.id === value) ?? CELESTIA_AI_MODELS[0];
  const liveSelected = value.startsWith("pollinations:")
    ? [...pollinationsModels, ...manualOnlyModels].find((model) => `pollinations:${model.id}` === value)
    : undefined;
  const naraSelected = value.startsWith("nararouter:")
    ? naraModels.find((model) => `nararouter:${model.id}` === value)
    : undefined;
  const freeSelected = value.startsWith("freemodel:")
    ? freeModels.find((model) => `freemodel:${model.id}` === value)
    : undefined;
  const selectedProviderId = value.startsWith("pollinations:") ? "pollinations"
    : value.startsWith("nararouter:") ? "nararouter"
    : value.startsWith("freemodel:") ? "freemodel"
    : value.startsWith("groq:") ? "groq"
    : staticSelected.providerId;
  const selectedName = liveSelected?.name ?? naraSelected?.name ?? freeSelected?.name ?? staticSelected.name;
  const selectedDescription = liveSelected?.description ?? naraSelected?.description ?? freeSelected?.description ?? staticSelected.description;
  const selectedQuota = liveSelected
    ? `Published input price: 0 · output price: 0 · ${liveSelected.community ? `community publisher: ${liveSelected.publisher ?? "unknown"}` : "official source"} · healthy status`
    : freeSelected
      ? `FreeModel Free plan: 1M input + output tokens/month · up to 60 RPM · ${freeSelected.contextWindow ? `${Math.round(freeSelected.contextWindow / 1000)}K context · ` : ""}${freeSelected.capabilities.join(", ")}`
      : naraSelected?.description ?? staticSelected.quotaNote;
  const selectedProviderConfigured = providerConfiguration?.[selectedProviderId];
  const selectedSecret = selectedProviderId === "cloudflare-workers-ai" ? "Cloudflare Worker AI binding (no API key)"
    : selectedProviderId === "pollinations" ? "POLLINATIONS_API_KEY"
    : selectedProviderId === "nararouter" ? "NARAROUTER_API_KEY"
    : selectedProviderId === "freemodel" ? "FREEMODEL_API_KEY"
    : selectedProviderId === "groq" ? "GROQ_API_KEY"
    : staticSelected.secretName;
  const selectedStatus = selectedProviderId === "cloudflare-workers-ai"
    ? !providerConfiguration?.cloudflareWorkersAiFreePlanConfirmed
      ? "Disabled: confirm Cloudflare Workers Free plan only. Workers Paid can bill above the daily allowance."
      : !providerConfiguration?.cloudflareWorkersAiBindingConfigured
        ? "Workers Free plan confirmed, but the native AI binding is missing."
        : "Workers Free plan confirmed; native AI binding ready. Shared 10,000 Neurons/day, resets 00:00 UTC."
    : selectedProviderId === "freemodel" && !providerConfiguration?.freemodelFreePlanConfirmed
    ? providerConfiguration?.freemodelKeyConfigured ? "API key configured, but confirm the $0 Free plan and zero prepaid/Day Pass balance first" : "Missing FREEMODEL_API_KEY and Free-plan confirmation"
    : selectedProviderId === "groq" && !providerConfiguration?.groqFreePlanConfirmed
      ? providerConfiguration?.groqKeyConfigured ? "API key configured, but Free-plan confirmation is still required" : "Missing GROQ_API_KEY and Free-plan confirmation"
    : selectedProviderConfigured === true
      ? "Server key configured; live provider authentication is checked when the request runs"
      : selectedProviderConfigured === false
        ? `Missing or ineligible server configuration: ${selectedSecret}`
        : `Requires server secret: ${selectedSecret}`;

  return (
    <section className="rounded-xl border border-amber-500/30 bg-slate-950/90 p-4 space-y-3" aria-label="AI provider and model selection">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Choose AI provider and model</h3>
          <p className="text-xs text-slate-400">Choose the provider and model for Oracle and Blueprint. Explicit selections are sent only to that provider.</p>
        </div>
        <span className="text-[10px] rounded-md border border-slate-700 px-2 py-1 text-slate-300 w-fit">Provider-specific cost controls</span>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-300">Provider / model</span>
        <select
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onPrivacyRiskAcknowledgedChange(false);
          }}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none focus:border-amber-500"
        >
          {!selectedModelIsListed ? <option value={value} disabled>{value} — unavailable in the current live catalogue; select another model manually</option> : null}
          {PROVIDERS.map((providerId) => {
            const configured = providerConfiguration?.[providerId];
            const suffix = providerId === "cloudflare-workers-ai" && !providerConfiguration?.cloudflareWorkersAiFreePlanConfirmed ? " · Workers Free confirmation required" : providerId === "cloudflare-workers-ai" && !providerConfiguration?.cloudflareWorkersAiBindingConfigured ? " · AI binding missing" : providerId === "groq" && !providerConfiguration?.groqFreePlanConfirmed ? " · requires $0 Free-plan confirmation" : providerId === "freemodel" && !providerConfiguration?.freemodelFreePlanConfirmed ? " · requires $0 + zero-balance confirmation" : providerId === "cloudflare-workers-ai" ? " · native binding; no API key" : configured === true ? " · key/binding ready" : configured === false ? " · server configuration required" : "";
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
                      {model.community ? `Community · ${model.publisher} · ${model.name}` : `${model.name} · privacy warning · manual opt-in`}
                    </option>
                  ))}
                </optgroup>
              );
            }
            if (providerId === "openrouter") {
              return (
                <optgroup key={providerId} label={PROVIDER_LABELS[providerId] + suffix}>
                  <option value="openrouter:openrouter/free" disabled={configured === false || (openRouterLoaded && openRouterModels.length === 0)}>
                    Auto-select eligible $0 text model{openRouterLoaded ? " (" + openRouterModels.length + " available)" : ""}
                  </option>
                </optgroup>
              );
            }
            if (providerId === "groq") {
              return (
                <optgroup key={providerId} label={PROVIDER_LABELS[providerId] + suffix}>
                  {groqModels.map((model) => (
                    <option key={model.id} value={"groq:" + model.id} disabled={configured === false}>
                      {model.name} — {model.quota}
                    </option>
                  ))}
                  {groqLoaded && groqModels.length === 0 ? <option value="" disabled>No verified Groq Free-plan models</option> : null}
                </optgroup>
              );
            }
            if (providerId === "freemodel") {
              return (
                <optgroup key={providerId} label={PROVIDER_LABELS[providerId] + suffix}>
                  {freeModels.map((model) => (
                    <option key={model.id} value={`freemodel:${model.id}`} disabled={configured === false}>
                      {model.name} — FreeModel monthly allowance
                    </option>
                  ))}
                  {freeModelLoaded && freeModels.length === 0 ? (
                    <option value="" disabled>No live FreeModel chat models available</option>
                  ) : null}
                </optgroup>
              );
            }
            if (providerId === "nararouter") {
              return (
                <optgroup key={providerId} label={PROVIDER_LABELS[providerId] + " — verified Free plan" + suffix}>
                  {naraModels.map((model) => (
                    <option key={model.id} value={`nararouter:${model.id}`} disabled={configured === false}>
                      {model.name} — Free plan (quota-limited)
                    </option>
                  ))}
                  {naraLoaded && naraModels.length === 0 ? (
                    <option value="" disabled>No verified Free-plan model available</option>
                  ) : null}
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

      <label className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-sky-100">
        <input
          type="checkbox"
          checked={externalDataConsent}
          onChange={(event) => onExternalDataConsentChange(event.target.checked)}
          className="mt-0.5 accent-sky-500"
        />
        <span>
          <strong className="block mb-1">Consent to send chart context to the selected AI provider</strong>
          Celestia sends the question, selected chart placements/calculated values, and recent chat context to the provider you selected. It does not automatically attach your profile name, birth date, birth time, birthplace, or coordinates. Anything you type into the question or chat history may also be sent. The provider processes the content under its own terms and data-handling practices. Do not include confidential information. This consent is required before any AI request.
        </span>
      </label>
      {!selectedModelIsListed ? <p role="alert" className="text-xs text-amber-300">The saved model selection is not present in the current catalogue. Celestia has not switched providers; choose another model manually.</p> : null}
      {catalogueError ? <p className="text-xs text-amber-300">{catalogueError}</p> : null}
      {freeModelError ? <p className="text-xs text-amber-300">{freeModelError}</p> : null}
      {groqError ? <p className="text-xs text-amber-300">{groqError}</p> : null}
      {openRouterError ? <p className="text-xs text-amber-300">{openRouterError}</p> : null}
      {freeModelLoaded && !freeModelError && freeModels.length === 0 ? <p className="text-xs text-amber-300">FreeModel returned no selectable chat models. Confirm the key has the models:read scope and that the monthly Free allowance is active.</p> : null}
      {naraError ? <p className="text-xs text-amber-300">{naraError}</p> : null}
      {naraLoaded && !naraError && naraModels.length === 0 ? (
        <p className="text-xs text-amber-300">
NaraRouter authenticated successfully, but this key has no verified Free-plan model in its current catalogue. If your Free plan is active and Telegram is linked, contact NaraRouter support to check account entitlement or API-key association. Paid/PAYG models remain blocked.
        </p>
      ) : null}
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
            {liveSelected?.community ? `This model is published by ${liveSelected.publisher || "a community publisher"} and runs on independent provider infrastructure. Pollinations says community providers control their own storage, sharing, security, and training practices; it does not verify them. ` : ""}
            {liveSelected?.privacyRisk ? "The model listing also warns that prompts and replies may be retained and used for training, and zero-data-retention is unavailable. " : ""}
            Celestia sends chart placements, the reading/question, and recent chat context, but does not automatically attach profile birth details. Free text you enter may still contain personal information. I understand this provider controls its own processing and data handling, and I explicitly accept the additional risk for this model.
          </span>
        </label>
      ) : null}
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm text-amber-300">{selectedProviderId === "pollinations" ? "Pollinations" : selectedProviderId === "nararouter" ? "NaraRouter" : selectedProviderId === "freemodel" ? "FreeModel" : selectedProviderId === "groq" ? "Groq" : staticSelected.providerName} · {selectedName}</strong>
          <span className="text-[10px] text-slate-300 rounded border border-slate-700 px-1.5 py-0.5">{liveSelected || freeSelected ? "Live catalogue model" : naraSelected ? "Verified Free-plan model" : staticSelected.role}</span>
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
        <p className="text-[10px] text-slate-500">Pollinations uses only verified zero-priced models. FreeModel options come from the authenticated live chat catalogue and consume its monthly Free allowance. NaraRouter shows only currently verified Free-plan models. Groq is blocked unless the server confirms its $0 Free plan. OpenRouter accepts only current zero-priced :free variants. Provider quotas and availability can change. A configured key does not prove successful authentication; there is no paid fallback.</p>
      </div>
    </section>
  );
}

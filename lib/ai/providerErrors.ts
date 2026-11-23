export interface SafeAIProviderError {
  success: false;
  provider: string;
  code: string;
  error: string;
}

function readStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as { status?: unknown }).status;
  if (typeof status === "number" && Number.isInteger(status)) return status;
  const message = error instanceof Error ? error.message : "";
  const match = message.match(/HTTP\s+(\d{3})/i);
  return match ? Number(match[1]) : undefined;
}

/** Return user-safe provider diagnostics without leaking upstream response bodies or credentials. */
export function toSafeAIProviderError(error: unknown, provider: string): {
  body: SafeAIProviderError;
  status: number;
} {
  const status = readStatus(error);
  const rawMessage = error instanceof Error ? error.message : "";
  if (/not configured|server secret|free plan confirmation/i.test(rawMessage)) {
    return {
      status: 503,
      body: { success: false, provider, code: "PROVIDER_NOT_CONFIGURED", error: rawMessage },
    };
  }
  if (status === 401 || status === 403) {
    return {
      status: 503,
      body: { success: false, provider, code: "PROVIDER_AUTH_FAILED", error: "The provider rejected the server-side API key or its permissions. Check this provider's secret and required scopes." },
    };
  }
  if (status === 429) {
    return {
      status: 429,
      body: { success: false, provider, code: "PROVIDER_RATE_LIMITED", error: "The provider's free request or token quota is currently exhausted. Check its rate-limit reset time, then retry. Celestia did not switch providers." },
    };
  }
  if (status === 404 || /not currently listed|not in the .*catalogue|not available/i.test(rawMessage)) {
    return {
      status: 409,
      body: { success: false, provider, code: "MODEL_UNAVAILABLE", error: "The selected model is no longer available in the verified provider catalogue. Refresh the model list and select an available model." },
    };
  }
  if (status && status >= 500) {
    return {
      status: 502,
      body: { success: false, provider, code: "PROVIDER_UNAVAILABLE", error: "The AI provider is temporarily unavailable. Retry later; Celestia did not switch providers." },
    };
  }
  return {
    status: 502,
    body: { success: false, provider, code: "AI_PROVIDER_REQUEST_FAILED", error: "The AI provider request failed validation or could not be completed. Check the provider configuration and model availability." },
  };
}

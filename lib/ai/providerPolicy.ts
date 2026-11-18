export type CelestiaAIProvider = "freemodel" | "nararouter" | "gemini";

export const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
export const HARD_MAX_OUTPUT_TOKENS = 4096;

/**
 * Resolve exactly one configured provider. An unset value preserves the
 * existing FreeModel-first behaviour, but never enables automatic fallback.
 */
export function resolveCelestiaAIProvider(value?: string | null): CelestiaAIProvider {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "freemodel";
  if (normalized === "freemodel" || normalized === "nararouter" || normalized === "gemini") {
    return normalized;
  }
  throw new Error(
    "Invalid CELESTIA_AI_PROVIDER. Choose exactly one of: freemodel, nararouter, gemini."
  );
}

/** Clamp caller-provided output limits so they cannot exceed the hard ceiling. */
export function clampCelestiaOutputTokens(value?: number): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_MAX_OUTPUT_TOKENS;
  return Math.min(HARD_MAX_OUTPUT_TOKENS, Math.max(1, Math.floor(value)));
}

/**
 * Provider calls are disabled unless an operator explicitly opts in.
 * Only the exact string "true" enables outbound model requests.
 */
export function isCelestiaAIEnabled(value?: string | null): boolean {
  return value?.trim().toLowerCase() === "true";
}

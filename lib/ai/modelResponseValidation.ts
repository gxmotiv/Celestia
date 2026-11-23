export type ModelResponseValidation =
  | { valid: true; answer: string }
  | { valid: false; reason: string };

/**
 * Fail closed unless the provider confirms the exact model requested and
 * returns non-empty assistant text. This prevents silent model substitution
 * from being reported as a successful generation.
 */
export function validateRequestedModelResponse(
  requestedModel: string,
  payload: unknown,
): ModelResponseValidation {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, reason: "Response payload is not a JSON object." };
  }

  const response = payload as Record<string, unknown>;
  if (typeof response.model !== "string" || response.model.trim() === "") {
    return { valid: false, reason: "Provider response omitted the returned model ID." };
  }
  if (response.model !== requestedModel) {
    return {
      valid: false,
      reason: `Requested model "${requestedModel}" but provider returned "${response.model}".`,
    };
  }

  const choices = response.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : undefined;
  const message = firstChoice && typeof firstChoice === "object"
    ? (firstChoice as Record<string, unknown>).message
    : undefined;
  const answer = message && typeof message === "object"
    ? (message as Record<string, unknown>).content
    : undefined;

  if (typeof answer !== "string" || answer.trim() === "") {
    return { valid: false, reason: "Provider response contained no non-empty assistant text." };
  }

  return { valid: true, answer };
}

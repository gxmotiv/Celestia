export const CELESTIA_AI_MODELS = [
  { id: "free/deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", role: "Recommended default", description: "Best practical default from Celestia trials: passed Task C and scored 27/30 on Task D. Use for detailed chart interpretation and everyday research.", quotaWeight: "×3" },
  { id: "free/mimo-v2.6-pro", name: "MiMo V2.6 Pro", role: "Lower-quota second opinion", description: "Scored 28/30 on Task D. A useful independent cross-check when conserving APInex quota.", quotaWeight: "×2" },
  { id: "free/minimax-m3.1-flash", name: "MiniMax M3.1 Flash", role: "Fast routine work", description: "Scored 27/30 on Task D. Suitable for shorter, routine questions and quick summaries.", quotaWeight: "×2" },
  { id: "free/gemini-4-hydrogen", name: "Gemini 4 Hydrogen", role: "Advanced reasoning challenger", description: "Passed Celestia Task C. Use as a challenger for difficult tradition-specific reasoning; not yet proven as the default.", quotaWeight: "×5" },
  { id: "free/gemini-3.8-flash", name: "Gemini 3.8 Flash", role: "Research challenger", description: "Passed Celestia Task C. Useful for independent research summaries and structured answers.", quotaWeight: "×3" },
  { id: "free/muse-spark-1.3", name: "Muse Spark 1.3", role: "Honesty and hallucination audit", description: "Scored 28/30 on Task D, but produced malformed JSON on Task C. Use to challenge claims; validate its output format.", quotaWeight: "×3" },
  { id: "free/deepseek-v4-pro-0813", name: "DeepSeek V4 Pro", role: "Code and reasoning challenger", description: "Passed Celestia Task C. Use for difficult source-grounded code reviews and complex reasoning comparisons.", quotaWeight: "×3" },
  { id: "free/hy4-flash", name: "HY4 Flash", role: "Experimental fast challenger", description: "A separate model from Gemini 4 Hydrogen. Keep experimental until it has comparable Celestia trial results.", quotaWeight: "×2" },
  { id: "free/kimi-k3", name: "Kimi K3", role: "Long-context research challenger", description: "Keep for long-document and research comparisons. Celestia-specific evidence is not yet sufficient to make it the default.", quotaWeight: "×3" },
  { id: "free/qwen-3.8-max", name: "Qwen 3.8 Max", role: "Research challenger", description: "Worth comparing on research tasks, but malformed JSON on Task C. Check output validity before relying on it.", quotaWeight: "×3" },
  { id: "free/gpt-6-luna", name: "GPT-6 Luna", role: "General-purpose challenger", description: "Keep in the benchmark pool. Promote only after identical Celestia A–G tests establish its strengths.", quotaWeight: "×3" },
  { id: "free/glm-5.3-flash", name: "GLM 5.3 Flash", role: "Alternative fast model", description: "A fallback candidate for quick tasks. Needs more comparable Celestia trial evidence before promotion.", quotaWeight: "×3" },
] as const;

export type CelestiaAIModelId = (typeof CELESTIA_AI_MODELS)[number]["id"];

export const DEFAULT_CELESTIA_AI_MODEL: CelestiaAIModelId = "free/deepseek-v4.1-flash";

export function isCelestiaAIModelId(value: unknown): value is CelestiaAIModelId {
  return typeof value === "string" && CELESTIA_AI_MODELS.some((model) => model.id === value);
}

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  const freemodelKeyConfigured = Boolean(process.env.FREEMODEL_API_KEY?.trim());
  const freemodelFreePlanConfirmed = process.env.FREEMODEL_FREE_PLAN_CONFIRMED?.trim().toLowerCase() === "true";
  const groqKeyConfigured = Boolean(process.env.GROQ_API_KEY?.trim());
  const groqFreePlanConfirmed = process.env.GROQ_FREE_PLAN_CONFIRMED?.trim().toLowerCase() === "true";
  const cloudflareWorkersAIFreePlanConfirmed = process.env.CLOUDFLARE_WORKERS_AI_FREE_PLAN_CONFIRMED?.trim().toLowerCase() === "true";
  let cloudflareWorkersAIBindingConfigured = false;
  try {
    cloudflareWorkersAIBindingConfigured = Boolean((getCloudflareContext().env as unknown as { AI?: unknown }).AI);
  } catch {
    cloudflareWorkersAIBindingConfigured = false;
  }
  return NextResponse.json(
    {
      providers: {
        pollinations: Boolean(process.env.POLLINATIONS_API_KEY?.trim()),
        freemodel: freemodelKeyConfigured && freemodelFreePlanConfirmed,
        freemodelKeyConfigured,
        freemodelFreePlanConfirmed,
        nararouter: Boolean(process.env.NARAROUTER_API_KEY?.trim()),
        openrouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
        groq: groqKeyConfigured && groqFreePlanConfirmed,
        groqKeyConfigured,
        groqFreePlanConfirmed,
        cloudflareWorkersAi: cloudflareWorkersAIFreePlanConfirmed && cloudflareWorkersAIBindingConfigured,
        cloudflareWorkersAiFreePlanConfirmed,
        cloudflareWorkersAiBindingConfigured,
      },
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

import { NextResponse } from "next/server";
import { getGroqAvailableFreeModels } from "@/lib/ai/groqCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const freePlanConfirmed = process.env.GROQ_FREE_PLAN_CONFIRMED?.trim().toLowerCase() === "true";
  if (!apiKey) {
    return NextResponse.json({ configured: false, models: [], error: "Add the server-side GROQ_API_KEY secret." }, { headers: { "Cache-Control": "no-store" } });
  }
  if (!freePlanConfirmed) {
    return NextResponse.json({ configured: false, models: [], error: "Groq inference is disabled until the $0 Free plan is confirmed with GROQ_FREE_PLAN_CONFIRMED=true." }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const models = await getGroqAvailableFreeModels(apiKey);
    if (models.length === 0) {
      return NextResponse.json({ configured: true, models: [], error: "The Groq account catalogue does not currently expose a Celestia-allowlisted Free-plan model." }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ configured: true, models }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error && typeof error === "object" && typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status : 502;
    return NextResponse.json(
      { configured: true, models: [], error: error instanceof Error ? error.message : "Groq catalogue check failed." },
      { status: status >= 400 && status < 600 ? status : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

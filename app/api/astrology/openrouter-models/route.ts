import { NextResponse } from "next/server";
import { getOpenRouterFreeModels } from "@/lib/ai/openrouterCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ configured: false, models: [], error: "Add the server-side OPENROUTER_API_KEY secret." }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const models = await getOpenRouterFreeModels(apiKey);
    return NextResponse.json({ configured: true, models }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error && typeof error === "object" && typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status : 502;
    return NextResponse.json(
      { configured: true, models: [], error: error instanceof Error ? error.message : "OpenRouter catalogue check failed." },
      { status: status >= 400 && status < 600 ? status : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

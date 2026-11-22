import { NextResponse } from "next/server";
import { getNaraRouterFreeModels } from "@/lib/ai/nararouterCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.NARAROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { configured: false, models: [], error: "NaraRouter needs the server-side NARAROUTER_API_KEY secret." },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  try {
    const models = await getNaraRouterFreeModels(apiKey);
    return NextResponse.json(
      { configured: true, models },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "NaraRouter model discovery failed.";
    return NextResponse.json(
      { configured: true, models: [], error: message },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

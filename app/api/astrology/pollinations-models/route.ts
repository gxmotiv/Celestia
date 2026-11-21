import { NextResponse } from "next/server";
import { getPollinationsFreeTextModels, getPollinationsManualOnlyTextModels } from "@/lib/ai/pollinationsCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [models, manualOnlyModels] = await Promise.all([
      getPollinationsFreeTextModels(),
      getPollinationsManualOnlyTextModels(),
    ]);
    return NextResponse.json(
      {
        provider: "pollinations",
        models,
        manualOnlyModels,
        filter: "official + healthy + general-purpose + zero-priced; privacy-risk models separated for explicit manual consent",
        sort: "price-low",
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("Pollinations model discovery failed:", error);
    return NextResponse.json(
      { error: "Pollinations model catalogue is temporarily unavailable.", models: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

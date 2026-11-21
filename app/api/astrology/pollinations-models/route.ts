import { NextResponse } from "next/server";
import { getPollinationsFreeTextModels } from "@/lib/ai/pollinationsCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await getPollinationsFreeTextModels();
    return NextResponse.json(
      { provider: "pollinations", models, filter: "official + healthy + zero-priced text models", sort: "price-low" },
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

import { NextResponse } from "next/server";
import { getFreeModelChatCatalog } from "@/lib/ai/freemodelCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.FREEMODEL_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { configured: false, models: [], error: "FreeModel requires the server-side FREEMODEL_API_KEY secret." },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  try {
    const models = await getFreeModelChatCatalog(apiKey);
    return NextResponse.json(
      { configured: true, models },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "FreeModel model discovery failed.";
    const status = error && typeof error === "object" && typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 502;
    return NextResponse.json(
      { configured: true, models: [], error: message },
      { status: status >= 400 && status < 600 ? status : 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

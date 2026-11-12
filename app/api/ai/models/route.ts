import { NextResponse } from "next/server";
import { getNaraRouterConfig, NARA_CODE_MODEL, NARA_VISION_MODEL } from "@/lib/ai/nararouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = getNaraRouterConfig();
  if (!config.apiKey) {
    return NextResponse.json(
      { configured: false, error: "NARAROUTER_API_KEY is not configured on the server." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        { configured: true, verified: false, error: "NaraRouter could not list models for this key." },
        { status: response.status === 429 ? 429 : 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload = await response.json() as { data?: Array<{ id?: string }> };
    const ids = Array.isArray(payload.data)
      ? payload.data.map((model) => model.id).filter((id): id is string => typeof id === "string")
      : [];

    return NextResponse.json(
      {
        configured: true,
        verified: true,
        models: {
          vision: { requested: config.visionModel, available: ids.includes(config.visionModel) },
          code: { requested: config.codeModel, available: ids.includes(config.codeModel) },
        },
        availableModels: ids,
        note: "Model availability is checked against the models visible to this NaraRouter API key.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { configured: true, verified: false, error: "Could not contact NaraRouter model catalogue." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateCelestiaText } from "@/lib/ai/generateText";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    // Accept the live cockpit contract and legacy field names during migration.
    const seekerName = payload?.seekerName ?? payload?.name ?? "Querent";
    const question = String(payload?.query ?? payload?.question ?? "").slice(0, 2000);
    const context = payload?.context ?? payload?.profileData ?? {};
    const history = Array.isArray(payload?.conversationHistory)
      ? payload.conversationHistory.slice(-4).map((message: { sender?: string; text?: string }) =>
          `${message.sender ?? "context"}: ${String(message.text ?? "").slice(0, 1200)}`
        ).join("\n")
      : "";

    if (!question.trim()) {
      return NextResponse.json({ error: "A question is required." }, { status: 400 });
    }

    const systemPrompt = `You are Acharya Celestia, a careful multi-tradition astrological research assistant.
Answer the querent's question using only the chart context supplied. Do not invent planetary positions, dasha dates, or life events. Distinguish traditional beliefs and interpretations from verified calculations, and never state predictions as guaranteed facts.
Keep the answer focused, practical, respectful, and structured. If essential chart data is missing, say so explicitly.`;

    const userPrompt = [
      `Querent: ${seekerName}`,
      `Question: ${question}`,
      `Birth details: ${payload?.birthDate ?? "not supplied"} ${payload?.birthTime ?? ""}; ${payload?.location ?? "location not supplied"}.`,
      "",
      "CHART CONTEXT",
      `Western: Sun ${context?.western?.sunSign ?? "?"}; Moon ${context?.western?.moonSign ?? "?"}; Ascendant ${context?.western?.ascendantSign ?? "?"}; Midheaven ${context?.western?.midheavenSign ?? "?"}; major aspects: ${(context?.western?.majorAspects ?? []).join("; ")}.`,
      `Vedic: Lagna ${context?.vedic?.lagnaRasi ?? context?.vedic?.lagna ?? "?"}; Moon Rasi ${context?.vedic?.moonRasi ?? "?"}; Nakshatra ${context?.vedic?.nakshatra ?? "?"} (Pada ${context?.vedic?.pada ?? "?"}; lord ${context?.vedic?.nakshatraLord ?? "?"}); Mahadasha ${context?.vedic?.activeMahadasha ?? context?.vedic?.mahadasha ?? "?"}; Antardasha ${context?.vedic?.activeAntardasha ?? context?.vedic?.antardasha ?? "?"}; yogas: ${(context?.vedic?.yogas ?? []).join("; ")}.`,
      `Dasha convergence: ${JSON.stringify(context?.dashaConvergence ?? {})}`,
      `Numerology: Life Path ${context?.numerology?.lifePath ?? "?"}; Expression ${context?.numerology?.expression ?? "?"}; Personal Year ${context?.numerology?.personalYear ?? "?"}.`,
      `BaZi: Animal ${context?.bazi?.zodiacAnimal ?? "?"}; Day Master ${context?.bazi?.dayMaster ?? "?"}; dominant element ${context?.bazi?.dominantElement ?? "?"}.`,
      history ? `Recent conversation:\n${history}` : "",
      "",
      "Answer the latest question. Avoid repeating old messages unless needed."
    ].filter(Boolean).join("\n");

    try {
      const result = await generateCelestiaText({
        systemPrompt,
        userPrompt,
        maxOutputTokens: 2048,
        modelTier: "reasoning",
      });
      return NextResponse.json({
        success: true,
        reply: result.text,
        isAiGenerated: true,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
      });
    } catch (aiErr) {
      console.warn("Master Oracle provider unavailable; using local fallback:", aiErr);
    }

    const reply = `### Guidance from Acharya Celestia

Your question: *"${question}"*

The supplied chart context lists **${context?.vedic?.activeMahadasha ?? "no Mahadasha data"} Mahadasha** and **${context?.vedic?.activeAntardasha ?? "no Antardasha data"} Antardasha**, with Western Sun **${context?.western?.sunSign ?? "not supplied"}** and Life Path **${context?.numerology?.lifePath ?? "not supplied"}**.

The AI provider is currently unavailable, so this response is a limited data-only fallback rather than a generated consultation. Please try again when an AI provider is configured.`;

    return NextResponse.json({
      success: true,
      reply,
      isAiGenerated: false,
      provider: "local-fallback",
    });
  } catch (err) {
    console.error("Master oracle route error:", err);
    return NextResponse.json({ error: "Failed to consult oracle" }, { status: 500 });
  }
}

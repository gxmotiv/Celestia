import { NextRequest, NextResponse } from "next/server";
import { generateCelestiaText } from "@/lib/ai/generateText";
import { isCelestiaAIModelId } from "@/lib/ai/modelCatalog";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    // These names match the payload created by components/AIReadingView.tsx.
    const {
      name,
      birthData,
      western,
      vedic,
      numerology,
      chinese,
      readingMode = "holistic",
      readingLength = "detailed",
      userQuestion,
      model,
      allowPrivacyRiskModel,
    } = payload ?? {};

    if (model !== undefined && !isCelestiaAIModelId(model)) {
      return NextResponse.json({ error: "The selected AI model is not supported." }, { status: 400 });
    }
    const isManualOnlyPollinationsModel = typeof model === "string" &&
      (model === "pollinations:stealth/glyph-cluster" || model.startsWith("pollinations:community/"));
    if (isManualOnlyPollinationsModel && allowPrivacyRiskModel !== true) {
      return NextResponse.json({
        error: "This Pollinations model requires explicit acknowledgement of its provider and data-handling warning before any chart data is sent.",
      }, { status: 400 });
    }

    const fullName = typeof name === "string" && name.trim() ? name.trim() : "Querent";
    const question = typeof userQuestion === "string" ? userQuestion.slice(0, 2000) : "";
    const westernPlanets = western?.planets && typeof western.planets === "object"
      ? Object.entries(western.planets).slice(0, 15).map(([planet, value]) => {
          const position = value as { sign?: string; degree?: string; house?: number; isRetrograde?: boolean };
          return `${planet}: ${position.sign ?? "unknown"} ${position.degree ?? ""}, House ${position.house ?? "unknown"}${position.isRetrograde ? " (retrograde)" : ""}`;
        }).join("; ")
      : "Not supplied";
    const westernAspects = Array.isArray(western?.aspects)
      ? western.aspects.slice(0, 12).map((aspect: { planet1?: string; aspectName?: string; planet2?: string; orb?: number }) =>
          `${aspect.planet1 ?? "?"} ${aspect.aspectName ?? "aspect"} ${aspect.planet2 ?? "?"} (orb ${aspect.orb ?? "?"}°)`
        ).join("; ")
      : "Not supplied";
    const vedicYogas = Array.isArray(vedic?.yogas) ? vedic.yogas.slice(0, 20).join("; ") : "Not supplied";

    const systemPrompt = `You are Acharya Celestia, a careful multi-tradition astrology research assistant.
Use only the chart values supplied below. Never invent planetary placements, aspects, house positions, dasha dates, or birth details. Clearly distinguish traditional astrological interpretation from verifiable facts and avoid presenting predictions as certainty.
Respect the named traditions separately: Western Tropical, Vedic Sidereal/Lahiri, numerology, and Chinese BaZi. If a data point is missing, say so instead of guessing.
Format a useful, structured response with Markdown headings. Do not repeat the entire raw input.`;

    const userPrompt = [
      `Querent: ${fullName}`,
      `Birth data: ${birthData?.date ?? "not supplied"} ${birthData?.time ?? ""}; ${birthData?.place ?? "place not supplied"}; coordinates ${birthData?.latitude ?? "?"}, ${birthData?.longitude ?? "?"}; UTC offset ${birthData?.timezoneOffsetHours ?? "?"} hours.`,
      `Requested report: ${readingMode}; length: ${readingLength}.`,
      question ? `Specific question: ${question}` : "",
      "",
      "VERIFIED CHART DATA",
      `Western: Sun ${western?.sun?.sign ?? "not supplied"} (${western?.sun?.degree ?? "?"}°, House ${western?.sun?.house ?? "?"}); Moon ${western?.moon?.sign ?? "not supplied"} (${western?.moon?.degree ?? "?"}°, House ${western?.moon?.house ?? "?"}); Ascendant ${western?.ascendant ?? "not supplied"}; Midheaven ${western?.midheaven ?? "not supplied"}.`,
      `Western house system: ${western?.houseSystemUsed ?? western?.houseSystem ?? "not supplied"}${western?.houseSystemFallbackReason ? `; note: ${western.houseSystemFallbackReason}` : ""}.`,
      `Western planets: ${westernPlanets}`,
      `Western major aspects: ${westernAspects}`,
      `Vedic: Lagna ${vedic?.lagna ?? "not supplied"}; Moon Rasi ${vedic?.moonSign ?? "not supplied"}; Nakshatra ${vedic?.nakshatra ?? "not supplied"} Pada ${vedic?.pada ?? "?"}; Nakshatra lord ${vedic?.nakshatraLord ?? "?"}; current Mahadasha ${vedic?.currentDasha?.planet ?? "?"}; Antardasha ${vedic?.currentDasha?.subPlanet ?? "?"}; Navamsa Lagna ${vedic?.navamsa?.lagna ?? "?"}; Moon Navamsa ${vedic?.navamsa?.moonNavamsa ?? "?"}; Yogas: ${vedicYogas}.`,
      `Numerology: Life Path ${numerology?.lifePath ?? "?"}; Expression ${numerology?.expression ?? "?"}; Soul Urge ${numerology?.soulUrge ?? "?"}; Personality ${numerology?.personality ?? "?"}; Birthday ${numerology?.birthday ?? "?"}; Maturity ${numerology?.maturity ?? "?"}; Personal Year ${numerology?.personalYear ?? "?"}.`,
      `BaZi: Animal ${chinese?.animal ?? "?"}; Year element ${chinese?.element ?? "?"}; Yin/Yang ${chinese?.yinYang ?? "?"}; Day Master ${chinese?.dayMaster ?? "?"} (strength ${chinese?.dayMasterStrength ?? "?"}); Four pillars ${JSON.stringify(chinese?.bazi ?? {})}; element balance ${JSON.stringify(chinese?.elementsBalance ?? {})}.`,
      "",
      "Deliver the requested report using the verified data above."
    ].filter(Boolean).join("\n");

    try {
      const result = await generateCelestiaText({
        systemPrompt,
        userPrompt,
        maxOutputTokens: readingLength === "concise" ? 2048 : 4096,
        // Concise changes answer length, not the reasoning quality.
        modelTier: "reasoning",
        ...(model ? { model } : {}),
        allowPrivacyRiskModel: allowPrivacyRiskModel === true,
      });
      return NextResponse.json({
        success: true,
        reading: result.text,
        isAiGenerated: true,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
      });
    } catch (aiErr) {
      console.warn("AI reading provider unavailable; using transparent local fallback:", aiErr);
    }

    const reading = `### Celestial Synthesis for ${fullName}

#### I. Western Astrological Blueprint
Sun: **${western?.sun?.sign ?? "not supplied"}**; Moon: **${western?.moon?.sign ?? "not supplied"}**; Ascendant: **${western?.ascendant ?? "not supplied"}**. The supplied house framework is **${western?.houseSystemUsed ?? western?.houseSystem ?? "not supplied"}**.

#### II. Vedic Jyotish
Lagna: **${vedic?.lagna ?? "not supplied"}**; Moon Rasi: **${vedic?.moonSign ?? "not supplied"}**; Nakshatra: **${vedic?.nakshatra ?? "not supplied"}**. Current dasha fields: **${vedic?.currentDasha?.planet ?? "not supplied"} / ${vedic?.currentDasha?.subPlanet ?? "not supplied"}**.

#### III. Numerology
Life Path: **${numerology?.lifePath ?? "not supplied"}**; Expression: **${numerology?.expression ?? "not supplied"}**; Personal Year: **${numerology?.personalYear ?? "not supplied"}**.

#### IV. Chinese BaZi
Animal: **${chinese?.animal ?? "not supplied"}**; Day Master: **${chinese?.dayMaster ?? "not supplied"}**; Element: **${chinese?.element ?? "not supplied"}**.

---
*AI provider unavailable. This is a limited, data-only local summary, not an AI-generated interpretation.*`;

    return NextResponse.json({
      success: true,
      reading,
      isAiGenerated: false,
      provider: "local-fallback",
    });
  } catch (err) {
    console.error("AI reading route error:", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}

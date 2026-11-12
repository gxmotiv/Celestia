import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { checkNaraClientRateLimit, extractNaraAssistantText, getNaraRouterConfig, requestNaraChatCompletion } from "@/lib/ai/nararouter";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const fullName = payload?.fullName || payload?.name || "Querent";
    const birthData = payload?.birthData || {};
    const westernSource = payload?.westernData || payload?.western || {};
    const aspectSource = westernSource.majorAspects || westernSource.aspects || [];
    const westernData = {
      sun: typeof westernSource.sun === "string" ? westernSource.sun : westernSource.sun?.sign,
      moon: typeof westernSource.moon === "string" ? westernSource.moon : westernSource.moon?.sign,
      ascendant: typeof westernSource.ascendant === "string" ? westernSource.ascendant : westernSource.ascendant?.sign,
      majorAspects: Array.isArray(aspectSource) ? aspectSource.map((item: unknown) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const aspect = item as Record<string, unknown>;
        return [aspect.planet1, aspect.aspectName, aspect.planet2].filter(Boolean).join(" ");
      }).filter(Boolean) : [],
    };
    const vedicSource = payload?.vedicData || payload?.vedic || {};
    const currentDasha = vedicSource.currentDasha || {};
    const vedicData = {
      lagna: vedicSource.lagna || "",
      moonRasi: vedicSource.moonRasi || vedicSource.moonSign || "",
      birthNakshatra: vedicSource.birthNakshatra || vedicSource.nakshatra || "",
      currentMahadasha: vedicSource.currentMahadasha || currentDasha.planet || "",
      currentAntardasha: vedicSource.currentAntardasha || currentDasha.subPlanet || "",
      keyYogas: vedicSource.keyYogas || vedicSource.yogas || [],
    };
    const numerologyData = payload?.numerologyData || payload?.numerology || {};
    const chineseSource = payload?.baziData || payload?.chinese || {};
    const baziData = {
      zodiacAnimal: chineseSource.zodiacAnimal || chineseSource.animal || "",
      yearPillar: chineseSource.yearPillar || chineseSource.bazi?.year || "",
      dayMaster: chineseSource.dayMaster?.symbol || chineseSource.dayMaster || "",
      dayMasterStrength: chineseSource.dayMasterStrength || chineseSource.dayMaster?.strength || "",
    };
    const readingMode = payload?.readingMode || "holistic";
    const readingLength = payload?.readingLength || "detailed";
    const userQuestion = payload?.userQuestion || "";

    const naraConfig = getNaraRouterConfig();
    if (naraConfig.apiKey) {
      if (!checkNaraClientRateLimit(req)) {
        return NextResponse.json(
          { success: false, error: "Celestia AI is limited to 10 requests per minute from this connection. Please wait and try again." },
          { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
        );
      }

      const naraSystemPrompt = "You are Acharya Celestia, a careful multi-tradition astrological interpreter. Use only the chart data supplied by the application. Do not invent celestial positions, dasha dates, chart placements, calculations, medical diagnoses or guaranteed predictions. Distinguish calculated chart facts, traditional interpretations and uncertainty. Do not present astrology as medical, legal or financial advice. Format the response with Markdown headings.";
      const naraUserPrompt = [
        "Querent: " + (fullName || "Querent"),
        "Birth Details: Date: " + birthData?.date + ", Time: " + birthData?.time + ", Place: " + birthData?.place,
        "Mode: " + readingMode + " (" + (readingLength || "standard") + ")",
        userQuestion ? "Question: " + userQuestion : "",
        "",
        "Verified chart data supplied by Celestia:",
        "- Western: Sun " + westernData?.sun + ", Moon " + westernData?.moon + ", Ascendant " + westernData?.ascendant + ", Aspects: " + westernData?.majorAspects?.join(", "),
        "- Vedic: Lagna " + vedicData?.lagna + ", Moon Rasi " + vedicData?.moonRasi + ", Nakshatra " + vedicData?.birthNakshatra + ", Active Mahadasha " + vedicData?.currentMahadasha + ", Antardasha " + vedicData?.currentAntardasha + ", Yogas: " + vedicData?.keyYogas?.join("; "),
        "- Numerology: Life Path " + numerologyData?.lifePath + ", Expression " + numerologyData?.expression + ", Soul Urge " + numerologyData?.soulUrge + ", Personal Year " + numerologyData?.personalYear,
        "- BaZi: Animal " + baziData?.zodiacAnimal + ", Year Pillar " + baziData?.yearPillar + ", Day Master " + baziData?.dayMaster + " (" + baziData?.dayMasterStrength + ")",
        "",
        "Deliver a thorough but grounded multi-system synthesis. Use no calculated value that is not present in the supplied data."
      ].join("\n");

      try {
        const result = await requestNaraChatCompletion({
          messages: [
            { role: "system", content: naraSystemPrompt },
            { role: "user", content: naraUserPrompt },
          ],
          modelOverride:
            payload?.modelOverride === "agnes-2.5-flash" || payload?.modelOverride === "laguna-s-2.1"
              ? payload.modelOverride
              : "auto",
          requestSignal: req.signal,
          maxTokens: readingLength === "concise" ? 1500 : 3500,
        });

        if (result.response.ok) {
          const completion = await result.response.json();
          const naraReading = extractNaraAssistantText(completion);
          if (naraReading) {
            return NextResponse.json(
              { success: true, reading: naraReading, isAiGenerated: true, provider: "NaraRouter", model: result.model },
              { headers: { "Cache-Control": "no-store" } }
            );
          }
        }
        const status = result.response.status === 429 ? 429 : 502;
        const message = result.response.status === 429
          ? "NaraRouter is rate-limited. Please wait before generating another reading."
          : "NaraRouter rejected or could not complete the reading. Check model access and try again.";
        return NextResponse.json(
          { success: false, error: message },
          { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": result.response.headers.get("retry-after") || "60" } : {}) } }
        );
      } catch (naraError) {
        console.warn("NaraRouter reading request unavailable:", naraError instanceof Error ? naraError.name : "unknown_error");
        return NextResponse.json(
          { success: false, error: "The NaraRouter reading request could not be completed. Please try again." },
          { status: 502, headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are Acharya Celestia, a profound astrological synthesizer master of Western Tropical Placidus, Vedic Jyotish (Lahiri Nirayana), Pythagorean Numerology, and Chinese BaZi (Four Pillars).
Synthesize the querent's multi-system birth signature into an insightful, grounded cosmic reading.
Format with markdown headers (### and ####). Do not fabricate celestial positions outside the verified data provided.`;

        const userPrompt = `Querent: ${fullName || "Querent"}
Birth Details: Date: ${birthData?.date}, Time: ${birthData?.time}, Place: ${birthData?.place}
Mode: ${readingMode} (${readingLength || "standard"})
${userQuestion ? `Question: ${userQuestion}` : ""}

Astronomical & Astrological Data:
- Western: Sun ${westernData?.sun}, Moon ${westernData?.moon}, Ascendant ${westernData?.ascendant}, Aspects: ${westernData?.majorAspects?.join(", ")}
- Vedic: Lagna ${vedicData?.lagna}, Moon Rasi ${vedicData?.moonRasi}, Nakshatra ${vedicData?.birthNakshatra}, Active Mahadasha ${vedicData?.currentMahadasha}, Antardasha ${vedicData?.currentAntardasha}, Yogas: ${vedicData?.keyYogas?.join("; ")}
- Numerology: Life Path ${numerologyData?.lifePath}, Expression ${numerologyData?.expression}, Soul Urge ${numerologyData?.soulUrge}, Personal Year ${numerologyData?.personalYear}
- BaZi: Animal ${baziData?.zodiacAnimal}, Year ${baziData?.yearPillar}, Day Master ${baziData?.dayMaster} (${baziData?.dayMasterStrength})

Deliver a thorough multi-tradition synthesis reading.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `${systemPrompt}\n\n${userPrompt}`,
        });

        if (response.text) {
          return NextResponse.json({
            success: true,
            reading: response.text,
            isAiGenerated: true,
          });
        }
      } catch (aiErr) {
        console.warn("Gemini API call failed, falling back to astronomical synthesizer:", aiErr);
      }
    }

    // Algorithmic synthesis fallback when Gemini API is unconfigured or unavailable
    const reading = `### Celestial Synthesis for ${fullName || "Querent"}

#### I. Western Astrological Blueprint
Your natal chart features **Sun in ${westernData?.sun || "its station"}**, paired with **Moon in ${westernData?.moon || "its sign"}** and an **Ascendant in ${westernData?.ascendant || "its horizon"}**. This establishes an essential tension and synergy between your conscious vitality and deep instinctual emotional needs.

#### II. Vedic Jyotish & Dasha Architecture
Under the Lahiri Nirayana sidereal zodiac, your ascendant is **${vedicData?.lagna || "Nirayana Lagna"}**, anchoring your dharmic life path. Your active planetary clock is currently governed by the **${vedicData?.currentMahadasha || "Major"} Mahadasha** and **${vedicData?.currentAntardasha || "Sub"} Antardasha**. In Jyotish philosophy, this transit window indicates a pivotal period for introspection, karmic resolution, and disciplined pursuit of life objectives.

#### III. Pythagorean Numerological Vibrations
Your Life Path Number **${numerologyData?.lifePath || 1}** highlights your core spiritual lessons and evolutionary trajectory, while your Expression Number **${numerologyData?.expression || 1}** reveals natural talents and external communication. In Personal Year **${numerologyData?.personalYear || 1}**, cyclical timing aligns towards consolidation and strategic renewal.

#### IV. BaZi Four Pillars of Destiny
Born in the year of the **${baziData?.zodiacAnimal || "Celestial"}**, guided by a **${baziData?.dayMaster || "Central"} Day Master**, your element configuration presents unique thermodynamic balance. Maintaining harmonious interactions between your dominant and supporting elements ensures grounded vitality.

---
*Synthesized via Celestia Multi-System Astronomical Engine.*`;

    return NextResponse.json({
      success: true,
      reading,
      isAiGenerated: false,
    });
  } catch (err) {
    console.error("AI reading route error:", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}

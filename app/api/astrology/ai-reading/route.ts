import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      fullName,
      birthData,
      westernData,
      vedicData,
      numerologyData,
      baziData,
      readingMode,
      readingLength,
      userQuestion,
    } = payload;

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

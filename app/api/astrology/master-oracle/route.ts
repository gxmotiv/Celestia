import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { question, systemContext, profileData } = payload;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are Acharya Celestia, Master Astrological Oracle.
Consult on the querent's question strictly utilizing the verified astronomical and astrological signature provided.
Tradition Context: ${systemContext || "holistic multi-system"}.
Provide focused, wise, and grounded astrological guidance. Include active Dasha influence and remedies if relevant.`;

        const userPrompt = `Querent: ${profileData?.name || "Querent"}
Question: ${question}
Profile Coordinates & Chart:
- Lagna: ${profileData?.lagna}, Moon: ${profileData?.moonRasi}, Nakshatra: ${profileData?.nakshatra}
- Active Dasha: ${profileData?.mahadasha} Mahadasha / ${profileData?.antardasha} Antardasha
- Western Sun: ${profileData?.westernSun}, Moon: ${profileData?.westernMoon}, Asc: ${profileData?.westernAsc}
- Numerology Life Path: ${profileData?.numerology?.lifePath}, Personal Year: ${profileData?.numerology?.personalYear}
- BaZi: Animal ${profileData?.bazi?.zodiacAnimal}, Day Master ${profileData?.bazi?.dayMaster}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `${systemPrompt}\n\n${userPrompt}`,
        });

        if (response.text) {
          return NextResponse.json({
            success: true,
            reply: response.text,
            isAiGenerated: true,
          });
        }
      } catch (aiErr) {
        console.warn("Master Oracle Gemini API error, using algorithmic fallback:", aiErr);
      }
    }

    // Algorithmic astrological response
    const reply = `### Guidance from Acharya Celestia

Regarding your inquiry: *"生 ${question} "*

Under your current **${profileData?.mahadasha || "Jupiter"} Mahadasha** and **${profileData?.antardasha || "Saturn"} Antardasha**, your chart emphasizes conscious discernment and measured action. With your **${profileData?.westernSun || "Sun"}** disposition aligned with **Life Path ${profileData?.numerology?.lifePath || 1}**, maintain patience and prioritize deliberate structural progress rather than hasty initiatives.`;

    return NextResponse.json({
      success: true,
      reply,
      isAiGenerated: false,
    });
  } catch (err) {
    console.error("Master oracle route error:", err);
    return NextResponse.json({ error: "Failed to consult oracle" }, { status: 500 });
  }
}

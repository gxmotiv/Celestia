import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { checkNaraClientRateLimit, extractNaraAssistantText, getNaraRouterConfig, NaraGatewayError, requestNaraChatCompletion, validateNaraMessages } from "@/lib/ai/nararouter";

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > 3_500_000) {
      return NextResponse.json({ success: false, error: "AI request is too large." }, { status: 413 });
    }
    const rawBody = await req.text();
    if (rawBody.length > 3_500_000) {
      return NextResponse.json({ success: false, error: "AI request is too large." }, { status: 413 });
    }
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ success: false, error: "Request body must be a JSON object." }, { status: 400 });
    }
    const question = payload.question || payload.query || "";
    const context = payload.context && typeof payload.context === "object" ? payload.context : {};
    const systemContext = payload.systemContext || context || "holistic multi-system";
    const profileData = payload.profileData || {
      name: payload.seekerName || "Querent",
      birthDate: payload.birthDate || "",
      birthTime: payload.birthTime || "",
      location: payload.location || "",
      lagna: context.vedic?.lagnaRasi || "",
      moonRasi: context.vedic?.moonRasi || "",
      nakshatra: context.vedic?.nakshatra || "",
      mahadasha: context.vedic?.activeMahadasha || "",
      antardasha: context.vedic?.activeAntardasha || "",
      westernSun: context.western?.sunSign || "",
      westernMoon: context.western?.moonSign || "",
      westernAsc: context.western?.ascendantSign || "",
      numerology: context.numerology || {},
      bazi: context.bazi || {},
    };

    const naraConfig = getNaraRouterConfig();
    const imageDataUrl = typeof payload?.imageDataUrl === "string" ? payload.imageDataUrl : "";
    if (naraConfig.apiKey) {
      if (!checkNaraClientRateLimit(req)) {
        return NextResponse.json(
          { success: false, error: "Celestia AI is limited to 10 requests per minute from this connection. Please wait and try again." },
          { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
        );
      }

      if (payload?.modelOverride !== undefined && !["auto", "agnes-2.5-flash", "laguna-s-2.1"].includes(payload.modelOverride)) {
        return NextResponse.json({ success: false, error: "Unsupported model override." }, { status: 400 });
      }
      const modelOverride = payload?.modelOverride || "auto";
      const systemPrompt = "You are Acharya Celestia, a careful multi-system astrology research assistant. Use the supplied chart profile as data, not as unquestionable truth. Separate calculated placements from traditional interpretations, never invent chart facts or dates, and state uncertainty. Astrology is interpretive and is not medical, legal or financial advice. Do not claim to execute terminal commands or run code; provide code and debugging guidance only.";
      const contextText = JSON.stringify({ systemContext: systemContext || "holistic multi-system", profileData: profileData || {} });
      const history = Array.isArray(payload?.conversationHistory)
        ? payload.conversationHistory.slice(-6).map((item: { sender?: string; text?: string }) => ({
            role: item.sender === "oracle" ? "assistant" as const : "user" as const,
            content: typeof item.text === "string" ? item.text.slice(0, 6000) : "",
          })).filter((item: { content: string }) => item.content.length > 0)
        : [];
      const userPrompt = "Querent: " + (profileData?.name || "Querent") + "\nQuestion: " + String(question || "") + "\n\nVerified chart context (JSON): " + contextText;
      const userContent = imageDataUrl
        ? [
            { type: "text" as const, text: userPrompt },
            { type: "image_url" as const, image_url: { url: imageDataUrl, detail: "auto" as const } },
          ]
        : userPrompt;

      try {
        if (imageDataUrl && modelOverride === "laguna-s-2.1") {
          return NextResponse.json({ success: false, error: "Images require Auto or Agnes Vision. Select a vision-capable model or switch back to Auto." }, { status: 400 });
        }
        const messages = validateNaraMessages([
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userContent },
        ]);
        const result = await requestNaraChatCompletion({
          messages,
          modelOverride,
          stream: payload?.stream === true,
          requestSignal: req.signal,
          maxTokens: 3072,
        });

        if (!result.response.ok) {
          const status = result.response.status === 429 ? 429 : 502;
          const message = result.response.status === 429
            ? "NaraRouter is rate-limited. Please wait before trying again."
            : "NaraRouter could not complete this request. Check model access and try again.";
          return NextResponse.json({ success: false, error: message }, {
            status,
            headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": result.response.headers.get("retry-after") || "60" } : {}) },
          });
        }

        if (payload?.stream === true) {
          if (!result.response.body) {
            return NextResponse.json({ success: false, error: "NaraRouter returned an empty stream." }, { status: 502 });
          }
          return new Response(result.response.body, {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no",
              "X-Celestia-AI-Model": result.model,
            },
          });
        }

        const completion = await result.response.json();
        const reply = extractNaraAssistantText(completion);
        if (reply) {
          return NextResponse.json({ success: true, reply, isAiGenerated: true, provider: "NaraRouter", model: result.model }, { headers: { "Cache-Control": "no-store" } });
        }
        throw new NaraGatewayError("The AI provider returned an empty response.", 502, "empty_response");
      } catch (naraError) {
        if (naraError instanceof NaraGatewayError) {
          return NextResponse.json({ success: false, error: naraError.message, code: naraError.code }, { status: naraError.status });
        }
        console.warn("NaraRouter oracle request failed:", naraError instanceof Error ? naraError.name : "unknown_error");
        return NextResponse.json({ success: false, error: "The AI gateway could not complete this request. Please try again." }, { status: 502 });
      }
    }

    if (imageDataUrl) {
      return NextResponse.json({ success: false, error: "Vision is not configured yet. Add the NaraRouter server secret to enable image analysis." }, { status: 503 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (payload?.stream === true && !naraConfig.apiKey) {
      // Gemini fallback remains non-streaming until its separate stream adapter is configured.
    }


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

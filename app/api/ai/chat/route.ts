import { NextRequest, NextResponse } from "next/server";
import {
  checkNaraClientRateLimit,
  NaraGatewayError,
  requestNaraChatCompletion,
  validateNaraMessages,
} from "@/lib/ai/nararouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 3_500_000) {
    return NextResponse.json({ error: { message: "Request is too large." } }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: { message: "Could not read request body." } }, { status: 400 });
  }
  if (rawBody.length > 3_500_000) {
    return NextResponse.json({ error: { message: "Request is too large." } }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid_body");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: { message: "Request body must be valid JSON." } }, { status: 400 });
  }

  if (!checkNaraClientRateLimit(request)) {
    return NextResponse.json(
      { error: { message: "Celestia AI is limited to 10 requests per minute from this connection. Please wait and try again." } },
      { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
    );
  }

  try {
    const messages = validateNaraMessages(body.messages);
    const modelOverride =
      body.model === "agnes-2.5-flash" || body.model === "laguna-s-2.1"
        ? body.model
        : body.model === "auto" || body.model === undefined
          ? "auto"
          : (() => { throw new NaraGatewayError("Choose Auto, Agnes Vision, or Laguna Code.", 400, "invalid_model"); })();
    const stream = body.stream === true;

    const result = await requestNaraChatCompletion({
      messages,
      modelOverride,
      stream,
      requestSignal: request.signal,
      temperature: typeof body.temperature === "number" ? body.temperature : undefined,
      maxTokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
    });

    if (!result.response.ok) {
      const status = result.response.status === 429 ? 429 : 502;
      const message =
        result.response.status === 429
          ? "NaraRouter rate limit reached. Please wait before sending another request."
          : result.response.status >= 500
            ? "NaraRouter is temporarily unavailable. Please try again."
            : "NaraRouter rejected this request. Check the selected model and input.";
      return NextResponse.json(
        { error: { message, code: result.response.status === 429 ? "upstream_rate_limited" : "upstream_error" } },
        { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": result.response.headers.get("retry-after") || "60" } : {}) } }
      );
    }

    if (stream) {
      if (!result.response.body) {
        return NextResponse.json({ error: { message: "The AI provider returned an empty stream." } }, { status: 502 });
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

    const data = await result.response.json();
    return NextResponse.json(
      { ...data, provider: "NaraRouter", selected_model: result.model },
      { headers: { "Cache-Control": "no-store", "X-Celestia-AI-Model": result.model } }
    );
  } catch (error) {
    if (error instanceof NaraGatewayError) {
      return NextResponse.json(
        { error: { message: error.message, code: error.code } },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      );
    }
    console.error("Celestia NaraRouter route failed:", error instanceof Error ? error.name : "unknown_error");
    return NextResponse.json(
      { error: { message: "The AI request could not be completed. Please try again." } },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prepareConsultationRoute } from "@/lib/consultation/consultationService";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const question = typeof payload?.question === "string" ? payload.question.trim() : "";

    if (!question) {
      return NextResponse.json({ error: "A question is required." }, { status: 400 });
    }
    if (question.length > 2000) {
      return NextResponse.json({ error: "Question must be 2,000 characters or fewer." }, { status: 413 });
    }

    // Routing only: no provider, calculator, or external request is invoked here.
    return NextResponse.json({
      success: true,
      ...prepareConsultationRoute(question),
    });
  } catch {
    return NextResponse.json({ error: "Invalid consultation routing request." }, { status: 400 });
  }
}

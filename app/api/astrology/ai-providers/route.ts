import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      providers: {
        pollinations: Boolean(process.env.POLLINATIONS_API_KEY?.trim()),
        freemodel: Boolean(process.env.FREEMODEL_API_KEY?.trim()),
        nararouter: Boolean(process.env.NARAROUTER_API_KEY?.trim()),
        openrouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
      },
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

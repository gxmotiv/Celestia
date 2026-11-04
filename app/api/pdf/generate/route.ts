import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userData, western, vedic, numerology, chinese } = await req.json();
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(22).fillColor("#1e293b").text("CELESTIA ASTROLOGICAL DOSSIER", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).fillColor("#0f172a").text(`Subject: ${userData?.fullName || "Querent"}`);
    doc.fontSize(10).fillColor("#475569").text(`Date & Time: ${userData?.birthDate || "N/A"} ${userData?.birthTime || ""} | Location: ${userData?.cityName || ""}, ${userData?.country || ""}`);
    doc.moveDown();

    if (western) {
      doc.fontSize(13).fillColor("#0369a1").text("1. Western Tropical Placidus Analysis");
      doc.fontSize(10).fillColor("#334155").text(`Sun: ${western.sun?.sign || "N/A"} | Moon: ${western.moon?.sign || "N/A"} | Ascendant: ${western.ascendant?.sign || "N/A"} | Midheaven: ${western.midheaven?.sign || "N/A"}`);
      doc.moveDown();
    }

    if (vedic) {
      doc.fontSize(13).fillColor("#b45309").text("2. Vedic Lahiri Nirayana Analysis");
      doc.fontSize(10).fillColor("#334155").text(`Lagna: ${vedic.lagna?.rasiName || "N/A"} | Moon Rasi: ${vedic.moonSignRasi?.rasiName || "N/A"} | Nakshatra: ${vedic.birthNakshatra?.nakshatra || "N/A"} (Pada ${vedic.birthNakshatra?.pada || 1})`);
      if (vedic.currentDasha) {
        doc.fontSize(10).fillColor("#475569").text(`Active Dasha: ${vedic.currentDasha.planet || ""} Mahadasha / ${vedic.currentDasha.subPlanet || ""} Antardasha`);
      }
      doc.moveDown();
    }

    if (numerology) {
      doc.fontSize(13).fillColor("#4338ca").text("3. Pythagorean Numerological Vibrations");
      doc.fontSize(10).fillColor("#334155").text(`Life Path Number: ${numerology.lifePath?.lifePathNumber || "N/A"} | Expression Number: ${numerology.expression?.expressionNumber || "N/A"} | Soul Urge: ${numerology.soulUrge?.soulUrgeNumber || "N/A"}`);
      doc.moveDown();
    }

    if (chinese) {
      doc.fontSize(13).fillColor("#be123c").text("4. BaZi Four Pillars of Destiny");
      doc.fontSize(10).fillColor("#334155").text(`Zodiac Animal: ${chinese.animal || "N/A"} | Day Master: ${chinese.dayMaster?.symbol || "N/A"} (${chinese.dayMaster?.strength || "Balanced"})`);
      doc.moveDown();
    }

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(userData?.fullName || "Celestia").replace(/\s+/g, "_")}_Dossier.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}

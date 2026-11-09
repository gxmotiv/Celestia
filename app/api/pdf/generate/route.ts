import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function textValue(value: unknown, fallback = "N/A", maxLength = 180): string {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const text = String(value).replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return text ? text.slice(0, maxLength) : fallback;
}

function numberValue(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "N/A";
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, color: string) {
  doc.moveDown(0.7);
  doc.fontSize(13).fillColor(color).text(title);
  doc.moveDown(0.25);
}

function bodyText(doc: PDFKit.PDFDocument, value: string) {
  doc.fontSize(9.5).fillColor("#334155").text(value, { lineGap: 2 });
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > 1_000_000) {
      return NextResponse.json({ error: "PDF input is too large." }, { status: 413 });
    }

    const rawBody = await req.text();
    if (rawBody.length > 1_000_000) {
      return NextResponse.json({ error: "PDF input is too large." }, { status: 413 });
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const payload = asRecord(parsedBody);
    const userData = asRecord(payload.userData);
    const western = asRecord(payload.western);
    const vedic = asRecord(payload.vedic);
    const numerology = asRecord(payload.numerology);
    const chinese = asRecord(payload.chinese);

    const westernPlanets = Array.isArray(western.planets) ? western.planets.map(asRecord) : [];
    const westernHouses = Array.isArray(western.houses) ? western.houses.map(asRecord) : [];
    const vedicLagna = asRecord(vedic.lagna);
    const vedicPlanets = Array.isArray(vedic.planets) ? vedic.planets.map(asRecord) : [];
    const dayMaster = asRecord(chinese.dayMaster);
    const yearPillar = asRecord(chinese.yearPillar);
    const monthPillar = asRecord(chinese.monthPillar);
    const dayPillar = asRecord(chinese.dayPillar);
    const hourPillar = asRecord(chinese.hourPillar);
    const elementsBalance = asRecord(chinese.elementsBalance);

    const fullName = textValue(userData.fullName, "Querent", 100);
    const safeFileName = fullName
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 70) || "Celestia";

    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    doc.fontSize(22).fillColor("#1e293b").text("CELESTIA ASTROLOGICAL DOSSIER", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#64748b").text("Multi-system natal chart summary", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).fillColor("#0f172a").text("Subject: " + fullName);
    bodyText(
      doc,
      "Birth: " +
        textValue(userData.birthDate) +
        " " +
        textValue(userData.birthTime) +
        " | Place: " +
        textValue(userData.cityName) +
        ", " +
        textValue(userData.country)
    );
    bodyText(
      doc,
      "Coordinates: " +
        numberValue(userData.latitude) +
        ", " +
        numberValue(userData.longitude) +
        " | Supplied UTC offset: " +
        numberValue(userData.timezoneOffset) +
        " hours"
    );

    if (westernPlanets.length > 0 || Object.keys(asRecord(western.ascendant)).length > 0) {
      sectionTitle(doc, "1. WESTERN TROPICAL CHART", "#0369a1");
      const planetByName = new Map(
        westernPlanets.map((planet) => [textValue(planet.name, ""), planet])
      );
      const sun = planetByName.get("Sun");
      const moon = planetByName.get("Moon");
      const ascendant = asRecord(western.ascendant);
      const midheaven = asRecord(western.midheaven);
      bodyText(
        doc,
        "House system: " +
          textValue(western.houseSystem, textValue(userData.houseSystem)) +
          " | Sun: " +
          textValue(sun?.signDegreeFormatted, textValue(sun?.sign)) +
          " | Moon: " +
          textValue(moon?.signDegreeFormatted, textValue(moon?.sign))
      );
      bodyText(
        doc,
        "Ascendant: " +
          textValue(ascendant.signDegreeFormatted, textValue(ascendant.sign)) +
          " | Midheaven: " +
          textValue(midheaven.signDegreeFormatted, textValue(midheaven.sign))
      );
      if (westernPlanets.length > 0) {
        doc.moveDown(0.25);
        doc.fontSize(9).fillColor("#0f172a").text("Planetary longitudes");
        westernPlanets.forEach((planet) => {
          bodyText(
            doc,
            textValue(planet.name, "Planet") +
              ": " +
              textValue(planet.signDegreeFormatted, textValue(planet.sign)) +
              " | House " +
              textValue(planet.house)
          );
        });
      }
      if (westernHouses.length > 0) {
        doc.moveDown(0.25);
        doc.fontSize(9).fillColor("#0f172a").text("House cusps");
        bodyText(
          doc,
          westernHouses
            .sort((a, b) => Number(a.house) - Number(b.house))
            .map((house) => "H" + textValue(house.house) + " " + textValue(house.signDegreeFormatted, textValue(house.sign)))
            .join(" · ")
        );
      }
    }

    if (Object.keys(vedic).length > 0) {
      sectionTitle(doc, "2. VEDIC JYOTISH", "#b45309");
      bodyText(
        doc,
        "Lagna: " +
          textValue(vedicLagna.rasiName) +
          " | Moon Rasi: " +
          textValue(vedic.moonSignRasi) +
          " | Janma Nakshatra: " +
          textValue(vedic.birthNakshatra) +
          " (Pada " +
          textValue(vedic.birthPada) +
          ")"
      );
      bodyText(
        doc,
        "Ayanamsa: " +
          textValue(vedic.ayanamsaFormatted) +
          " | Current Dasha: " +
          textValue(vedic.currentMahadasha) +
          " / " +
          textValue(vedic.currentAntardasha)
      );
      if (vedicPlanets.length > 0) {
        doc.moveDown(0.25);
        doc.fontSize(9).fillColor("#0f172a").text("Sidereal planetary placements");
        vedicPlanets.forEach((planet) => {
          bodyText(
            doc,
            textValue(planet.name, "Planet") +
              ": " +
              textValue(planet.rasiDegreeFormatted, textValue(planet.rasiName)) +
              " | Nakshatra " +
              textValue(planet.nakshatraName) +
              " Pada " +
              textValue(planet.pada)
          );
        });
      }
    }

    if (Object.keys(numerology).length > 0) {
      sectionTitle(doc, "3. PYTHAGOREAN NUMEROLOGY", "#4338ca");
      bodyText(
        doc,
        "Life Path: " +
          textValue(numerology.lifePathNumber) +
          " | Expression: " +
          textValue(numerology.expressionNumber) +
          " | Soul Urge: " +
          textValue(numerology.soulUrgeNumber) +
          " | Personality: " +
          textValue(numerology.personalityNumber)
      );
      bodyText(
        doc,
        "Birthday: " +
          textValue(numerology.birthdayNumber) +
          " | Maturity: " +
          textValue(numerology.maturityNumber) +
          " | Personal Year: " +
          textValue(numerology.personalYearNumber)
      );
    }

    if (Object.keys(chinese).length > 0) {
      sectionTitle(doc, "4. BAZI FOUR PILLARS", "#be123c");
      bodyText(
        doc,
        "Zodiac animal: " +
          textValue(chinese.zodiacAnimal) +
          " | Day Master: " +
          textValue(dayMaster.symbol) +
          " (" +
          textValue(dayMaster.nature) +
          ") | Strength: " +
          textValue(dayMaster.strength)
      );
      [yearPillar, monthPillar, dayPillar, hourPillar].forEach((pillar, index) => {
        const label = ["Year", "Month", "Day", "Hour"][index];
        bodyText(doc, label + " Pillar: " + textValue(pillar.combinedName));
      });
      bodyText(
        doc,
        "Five-element balance — Wood: " +
          numberValue(elementsBalance.Wood) +
          ", Fire: " +
          numberValue(elementsBalance.Fire) +
          ", Earth: " +
          numberValue(elementsBalance.Earth) +
          ", Metal: " +
          numberValue(elementsBalance.Metal) +
          ", Water: " +
          numberValue(elementsBalance.Water)
      );
    }

    doc.moveDown(0.8);
    doc.fontSize(8).fillColor("#64748b").text(
      "Method note: this report prints values supplied by Celestia's chart calculations. Astrological and numerological interpretations are traditional or symbolic frameworks, not independently certified scientific predictions or medical assessments.",
      { lineGap: 2 }
    );

    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + safeFileName + '_Dossier.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}

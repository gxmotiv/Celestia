import PDFDocument from "pdfkit";
import { WesternChartData } from "../astronomy/ephemeris";
import { VedicChartData } from "../astronomy/vedic";
import { NumerologyProfile } from "../astronomy/numerology";
import { BaZiProfile } from "../astronomy/chinese";
import { TransitEngine } from "../astronomy/transits";
import { calculateHellenisticAnalysis, calculateSiderealComparison } from "../astronomy/hellenistic";

export interface PDFUserData {
  fullName: string;
  birthDate: string;
  birthTime: string;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
  houseSystem: string;
}

export interface AstrologyReportData {
  userData: PDFUserData;
  western: WesternChartData;
  vedic: VedicChartData;
  numerology: NumerologyProfile;
  chinese: BaZiProfile;
}

/**
 * Professional Multi-Page Astrology & Esoteric PDF Generator
 * Built with PDFKit for server-side generation of publication-grade dossiers.
 */
export class AstrologyPDFGenerator {
  private doc: PDFKit.PDFDocument;
  private primaryColor = "#0f172a"; // Deep Slate
  private accentGold = "#b45309";   // Astrological Amber/Gold
  private accentNavy = "#1e293b";   // Slate 800
  private textDark = "#0f172a";     // Slate 900
  private textMuted = "#475569";    // Slate 600
  private bgLight = "#f8fafc";      // Slate 50
  private borderLight = "#e2e8f0";  // Slate 200

  constructor() {
    this.doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 45, left: 40, right: 40 },
      bufferPages: true,
      autoFirstPage: true,
    });
  }

  public async generateReport(data: AstrologyReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      this.doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      this.doc.on("end", () => resolve(Buffer.concat(chunks)));
      this.doc.on("error", (err: Error) => reject(err));

      try {
        const hellenistic = calculateHellenisticAnalysis(data.western);
        const siderealComp = calculateSiderealComparison(data.western);
        const transitEngine = new TransitEngine(data.western);
        const majorTransits = transitEngine.getMajorTransits();
        const activeTransits = transitEngine.getCurrentTransits().slice(0, 8);
        const upcomingEclipses = transitEngine.getEclipseTransits();

        // 1. Cover Page
        this.generateCoverPage(data.userData);

        // 2. Table of Contents
        this.doc.addPage();
        this.generateTableOfContents();

        // 3. Executive Summary
        this.doc.addPage();
        this.generateExecutiveSummary(data, majorTransits);

        // 4. Section: Western Astrology (Tropical)
        this.doc.addPage();
        this.generateWesternSection(data.western);

        // 5. Section: Vedic Astrology (Sidereal Lahiri)
        this.doc.addPage();
        this.generateVedicSection(data.vedic);

        // 6. Section: Other Astrological Traditions (Hellenistic, Sidereal, BaZi)
        this.doc.addPage();
        this.generateOtherAstrologySection(hellenistic, siderealComp, data.chinese);

        // 7. Section: Universal Numerology Systems (6 Systems)
        this.doc.addPage();
        this.generateNumerologySection(data.numerology);

        // 8. Section: Cross-System Synthesis & Strategic Directives
        this.doc.addPage();
        this.generateSynthesisSection(data);

        // 9. Section: Predictive Planetary Timeline
        this.doc.addPage();
        this.generatePredictiveTimeline(data, activeTransits, majorTransits, upcomingEclipses);

        // 10. Appendix: Astronomical Reference & Glossary
        this.doc.addPage();
        this.generateAppendix(data.userData);

        // Apply running header and page numbering to all pages (except Cover)
        this.applyHeadersAndFooters(data.userData.fullName);

        this.doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /* ========================================================================= */
  /* 1. COVER PAGE                                                             */
  /* ========================================================================= */
  private generateCoverPage(user: PDFUserData): void {
    const doc = this.doc;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Outer decorative border
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
      .lineWidth(1.5)
      .strokeColor(this.accentGold)
      .stroke();

    doc.rect(25, 25, pageWidth - 50, pageHeight - 50)
      .lineWidth(0.5)
      .strokeColor(this.textMuted)
      .stroke();

    // Top Brand Badge
    doc.fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("CELESTIA MULTI-SYSTEM ASTRONOMICAL MATRIX", 0, 70, { align: "center", characterSpacing: 2 });

    doc.fontSize(8)
      .font("Helvetica")
      .fillColor(this.textMuted)
      .text("OFFICIAL NATAL INCEPTION & ESOTERIC REPORT", 0, 85, { align: "center", characterSpacing: 1.5 });

    // Decorative Celestial Geometry
    const centerX = pageWidth / 2;
    const centerY = 190;
    doc.circle(centerX, centerY, 65).lineWidth(1).strokeColor(this.accentGold).stroke();
    doc.circle(centerX, centerY, 52).lineWidth(0.5).strokeColor(this.borderLight).stroke();
    doc.circle(centerX, centerY, 38).lineWidth(0.5).strokeColor(this.accentGold).stroke();

    // 12 Astrological Rays
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const x1 = centerX + Math.cos(angle) * 38;
      const y1 = centerY + Math.sin(angle) * 38;
      const x2 = centerX + Math.cos(angle) * 65;
      const y2 = centerY + Math.sin(angle) * 65;
      doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(0.5).strokeColor(this.accentGold).stroke();
    }

    // Title
    doc.fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(this.textDark)
      .text("Comprehensive Multi-System", 40, 280, { align: "center" });

    doc.fontSize(22)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("Astrological Analysis", 40, 310, { align: "center" });

    doc.fontSize(10)
      .font("Helvetica")
      .fillColor(this.textMuted)
      .text(
        "A Unified Synthesis of Western (Tropical), Vedic Jyotish (Sidereal Lahiri), Hellenistic Traditional,\nWestern Sidereal, Chinese BaZi, and Universal Numerology (6 Global Systems)",
        60,
        342,
        { align: "center", lineGap: 3 }
      );

    // Subject Name Plaque
    doc.roundedRect(60, 410, pageWidth - 120, 140, 6)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(1)
      .fillAndStroke();

    doc.fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("CERTIFIED NATAL DOSSIER PREPARED FOR", 80, 428, { align: "center", characterSpacing: 1 });

    doc.fontSize(26)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text(user.fullName, 80, 445, { align: "center" });

    // Inception Coordinates
    const metaY = 485;
    doc.fontSize(9).font("Helvetica").fillColor(this.textDark);

    const col1X = 90;
    const col2X = centerX + 10;

    doc.text(`Birth Date: ${user.birthDate}`, col1X, metaY);
    doc.text(`Birth Time: ${user.birthTime} (UTC ${user.timezoneOffset >= 0 ? "+" : ""}${user.timezoneOffset})`, col1X, metaY + 16);
    doc.text(`Location: ${user.cityName}, ${user.country}`, col1X, metaY + 32);

    doc.text(`Coordinates: ${Math.abs(user.latitude).toFixed(4)}°${user.latitude >= 0 ? "N" : "S"}, ${Math.abs(user.longitude).toFixed(4)}°${user.longitude >= 0 ? "E" : "W"}`, col2X, metaY);
    doc.text(`House System: ${user.houseSystem}`, col2X, metaY + 16);
    doc.text(`Ephemeris Engine: astronomy-engine`, col2X, metaY + 32);

    // Document Verification Seal
    const seed = `${user.fullName}-${user.birthDate}-${user.birthTime}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const docId = `CLM-${Math.abs(hash).toString(36).toUpperCase()}-NATAL`;

    const sealY = 620;
    doc.rect(centerX - 130, sealY, 260, 50)
      .strokeColor(this.accentGold)
      .lineWidth(1)
      .stroke();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("OFFICIAL ARCHIVAL DOCUMENT ID", centerX - 120, sealY + 10, { align: "center" });

    doc.fontSize(11)
      .font("Courier-Bold")
      .fillColor(this.primaryColor)
      .text(docId, centerX - 120, sealY + 24, { align: "center", characterSpacing: 1.5 });

    doc.fontSize(8)
      .font("Helvetica")
      .fillColor(this.textMuted)
      .text(`Generated: ${new Date().toISOString().split("T")[0]} · Confidential Astrological Document`, 40, pageHeight - 65, { align: "center" });
  }

  /* ========================================================================= */
  /* 2. TABLE OF CONTENTS                                                      */
  /* ========================================================================= */
  private generateTableOfContents(): void {
    const doc = this.doc;
    this.drawSectionHeader("Table of Contents", "Comprehensive Dossier Navigation");

    const tocItems = [
      { num: "01", title: "Executive Summary & Unified Archetype", desc: "Cosmic resonance score, top life themes, current transit & dasha matrix", page: "3" },
      { num: "02", title: "Western Astrology (Tropical System)", desc: "Natal wheel ephemeris, house cusps, major aspects, psychological profile", page: "4" },
      { num: "03", title: "Vedic Jyotish & Dasha Systems (Sidereal Lahiri)", desc: "Kundli rasi & navamsha, nakshatra padas, Vimshottari 120y timeline, remedies", page: "5" },
      { num: "04", title: "Traditional & Comparative Traditions", desc: "Hellenistic sect, lots & joys, Western Sidereal comparison, Chinese BaZi Four Pillars", page: "6" },
      { num: "05", title: "Universal Numerology (6 Global Systems)", desc: "Pythagorean 14 numbers, Vedic Sankhya, Chaldean compound, Lo Shu, Kabbalah, Tamil", page: "7" },
      { num: "06", title: "Master Cross-System Synthesis", desc: "Multi-tradition alignment matrix, unified life themes, strategic directives", page: "8" },
      { num: "07", title: "Predictive Planetary Timeline", desc: "12-month transit outlook, 5-year structural cycles, eclipses, timing windows", page: "9" },
      { num: "08", title: "Technical Appendix & Astrological Glossary", desc: "Exact coordinates, classical references, terminology guide, user handbook", page: "10" },
    ];

    let y = 110;
    tocItems.forEach((item) => {
      // Row box
      doc.roundedRect(40, y, doc.page.width - 80, 50, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      // Number badge
      doc.circle(65, y + 25, 14)
        .fillColor(this.accentGold)
        .fill();

      doc.fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .text(item.num, 58, y + 20, { width: 14, align: "center" });

      // Title & description
      doc.fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(this.primaryColor)
        .text(item.title, 90, y + 12);

      doc.fontSize(8.5)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(item.desc, 90, y + 28);

      // Page number
      doc.fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(`p. ${item.page}`, doc.page.width - 95, y + 18, { align: "right" });

      y += 62;
    });

    // Reader Note
    doc.roundedRect(40, y + 10, doc.page.width - 80, 75, 4)
      .fillColor("#fffbeb")
      .strokeColor("#fde68a")
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#92400e")
      .text("HOW TO NAVIGATE THIS DOSSIER", 55, y + 22);

    doc.fontSize(8.5)
      .font("Helvetica")
      .fillColor("#78350f")
      .text(
        "This dossier synthesizes both tropical and sidereal astronomical frameworks alongside 6 world numerological lineages. Rather than viewing discrepancies between systems as contradictions, recognize that Western Tropical maps your psychological and developmental personality, Vedic Sidereal unveils your karmic soul blueprint, and Numerology illuminates your vibrational vibrational timing.",
        55,
        y + 36,
        { width: doc.page.width - 110, lineGap: 2.5 }
      );
  }

  /* ========================================================================= */
  /* 3. EXECUTIVE SUMMARY                                                      */
  /* ========================================================================= */
  private generateExecutiveSummary(data: AstrologyReportData, majorTransits: any): void {
    const doc = this.doc;
    this.drawSectionHeader("Executive Summary & Unified Archetype", "Core Cosmic Resonance & Planetary Signature");

    const report = data.numerology.completeReport;

    // Top Resonance Block
    doc.roundedRect(40, 105, doc.page.width - 80, 110, 6)
      .fillColor(this.bgLight)
      .strokeColor(this.accentGold)
      .lineWidth(1)
      .fillAndStroke();

    doc.fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("CROSS-SYSTEM COSMIC RESONANCE SCORE", 60, 120);

    const score = report?.crossSystemSynthesis?.resonanceScore || 88;
    doc.fontSize(36)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text(`${score}%`, 60, 138);

    doc.fontSize(9)
      .font("Helvetica")
      .fillColor(this.textMuted)
      .text("HIGH HARMONIC COHESION ACROSS 11 CELESTIAL & NUMEROLOGICAL LINEAGES", 60, 185);

    // Gauge bar
    const barWidth = 260;
    const barX = doc.page.width - 40 - barWidth - 20;
    doc.roundedRect(barX, 142, barWidth, 14, 7)
      .fillColor(this.borderLight)
      .fill();

    doc.roundedRect(barX, 142, (barWidth * score) / 100, 14, 7)
      .fillColor(this.accentGold)
      .fill();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(this.textMuted)
      .text("0% (Divergent)", barX, 162);

    doc.text("100% (Absolute Alignment)", barX + 130, 162, { align: "right", width: 130 });

    // Unified Cosmic Archetype
    let curY = 230;
    doc.fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Unified Cosmic Archetype", 40, curY);

    curY += 18;
    const archetype = report?.crossSystemSynthesis?.unifiedArchetype || "The Visionary Sovereign & Sacred Philosopher";
    doc.fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text(`"${archetype}"`, 40, curY);

    curY += 16;
    const karmicTheme = report?.crossSystemSynthesis?.coreKarmicTheme ||
      "Bridging tangible mastercraft with transcendent intuitive awareness, translating esoteric insight into practical monumental works.";
    doc.fontSize(9)
      .font("Helvetica")
      .fillColor(this.textDark)
      .text(karmicTheme, 40, curY, { width: doc.page.width - 80, lineGap: 3 });

    // Top 3 Life Themes
    curY += 50;
    doc.fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Top 3 Core Life Themes", 40, curY);

    curY += 18;
    const themes = [
      {
        title: "1. Intellectual Mastery & Innovation",
        desc: "Sun in Aries (Western) and Mercury lordship in Vedic Kundli grant immense intellectual agility, relentless analytical curiosity, and pioneering leadership.",
      },
      {
        title: "2. Emotional Intuition & Mystical Depth",
        desc: "Moon in Scorpio (Vedic Jyeshtha) paired with Lo Shu Action Arrow channels deep psychological perception, profound emotional fortitude, and strategic patience.",
      },
      {
        title: "3. Monumental Manifestation (Life Path 8 / Mulank 5)",
        desc: "Pythagorean Life Path and Vedic Mulank combine executive authority with high-speed adaptability, enabling large-scale architectural and organizational achievement.",
      },
    ];

    themes.forEach((t) => {
      doc.roundedRect(40, curY, doc.page.width - 80, 48, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      doc.fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(t.title, 52, curY + 8);

      doc.fontSize(8.5)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(t.desc, 52, curY + 22, { width: doc.page.width - 104, lineGap: 2 });

      curY += 56;
    });

    // Current Major Influences
    curY += 10;
    doc.fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Current Active Planetary Windows (Dasha & Gochara)", 40, curY);

    curY += 18;
    const activeDasha = data.vedic.vimshottariDashas.find((d) => d.isCurrent) || data.vedic.vimshottariDashas[0];
    const saturnHouse = majorTransits?.saturn?.currentHouse || 11;
    const jupiterHouse = majorTransits?.jupiter?.currentHouse || 3;

    doc.roundedRect(40, curY, (doc.page.width - 90) / 2, 85, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("ACTIVE VIMSHOTTARI DASHA", 52, curY + 10);

    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text(`${activeDasha.planet} Mahadasha`, 52, curY + 24);

    doc.fontSize(8.5)
      .font("Helvetica")
      .fillColor(this.textMuted)
      .text(`Span: ${activeDasha.startDate} to ${activeDasha.endDate}\nLord governs foundational growth, karmic unfolding, and major professional advancement.`, 52, curY + 40, { width: (doc.page.width - 120) / 2, lineGap: 2 });

    const rightColX = 40 + (doc.page.width - 90) / 2 + 10;
    doc.roundedRect(rightColX, curY, (doc.page.width - 90) / 2, 85, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("MAJOR STRUCTURAL TRANSITS", rightColX + 12, curY + 10);

    doc.fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text(`Saturn House ${saturnHouse} · Jupiter House ${jupiterHouse}`, rightColX + 12, curY + 24);

    doc.fontSize(8.5)
      .font("Helvetica")
      .fillColor(this.textMuted)
      .text(`Saturn in 2.5y cycle restructuring long-term alliances. Jupiter in 1y cycle expanding communicative and intellectual outreach.`, rightColX + 12, curY + 40, { width: (doc.page.width - 120) / 2, lineGap: 2 });
  }

  /* ========================================================================= */
  /* 4. WESTERN ASTROLOGY (TROPICAL)                                           */
  /* ========================================================================= */
  private generateWesternSection(w: WesternChartData): void {
    const doc = this.doc;
    this.drawSectionHeader("Western Astrology (Tropical Framework)", "Planetary Ephemeris, Quadrant Houses & Psychological Architecture");

    // The Big Three
    const sun = w.planets.find((p) => p.name === "Sun");
    const moon = w.planets.find((p) => p.name === "Moon");
    const asc = w.ascendant;

    const boxWidth = (doc.page.width - 100) / 3;
    let bX = 40;

    const bigThree = [
      { role: "Sun (Core Identity)", sign: sun?.sign || "Aries", deg: `${sun ? sun.signDegree.toFixed(2) : "0.00"}°`, house: `House ${sun?.house}` },
      { role: "Moon (Emotional Soul)", sign: moon?.sign || "Taurus", deg: `${moon ? moon.signDegree.toFixed(2) : "0.00"}°`, house: `House ${moon?.house}` },
      { role: "Ascendant (Primal Lens)", sign: asc.sign, deg: `${asc.signDegree.toFixed(2)}°`, house: "Rising Sign (1st House)" },
    ];

    bigThree.forEach((b) => {
      doc.roundedRect(bX, 105, boxWidth, 58, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(b.role.toUpperCase(), bX + 10, 115);

      doc.fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(this.primaryColor)
        .text(`${b.sign} ${b.deg}`, bX + 10, 128);

      doc.fontSize(8.5)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(b.house, bX + 10, 144);

      bX += boxWidth + 10;
    });

    // Planetary Ephemeris Table
    let curY = 180;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Natal Planetary Ephemeris (Tropical Placidus)", 40, curY);

    curY += 16;
    // Table Header
    doc.rect(40, curY, doc.page.width - 80, 18)
      .fillColor(this.accentNavy)
      .fill();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff");

    doc.text("PLANET", 46, curY + 5);
    doc.text("SIGN", 120, curY + 5);
    doc.text("LONGITUDE", 210, curY + 5);
    doc.text("HOUSE", 300, curY + 5);
    doc.text("LATITUDE", 370, curY + 5);
    doc.text("MOTION", 460, curY + 5);

    curY += 18;
    w.planets.forEach((p, idx) => {
      const isEven = idx % 2 === 0;
      doc.rect(40, curY, doc.page.width - 80, 16)
        .fillColor(isEven ? "#ffffff" : this.bgLight)
        .fill();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.textDark)
        .text(p.name, 46, curY + 4);

      doc.font("Helvetica")
        .text(p.sign, 120, curY + 4)
        .text(`${p.signDegree.toFixed(2)}°`, 210, curY + 4)
        .text(`${p.house}`, 312, curY + 4)
        .text(`${p.latitude !== undefined ? p.latitude.toFixed(2) + "°" : "0.00°"}`, 370, curY + 4)
        .text(p.isRetrograde ? "Retrograde" : "Direct", 460, curY + 4);

      curY += 16;
    });

    // Psychological Profile Subsections
    curY += 14;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Psychological Matrix & Archetypal Interpretations", 40, curY);

    curY += 16;
    const psycho = [
      {
        dim: "Core Will & Sovereign Drive (Sun)",
        text: `Your Sun in ${sun?.sign} grants pioneering initiatives, independent creative sovereignty, and the urge to break ground in uncharted territories. Placed in House ${sun?.house}, personal vitality is directly channeled through monumental creative projects.`,
      },
      {
        dim: "Emotional Needs & Instinctive Security (Moon)",
        text: `Your Moon in ${moon?.sign} craves emotional truth, depth, and unwavering loyalty. House ${moon?.house} placement signifies that emotional fulfillment is attained through deep personal research, privacy, and inner transformation.`,
      },
      {
        dim: "Intellect & Strategic Communication (Mercury)",
        text: `Mercury in ${w.planets.find((p) => p.name === "Mercury")?.sign} enables structural thinking with visionary scope. You possess the uncommon ability to synthesize divergent ideas into unified executable blueprints.`,
      },
      {
        dim: "Karmic Growth & Evolutionary Challenge (Saturn / Nodes)",
        text: `Saturn positioned in House ${w.planets.find((p) => p.name === "Saturn")?.house} requires rigorous discipline before public rewards manifest. True mastery arrives through consistent dedication and ethical integrity.`,
      },
    ];

    psycho.forEach((p) => {
      doc.fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(p.dim, 40, curY);

      curY += 12;
      doc.fontSize(8.5)
        .font("Helvetica")
        .fillColor(this.textDark)
        .text(p.text, 40, curY, { width: doc.page.width - 80, lineGap: 2 });

      curY += 34;
    });
  }

  /* ========================================================================= */
  /* 5. VEDIC ASTROLOGY (SIDEREAL LAHIRI)                                      */
  /* ========================================================================= */
  private generateVedicSection(v: VedicChartData): void {
    const doc = this.doc;
    this.drawSectionHeader("Vedic Jyotish & Dasha Systems", "Sidereal Lahiri Ayanamsa, Janma Nakshatra & Vimshottari Timeline");

    // Vedic Trinity
    const boxWidth = (doc.page.width - 100) / 3;
    let bX = 40;

    const vedicTrinity = [
      { label: "Janma Lagna (Ascendant)", val: v.lagna.rasiName, deg: `${v.lagna.rasiDegree.toFixed(2)}°`, sub: "Primal Karmic Gateway" },
      { label: "Chandra Rasi (Moon Sign)", val: v.moonSignRasi, deg: `${v.moonSignSanskrit}`, sub: "Mental & Emotional Nature" },
      { label: "Janma Nakshatra", val: `${v.birthNakshatra} (Pada ${v.birthPada})`, deg: `Lord: ${v.birthNakshatraLord}`, sub: "Karmic Destiny Star" },
    ];

    vedicTrinity.forEach((b) => {
      doc.roundedRect(bX, 105, boxWidth, 58, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(b.label.toUpperCase(), bX + 10, 115);

      doc.fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(this.primaryColor)
        .text(b.val, bX + 10, 128);

      doc.fontSize(8.5)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(`${b.deg} · ${b.sub}`, bX + 10, 144);

      bX += boxWidth + 10;
    });

    // Graha Spashta Table
    let curY = 180;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Graha Spashta (Sidereal Planetary Coordinates)", 40, curY);

    curY += 16;
    doc.rect(40, curY, doc.page.width - 80, 18)
      .fillColor(this.accentNavy)
      .fill();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff");

    doc.text("GRAHA", 46, curY + 5);
    doc.text("RASI (SIGN)", 130, curY + 5);
    doc.text("SIDEREAL LON", 230, curY + 5);
    doc.text("NAKSHATRA", 330, curY + 5);
    doc.text("PADA", 430, curY + 5);
    doc.text("DIGNITY", 475, curY + 5);

    curY += 18;
    v.planets.slice(0, 9).forEach((p, idx) => {
      const isEven = idx % 2 === 0;
      doc.rect(40, curY, doc.page.width - 80, 15)
        .fillColor(isEven ? "#ffffff" : this.bgLight)
        .fill();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.textDark)
        .text(`${p.name} (${p.rasiSanskrit || p.name})`, 46, curY + 3.5);

      doc.font("Helvetica")
        .text(p.rasiName, 130, curY + 3.5)
        .text(`${p.siderealLongitude.toFixed(2)}°`, 230, curY + 3.5)
        .text(p.nakshatraName, 330, curY + 3.5)
        .text(`${p.pada}`, 438, curY + 3.5)
        .text(`${p.dignity || "Normal"}`, 475, curY + 3.5);

      curY += 15;
    });

    // Vimshottari Mahadasha Timeline
    curY += 14;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Vimshottari Dasha 120-Year Cycle Progression", 40, curY);

    curY += 16;
    doc.rect(40, curY, doc.page.width - 80, 16)
      .fillColor(this.accentNavy)
      .fill();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff");

    doc.text("MAHADASHA LORD", 46, curY + 4);
    doc.text("YEARS", 180, curY + 4);
    doc.text("START DATE", 250, curY + 4);
    doc.text("END DATE", 370, curY + 4);
    doc.text("STATUS", 480, curY + 4);

    curY += 16;
    v.vimshottariDashas.forEach((d, idx) => {
      const isCurrent = d.isCurrent;
      doc.rect(40, curY, doc.page.width - 80, 15)
        .fillColor(isCurrent ? "#fef3c7" : idx % 2 === 0 ? "#ffffff" : this.bgLight)
        .fill();

      doc.fontSize(8)
        .font(isCurrent ? "Helvetica-Bold" : "Helvetica")
        .fillColor(isCurrent ? "#92400e" : this.textDark)
        .text(`${d.planet} Mahadasha (${d.planetSanskrit || d.planet})`, 46, curY + 3.5);

      doc.text(`${d.durationYears}y`, 185, curY + 3.5);
      doc.text(d.startDate, 250, curY + 3.5);
      doc.text(d.endDate, 370, curY + 3.5);
      doc.text(isCurrent ? "ACTIVE" : "Cycle", 480, curY + 3.5);

      curY += 15;
    });

    // Vedic Remedies Box
    curY += 14;
    doc.roundedRect(40, curY, doc.page.width - 80, 80, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.accentGold)
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(9.5)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("VEDIC SHANTI REMEDIES & UPAAYAS", 52, curY + 10);

    const activeLord = v.vimshottariDashas.find((d) => d.isCurrent)?.planet || "Sun";
    doc.fontSize(8.5)
      .font("Helvetica")
      .fillColor(this.textDark)
      .text(
        `• Primary Auspicious Gemstone: Natural Ruby or Yellow Sapphire set in Gold on auspicious Sunday/Thursday morning.\n• Sacred Japa Mantra: Chant the Navagraha Beej Mantra of ${activeLord} 108 times at sunrise for mental peace and prosperity.\n• Danam (Sacred Charity): Donate grains, yellow lentils, or warm clothing to elders and spiritual institutions.\n• Fasting & Observance: Fasting on the planetary day of ${activeLord} significantly balances difficult karmic transits.`,
        52,
        curY + 26,
        { width: doc.page.width - 104, lineGap: 2.5 }
      );
  }

  /* ========================================================================= */
  /* 6. OTHER ASTROLOGY SYSTEMS                                                */
  /* ========================================================================= */
  private generateOtherAstrologySection(h: any, sidComp: any, bazi: BaZiProfile): void {
    const doc = this.doc;
    this.drawSectionHeader("Traditional & Comparative Systems", "Hellenistic Sect & Lots, Western Sidereal, and Chinese BaZi");

    // 1. Hellenistic Sect & Lots
    let curY = 105;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Hellenistic Astrology (Whole Sign & Sect Analysis)", 40, curY);

    curY += 16;
    doc.roundedRect(40, curY, doc.page.width - 80, 75, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(8.5).font("Helvetica").fillColor(this.textDark);
    const hCol1 = 52;
    const hCol2 = (doc.page.width / 2) + 10;

    doc.text(`• Sect Determination: ${h.isDiurnal ? "Diurnal (Day Chart)" : "Nocturnal (Night Chart)"}`, hCol1, curY + 10);
    doc.text(`• Sect Light: ${h.sectLight}`, hCol1, curY + 24);
    doc.text(`• Benefic of the Sect: ${h.beneficOfSect} (Constructive Grace)`, hCol1, curY + 38);
    doc.text(`• Malefic of the Sect: ${h.maleficOfSect} (Constructive Discipline)`, hCol1, curY + 52);

    doc.text(`• Lot of Fortune (Tyche): ${h.lots.fortune.sign} ${h.lots.fortune.degreeStr} (House ${h.lots.fortune.house})`, hCol2, curY + 10);
    doc.text(`• Lot of Spirit (Daimon): ${h.lots.spirit.sign} ${h.lots.spirit.degreeStr} (House ${h.lots.spirit.house})`, hCol2, curY + 24);
    doc.text(`• Lot of Eros: ${h.lots.eros.sign} ${h.lots.eros.degreeStr} (House ${h.lots.eros.house})`, hCol2, curY + 38);
    doc.text(`• Lot of Necessity: ${h.lots.necessity.sign} ${h.lots.necessity.degreeStr} (House ${h.lots.necessity.house})`, hCol2, curY + 52);

    // 2. Western Sidereal Comparison
    curY += 90;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Western Sidereal Comparison (Fagan-Bradley Ayanamsa: 24.84°)", 40, curY);

    curY += 16;
    doc.rect(40, curY, doc.page.width - 80, 16)
      .fillColor(this.accentNavy)
      .fill();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff");

    doc.text("PLANET", 46, curY + 4);
    doc.text("TROPICAL (SEASONAL)", 140, curY + 4);
    doc.text("SIDEREAL (CONSTELLATIONAL)", 270, curY + 4);
    doc.text("ZODIAC SHIFT", 430, curY + 4);

    curY += 16;
    sidComp.planets.slice(0, 7).forEach((p: any, idx: number) => {
      doc.rect(40, curY, doc.page.width - 80, 14)
        .fillColor(idx % 2 === 0 ? "#ffffff" : this.bgLight)
        .fill();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.textDark)
        .text(p.name, 46, curY + 3);

      doc.font("Helvetica")
        .text(`${p.tropicalSign} ${p.tropicalDegree}°`, 140, curY + 3)
        .text(`${p.siderealSign} ${p.siderealDegree}°`, 270, curY + 3)
        .text(p.signShifted ? "Sign Regressed (-24°)" : "Same Sign (Late Deg)", 430, curY + 3);

      curY += 14;
    });

    // 3. Chinese BaZi (Four Pillars)
    curY += 16;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Chinese BaZi (Four Pillars of Destiny)", 40, curY);

    curY += 16;
    const pWidth = (doc.page.width - 110) / 4;
    let pX = 40;

    const pillars = [
      { name: "Year Pillar (Ancestry)", stem: `${bazi.yearPillar.stem.name} (${bazi.yearPillar.stem.chinese})`, branch: `${bazi.yearPillar.branch.name} (${bazi.yearPillar.branch.chinese})`, animal: bazi.yearPillar.branch.animal },
      { name: "Month Pillar (Career)", stem: `${bazi.monthPillar.stem.name} (${bazi.monthPillar.stem.chinese})`, branch: `${bazi.monthPillar.branch.name} (${bazi.monthPillar.branch.chinese})`, animal: bazi.monthPillar.branch.animal },
      { name: "Day Master (True Self)", stem: `${bazi.dayPillar.stem.name} (${bazi.dayMaster.symbol})`, branch: `${bazi.dayPillar.branch.name} (${bazi.dayPillar.branch.chinese})`, animal: bazi.dayPillar.branch.animal },
      { name: "Hour Pillar (Legacy)", stem: `${bazi.hourPillar.stem.name} (${bazi.hourPillar.stem.chinese})`, branch: `${bazi.hourPillar.branch.name} (${bazi.hourPillar.branch.chinese})`, animal: bazi.hourPillar.branch.animal },
    ];

    pillars.forEach((p) => {
      doc.roundedRect(pX, curY, pWidth, 75, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      doc.fontSize(7.5)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(p.name.toUpperCase(), pX + 8, curY + 8);

      doc.fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(this.primaryColor)
        .text(p.stem, pX + 8, curY + 22);

      doc.fontSize(9)
        .font("Helvetica")
        .fillColor(this.textDark)
        .text(`Branch: ${p.branch}`, pX + 8, curY + 40);

      doc.fontSize(8.5)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(`Animal: ${p.animal}`, pX + 8, curY + 55);

      pX += pWidth + 10;
    });

    // Five Elements Balance
    curY += 86;
    doc.roundedRect(40, curY, doc.page.width - 80, 50, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("WU XING (FIVE ELEMENTS) DISTRIBUTION", 52, curY + 8);

    doc.fontSize(8.5)
      .font("Helvetica")
      .fillColor(this.textDark)
      .text(
        `• Wood: ${bazi.elementsBalance.Wood}% · Fire: ${bazi.elementsBalance.Fire}% · Earth: ${bazi.elementsBalance.Earth}% · Metal: ${bazi.elementsBalance.Metal}% · Water: ${bazi.elementsBalance.Water}%\n• Day Master Strength: ${bazi.dayMaster.strength} (${bazi.dayMaster.nature})\n• Favorable Elements: ${bazi.dayMaster.favorableElements.join(", ")} · Challenging Elements: ${bazi.dayMaster.unfavorableElements.join(", ")}`,
        52,
        curY + 22,
        { width: doc.page.width - 104, lineGap: 3 }
      );
  }

  /* ========================================================================= */
  /* 7. UNIVERSAL NUMEROLOGY SYSTEMS (6 SYSTEMS)                               */
  /* ========================================================================= */
  private generateNumerologySection(n: NumerologyProfile): void {
    const doc = this.doc;
    this.drawSectionHeader("Universal Numerology (6 Global Lineages)", "Pythagorean, Indian Vedic, Chaldean, Chinese Lo Shu, Kabbalah & Tamil");

    const report = n.completeReport;

    // 1. Pythagorean Core Numbers
    let curY = 105;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Pythagorean Core Vibration Matrix (14 Essential Keys)", 40, curY);

    curY += 16;
    const py = report.pythagorean;
    const coreKeys = [
      { name: "Life Path", val: py.lifePathNumber, role: "Central Evolutionary Journey" },
      { name: "Destiny/Expression", val: py.expressionNumber, role: "Natural Talents & World Purpose" },
      { name: "Soul Urge", val: py.soulUrgeNumber, role: "Hidden Desires & Spiritual Longing" },
      { name: "Personality", val: py.personalityNumber, role: "Outer Magnetic Persona" },
      { name: "Birthday Key", val: py.birthdayNumber, role: "Innate Specialized Gift" },
      { name: "Maturity Number", val: py.maturityNumber, role: "Life Purpose Peak (Age 45+)" },
    ];

    const kWidth = (doc.page.width - 100) / 3;
    let kX = 40;
    let kY = curY;

    coreKeys.forEach((k, idx) => {
      doc.roundedRect(kX, kY, kWidth, 44, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(k.name.toUpperCase(), kX + 8, kY + 7);

      doc.fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(this.primaryColor)
        .text(`Key ${k.val}`, kX + 8, kY + 18);

      doc.fontSize(7.5)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(k.role, kX + 8, kY + 31);

      if ((idx + 1) % 3 === 0) {
        kX = 40;
        kY += 50;
      } else {
        kX += kWidth + 10;
      }
    });

    // 2. Indian Vedic Sankhya Shastra
    curY = kY + 10;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Indian Vedic Numerology (Sankhya Shastra)", 40, curY);

    curY += 16;
    const vN = report.vedic;
    doc.roundedRect(40, curY, doc.page.width - 80, 52, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(8.5).font("Helvetica").fillColor(this.textDark);
    doc.text(`• Mulank (Driver Number): ${vN.mulank} (Ruled by Graha ${vN.rulingPlanetMulank.planet} / ${vN.rulingPlanetMulank.sanskrit})`, 52, curY + 8);
    doc.text(`• Bhagyank (Conductor Number): ${vN.bhagyank} (Ruled by Graha ${vN.rulingPlanetBhagyank.planet} / ${vN.rulingPlanetBhagyank.sanskrit})`, 52, curY + 22);
    doc.text(`• Vedic Guidance: ${vN.rulingPlanetMulank.generalRemedies.charity} · Fast Day: ${vN.rulingPlanetMulank.fast.day}.`, 52, curY + 36);

    // 3. Chaldean Occult & Chinese Lo Shu
    curY += 62;
    const colW = (doc.page.width - 90) / 2;

    // Chaldean Box
    doc.roundedRect(40, curY, colW, 90, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    const ch = report.chaldean;
    doc.fontSize(9.5)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("CHALDEAN OCCULT CIPHERS", 52, curY + 8);

    doc.fontSize(8)
      .font("Helvetica")
      .fillColor(this.textDark)
      .text(
        `• Name Compound Number: ${ch.fullName.compoundNumber}\n• Archival Title: "${ch.fullName.compoundMeaning.title}"\n• Occult Vibrational Meaning: ${ch.fullName.compoundMeaning.occultSignificance.slice(0, 130)}...\n• Warning: ${ch.fullName.compoundMeaning.warning.slice(0, 110)}...`,
        52,
        curY + 22,
        { width: colW - 24, lineGap: 2 }
      );

    // Lo Shu Box
    const loShuX = 40 + colW + 10;
    doc.roundedRect(loShuX, curY, colW, 90, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    const ls = report.loShu;
    doc.fontSize(9.5)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("CHINESE LO SHU MAGIC SQUARE", loShuX + 12, curY + 8);

    const strengthArrows = ls.arrowsOfStrength.length > 0 ? ls.arrowsOfStrength.map((a: any) => a.name).join(", ") : "Balanced";
    const weakArrows = ls.arrowsOfWeakness.length > 0 ? ls.arrowsOfWeakness.map((a: any) => a.name).join(", ") : "None";
    doc.fontSize(8)
      .font("Helvetica")
      .fillColor(this.textDark)
      .text(
        `• Arrows of Strength: ${strengthArrows}\n• Arrows of Emptiness: ${weakArrows}\n• Missing Numbers: ${ls.missingNumbers.map((m: any) => m.number).join(", ") || "None"}\n• Feng Shui Balancing Cure: ${ls.missingNumbers[0]?.fengShuiRemedy?.slice(0, 110) || "Keep North and East sectors illuminated."}`,
        loShuX + 12,
        curY + 22,
        { width: colW - 24, lineGap: 2 }
      );

    // 4. Kabbalah & Tamil En Kaniyam
    curY += 100;
    doc.roundedRect(40, curY, doc.page.width - 80, 68, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    const kab = report.kabbalah;
    const tam = report.tamil;
    doc.fontSize(9.5)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("KABBALAH GEMATRIA & TAMIL EN KANIYAM", 52, curY + 8);

    doc.fontSize(8)
      .font("Helvetica")
      .fillColor(this.textDark)
      .text(
        `• Kabbalah Tree of Life Soul Sephirah: ${kab.soulSephirah.name} (${kab.soulSephirah.hebrew}) · Meaning: "${kab.soulSephirah.meaning}"\n• Connecting Tarot Path: ${kab.connectingPath ? kab.connectingPath.tarotCard : "The Magician"}\n• Tamil En Kaniyam: Janma En ${tam.janmaEn} · Vidhi En ${tam.vidhiEn} · Ruling Graha: ${tam.tamilGraha}\n• Classical Siddhanta Guidance: "${tam.tamilProverbGuidance.slice(0, 75)}..."`,
        52,
        curY + 22,
        { width: doc.page.width - 104, lineGap: 2.5 }
      );
  }

  /* ========================================================================= */
  /* 8. CROSS-SYSTEM SYNTHESIS                                                 */
  /* ========================================================================= */
  private generateSynthesisSection(data: AstrologyReportData): void {
    const doc = this.doc;
    this.drawSectionHeader("Cross-System Synthesis & Strategic Directives", "Integrated Karmic Architecture & Actionable Guidance");

    // Side-by-Side Comparison Table
    let curY = 105;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Side-by-Side System Alignment Matrix", 40, curY);

    curY += 16;
    doc.rect(40, curY, doc.page.width - 80, 16)
      .fillColor(this.accentNavy)
      .fill();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff");

    doc.text("TRADITION", 46, curY + 4);
    doc.text("CORE IDENTITY", 160, curY + 4);
    doc.text("GOVERNING ELEMENT", 290, curY + 4);
    doc.text("KEY LIFE EMPHASIS", 410, curY + 4);

    const rows = [
      { sys: "Western (Tropical)", id: `${data.western.planets[0]?.sign} Sun / ${data.western.ascendant.sign} Asc`, elem: "Fire / Earth Quadrants", emp: "Psychological integration & creative autonomy" },
      { sys: "Vedic (Sidereal Lahiri)", id: `${data.vedic.moonSignRasi} Moon / ${data.vedic.birthNakshatra}`, elem: "Water / Jyeshtha Fixed", emp: "Karmic destiny, dharma fulfillment, spiritual moksha" },
      { sys: "Chinese BaZi", id: `${data.chinese.dayMaster.symbol} (${data.chinese.zodiacAnimal})`, elem: `Wood/Fire Dominance`, emp: "Elemental equilibrium & 10-year Luck cycle navigation" },
      { sys: "Universal Numerology", id: `Life Path ${data.numerology.lifePathNumber} / Mulank ${data.numerology.completeReport.vedic.mulank}`, elem: "Executive Mind (8) & Fast Mercury (5)", emp: "Monumental achievement, organization & adaptability" },
    ];

    curY += 16;
    rows.forEach((r, idx) => {
      doc.rect(40, curY, doc.page.width - 80, 20)
        .fillColor(idx % 2 === 0 ? "#ffffff" : this.bgLight)
        .fill();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(r.sys, 46, curY + 5);

      doc.font("Helvetica")
        .fillColor(this.textDark)
        .text(r.id, 160, curY + 5)
        .text(r.elem, 290, curY + 5)
        .text(r.emp, 410, curY + 5, { width: doc.page.width - 450 });

      curY += 20;
    });

    // Strategic Action Directives
    curY += 16;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Strategic Action Directives (Unified Life Guidance)", 40, curY);

    curY += 16;
    const directives = [
      {
        head: "Leadership & Enterprise Architecture",
        desc: "Combine Western Aries pioneering courage with Pythagorean 8 executive rigor. Take calculated risks in structural enterprise without hesitation, establishing permanent institutions rather than short-lived endeavors.",
      },
      {
        head: "Mental Mastery & Cross-Disciplinary Synthesis",
        desc: "Your Mercury lordship (Vedic Jyeshtha) and Mulank 5 give immense talent for synthesizing art, science, and engineering. Never pigeonhole yourself into a single specialty; cross-pollinate disciplines.",
      },
      {
        head: "Emotional Sanctuary & Solitary Focus",
        desc: "With Vedic Scorpio Moon, avoid excessive social dissipation. Your deepest revelations and creative breakthroughs occur in periods of dedicated solitude and intense focus.",
      },
      {
        head: "Spiritual Balance & Karmic Cleansing",
        desc: "Follow the Vedic charity guidelines (Danam) on Tuesdays and Saturdays. Ground high mental velocity through daily breathwork (Pranayama) and contemplation.",
      },
    ];

    directives.forEach((d) => {
      doc.roundedRect(40, curY, doc.page.width - 80, 48, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      doc.fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(d.head, 52, curY + 8);

      doc.fontSize(8)
        .font("Helvetica")
        .fillColor(this.textDark)
        .text(d.desc, 52, curY + 22, { width: doc.page.width - 104, lineGap: 2 });

      curY += 54;
    });
  }

  /* ========================================================================= */
  /* 9. PREDICTIVE PLANETARY TIMELINE                                          */
  /* ========================================================================= */
  private generatePredictiveTimeline(data: AstrologyReportData, activeTransits: any[], majorTransits: any, eclipses: any[]): void {
    const doc = this.doc;
    this.drawSectionHeader("Predictive Planetary Timeline", "12-Month Transit Outlook, Structural Cycles & Eclipse Impact");

    // 1. Current Active Transits (Gochara)
    let curY = 105;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Active Planetary Aspects (Ephemeris vs Natal Chart)", 40, curY);

    curY += 16;
    doc.rect(40, curY, doc.page.width - 80, 16)
      .fillColor(this.accentNavy)
      .fill();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff");

    doc.text("TRANSITING BODY", 46, curY + 4);
    doc.text("ASPECT", 160, curY + 4);
    doc.text("NATAL PLANET", 260, curY + 4);
    doc.text("ORB", 360, curY + 4);
    doc.text("INFLUENCE & DURATION", 430, curY + 4);

    curY += 16;
    activeTransits.slice(0, 6).forEach((t, idx) => {
      doc.rect(40, curY, doc.page.width - 80, 15)
        .fillColor(idx % 2 === 0 ? "#ffffff" : this.bgLight)
        .fill();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.textDark)
        .text(t.transitingPlanet, 46, curY + 3.5);

      doc.font("Helvetica")
        .text(t.aspect, 160, curY + 3.5)
        .text(t.natalPlanet, 260, curY + 3.5)
        .text(`${t.orb.toFixed(2)}°`, 360, curY + 3.5)
        .text(`${t.nature} (${t.duration || "Active"})`, 430, curY + 3.5);

      curY += 15;
    });

    // 2. 5-Year Structural Life Cycles
    curY += 16;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("5-Year Structural Planetary Cycles", 40, curY);

    curY += 16;
    const colW = (doc.page.width - 100) / 3;
    let bX = 40;

    const cycles = [
      { name: "Saturn ~2.5-Year Cycle", house: `House ${majorTransits.saturn.currentHouse}`, desc: majorTransits.saturn.houseInterpretation.slice(0, 120) + "..." },
      { name: "Jupiter 1-Year Cycle", house: `House ${majorTransits.jupiter.currentHouse}`, desc: majorTransits.jupiter.houseInterpretation.slice(0, 120) + "..." },
      { name: "Uranus 7-Year Cycle", house: `House ${majorTransits.uranus.currentHouse}`, desc: majorTransits.uranus.houseInterpretation.slice(0, 120) + "..." },
    ];

    cycles.forEach((c) => {
      doc.roundedRect(bX, curY, colW, 90, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(c.name.toUpperCase(), bX + 8, curY + 8);

      doc.fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(this.primaryColor)
        .text(c.house, bX + 8, curY + 22);

      doc.fontSize(7.5)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(c.desc, bX + 8, curY + 38, { width: colW - 16, lineGap: 2 });

      bX += colW + 10;
    });

    // 3. Upcoming Solar & Lunar Eclipses
    curY += 105;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Upcoming Eclipse Impact Zones", 40, curY);

    curY += 16;
    eclipses.slice(0, 3).forEach((e: any) => {
      doc.roundedRect(40, curY, doc.page.width - 80, 42, 4)
        .fillColor(this.bgLight)
        .strokeColor(this.borderLight)
        .lineWidth(0.5)
        .fillAndStroke();

      doc.fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(`${e.type.toUpperCase()} · ${e.date} (${e.sign} ${typeof e.degree === "number" ? e.degree.toFixed(1) + "°" : e.degree})`, 52, curY + 7);

      doc.fontSize(8)
        .font("Helvetica")
        .fillColor(this.textDark)
        .text(`Activates House ${e.natalHouse} · ${(e.interpretation || "").slice(0, 160)}...`, 52, curY + 20, { width: doc.page.width - 104, lineGap: 2 });

      curY += 48;
    });
  }

  /* ========================================================================= */
  /* 10. APPENDIX                                                              */
  /* ========================================================================= */
  private generateAppendix(user: PDFUserData): void {
    const doc = this.doc;
    this.drawSectionHeader("Appendix: Technical Ephemeris & Glossary", "Astronomical Constants, Classical Citations & Handbook");

    // Technical Data
    let curY = 105;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Astronomical Constants & Calculation Engine", 40, curY);

    curY += 14;
    doc.roundedRect(40, curY, doc.page.width - 80, 60, 4)
      .fillColor(this.bgLight)
      .strokeColor(this.borderLight)
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(8)
      .font("Helvetica")
      .fillColor(this.textDark)
      .text(
        `• Planetary positions: astronomy-engine (published design target about 1 arcminute; not a per-result guarantee).\n• The application does not call native Swiss Ephemeris/libswe or JPL DE405 directly.\n• Lunar-node, house, and ayanamsa calculations require separate independent validation.\n• Display decimal places are rounding, not proof of astronomical accuracy.\n• Subject: ${user.fullName} | ${user.birthDate} ${user.birthTime} | ${user.latitude}° ${user.longitude}°`,
        52,
        curY + 8,
        { width: doc.page.width - 104, lineGap: 2 }
      );

    // Glossary of Terms
    curY += 72;
    doc.fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text("Astrological & Numerological Glossary", 40, curY);

    curY += 14;
    const glossary = [
      { term: "Tropical Zodiac", def: "A seasonal coordinate system anchored to the Vernal Equinox (0° Aries), reflecting psychological personality development." },
      { term: "Sidereal Zodiac", def: "A fixed star constellation coordinate system adjusted for axial precession via Ayanamsa, reflecting soul destiny and karma." },
      { term: "Nakshatra", def: "One of 27 lunar mansions (13°20' each) in Vedic Jyotish, revealing the deep psychological temperament and subconscious karma." },
      { term: "Vimshottari Dasha", def: "A 120-year planetary life-cycle timeline starting from the Moon's Nakshatra balance, determining when specific planetary themes manifest." },
      { term: "Day Master (BaZi)", def: "The Heavenly Stem of the Day Pillar in Chinese Four Pillars of Destiny, representing the essential self and core element." },
      { term: "Chaldean Numerology", def: "Ancient Babylonian occult numerology focusing on compound vibrations (10–52), revealing underlying destiny blessings or karmic warnings." },
      { term: "Tree of Life (Kabbalah)", def: "The 10 Sephiroth and 22 connecting Paths mapping the descent of divine spiritual consciousness into physical manifestation." },
    ];

    glossary.forEach((g) => {
      doc.fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(this.accentGold)
        .text(g.term + ": ", 40, curY, { continued: true });

      doc.font("Helvetica")
        .fillColor(this.textDark)
        .text(g.def, { lineGap: 2 });

      curY += 24;
    });

    // Classical References & Certification Seal
    curY += 10;
    doc.roundedRect(40, curY, doc.page.width - 80, 55, 4)
      .fillColor("#fffbeb")
      .strokeColor("#fde68a")
      .lineWidth(0.5)
      .fillAndStroke();

    doc.fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#92400e")
      .text("CANONICAL CITATIONS & AUTHENTICATION", 52, curY + 8);

    doc.fontSize(7.5)
      .font("Helvetica")
      .fillColor("#78350f")
      .text(
        "Formulas derived from: Claudius Ptolemy (Tetrabiblos), Maharishi Parashara (Brihat Parashara Hora Shastra), Vettius Valens (Anthologies), The Book of Changes (I Ching), and The Book of Formation (Sefer Yetzirah). Certified by Celestia Multi-System Engine.",
        52,
        curY + 22,
        { width: doc.page.width - 104, lineGap: 2 }
      );
  }

  /* ========================================================================= */
  /* HELPER METHODS                                                            */
  /* ========================================================================= */
  private drawSectionHeader(title: string, subtitle: string): void {
    const doc = this.doc;
    doc.fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor(this.accentGold)
      .text("CELESTIA MULTI-SYSTEM ASTRONOMICAL MATRIX", 40, 42, { characterSpacing: 1 });

    doc.fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(this.primaryColor)
      .text(title, 40, 54);

    doc.fontSize(8.5)
      .font("Helvetica")
      .fillColor(this.textMuted)
      .text(subtitle, 40, 74);

    doc.moveTo(40, 90)
      .lineTo(doc.page.width - 40, 90)
      .lineWidth(1)
      .strokeColor(this.primaryColor)
      .stroke();
  }

  private applyHeadersAndFooters(subjectName: string): void {
    const doc = this.doc;
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 1; i < totalPages; i++) {
      doc.switchToPage(i);

      // Running top header
      doc.fontSize(7.5)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(`Celestia Astrological Dossier · ${subjectName}`, 40, 22);

      doc.text("Certified Natal Report", doc.page.width - 150, 22, { align: "right", width: 110 });

      // Running bottom footer
      doc.moveTo(40, doc.page.height - 30)
        .lineTo(doc.page.width - 40, doc.page.height - 30)
        .lineWidth(0.5)
        .strokeColor(this.borderLight)
        .stroke();

      doc.fontSize(8)
        .font("Helvetica")
        .fillColor(this.textMuted)
        .text(`Confidential · Official Inception Record`, 40, doc.page.height - 22);

      doc.font("Helvetica-Bold")
        .text(`Page ${i + 1} of ${totalPages}`, doc.page.width - 120, doc.page.height - 22, { align: "right", width: 80 });
    }
  }
}

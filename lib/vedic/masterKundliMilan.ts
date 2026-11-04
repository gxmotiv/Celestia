/**
 * Master Vedic Relationship & Kundli Milan Orchestrator
 * Integrates:
 * 1. Classical Ashtakoota (36 Gunas) & Kuja (Manglik) Dosha with cancellations
 * 2. Navamsa (D9) Soulmate Synergy
 * 3. Dasakoota / Ekadasakoota (Rajju, Vedha, Mahendra, Stree Deergha)
 * 4. Papa Samya (Malefic Balance from Lagna, Moon, Venus)
 * 5. Dasha Sandhi & Vimshottari Timeline Synchronization
 * 6. Jaimini Upapada Lagna & Dara Karaka Synergy
 * 7. 7th House Ashtakavarga Bindu Stability
 */

import { VedicChartData } from "../astronomy/vedic";
import { KundliMilanEngine, KundliMilanReport } from "./kundliMilanEngine";
import { DasakootaEngine, DasakootaReport } from "./dasakootaEngine";
import { PapaSamyaEngine, PapaSamyaComparison } from "./papaSamyaEngine";
import { DashaSandhiEngine, DashaSandhiReport } from "./dashaSandhiEngine";
import { JaiminiRelationshipEngine, JaiminiRelationshipReport } from "./jaiminiRelationshipEngine";

export interface MasterKundliReport {
  person1Name: string;
  person2Name: string;
  masterIndex: number; // 0 - 100 Comprehensive composite score
  masterGrade: "A+" | "A" | "B" | "C";
  masterVerdict:
    | "Parama Uttama (Supreme Master Union)"
    | "Uttama (Highly Auspicious Match)"
    | "Madhyama (Balanced with Minor Adjustments)"
    | "Karmic / Requires Shanti Observance";
  masterSummary: string;
  
  // Core Sub-Systems
  ashtakootaReport: KundliMilanReport;
  dasakootaReport: DasakootaReport;
  papaSamyaReport: PapaSamyaComparison;
  dashaSandhiReport: DashaSandhiReport;
  jaiminiReport: JaiminiRelationshipReport;

  // Master Executive Highlights
  criticalVetoes: string[];
  auspiciousYogas: string[];
  unifiedRemedies: {
    category: "Ritual / Puja" | "Mantra / Japa" | "Charity / Lifestyle" | "Gemstone / Yantra";
    title: string;
    description: string;
  }[];
}

export class MasterKundliMilanOrchestrator {
  public static evaluateMaster(
    chart1: VedicChartData,
    chart2: VedicChartData,
    person1Name: string,
    person2Name: string,
    gender1: "male" | "female" | "other" | string = "male",
    gender2: "male" | "female" | "other" | string = "female"
  ): MasterKundliReport {
    // 1. Calculate classical Ashtakoota & Manglik
    const ashtakootaReport = KundliMilanEngine.calculateMilan(
      chart1,
      chart2,
      person1Name,
      person2Name,
      gender1,
      gender2
    );

    // 2. Calculate Dasakoota (Rajju & Vedha)
    const dasakootaReport = DasakootaEngine.evaluate(
      chart1,
      chart2,
      gender1,
      gender2
    );

    // 3. Calculate Papa Samya
    const papaSamyaReport = PapaSamyaEngine.compare(
      chart1,
      chart2,
      person1Name,
      person2Name
    );

    // 4. Calculate Dasha Sandhi
    const dashaSandhiReport = DashaSandhiEngine.evaluate(
      chart1,
      chart2,
      person1Name,
      person2Name
    );

    // 5. Calculate Jaimini & Ashtakavarga
    const jaiminiReport = JaiminiRelationshipEngine.evaluate(
      chart1,
      chart2,
      person1Name,
      person2Name
    );

    // 6. Compute Master Compatibility Index (0 - 100)
    // Ashtakoota contribution: 35%
    const ashtakootaNormalized = (ashtakootaReport.totalGunas / 36) * 100;
    
    // Dasakoota contribution: 20% (vetoes can drop score)
    let dasakootaScore = 80;
    if (dasakootaReport.vetoAlerts.length === 0) dasakootaScore = 100;
    else if (dasakootaReport.rajju.isCancelled) dasakootaScore = 75;
    else dasakootaScore = 40;

    // Papa Samya contribution: 15%
    let papaScore = 85;
    if (papaSamyaReport.balanceStatus.includes("Balanced")) papaScore = 100;
    else if (papaSamyaReport.balanceStatus.includes("Mild")) papaScore = 75;
    else papaScore = 50;

    // Dasha Sandhi contribution: 15%
    let sandhiScore = 80;
    if (dashaSandhiReport.verdict.includes("Safe")) sandhiScore = 95;
    else if (dashaSandhiReport.verdict.includes("Moderate")) sandhiScore = 70;
    else sandhiScore = 45;

    // Jaimini & SAV contribution: 15%
    const jaiminiScore = jaiminiReport.overallJaiminiScore;

    // Weighted composite calculation
    const rawMasterIndex =
      ashtakootaNormalized * 0.35 +
      dasakootaScore * 0.20 +
      papaScore * 0.15 +
      sandhiScore * 0.15 +
      jaiminiScore * 0.15;

    const masterIndex = Math.min(100, Math.max(0, Math.round(rawMasterIndex)));

    // Determine Master Grade & Verdict
    let masterGrade: MasterKundliReport["masterGrade"] = "B";
    let masterVerdict: MasterKundliReport["masterVerdict"] = "Madhyama (Balanced with Minor Adjustments)";

    if (masterIndex >= 84 && dasakootaReport.vetoAlerts.length === 0) {
      masterGrade = "A+";
      masterVerdict = "Parama Uttama (Supreme Master Union)";
    } else if (masterIndex >= 72) {
      masterGrade = "A";
      masterVerdict = "Uttama (Highly Auspicious Match)";
    } else if (masterIndex >= 55) {
      masterGrade = "B";
      masterVerdict = "Madhyama (Balanced with Minor Adjustments)";
    } else {
      masterGrade = "C";
      masterVerdict = "Karmic / Requires Shanti Observance";
    }

    // Consolidate critical vetoes and alerts
    const criticalVetoes: string[] = [];
    if (dasakootaReport.rajju.isAfflicted) {
      criticalVetoes.push(`Active Rajju Dosha (${dasakootaReport.rajju.groomRajju}) requires traditional Shanti.`);
    }
    if (dasakootaReport.vedha.isVedhaPresent) {
      criticalVetoes.push(`Vedha piercing star friction present (${dasakootaReport.vedha.afflictedPair}).`);
    }
    if (ashtakootaReport.manglikAnalysis.person1.finalStatus === "Manglik (Active)" && ashtakootaReport.manglikAnalysis.person2.finalStatus === "Non-Manglik") {
      criticalVetoes.push(`Unilateral Kuja (Manglik) Dosha for ${person1Name}.`);
    }
    if (ashtakootaReport.manglikAnalysis.person2.finalStatus === "Manglik (Active)" && ashtakootaReport.manglikAnalysis.person1.finalStatus === "Non-Manglik") {
      criticalVetoes.push(`Unilateral Kuja (Manglik) Dosha for ${person2Name}.`);
    }
    if (dashaSandhiReport.verdict === "High Dasha Sandhi Alert") {
      criticalVetoes.push("Simultaneous major Mahadasha completion window detected.");
    }

    // Consolidate auspicious yogas
    const auspiciousYogas: string[] = [
      ...dasakootaReport.auspiciousYogas,
      ...(ashtakootaReport.totalGunas >= 24 ? [`High Ashtakoota Guna total of ${ashtakootaReport.totalGunas}/36.`] : []),
      ...(jaiminiReport.ulCompatibility.status.includes("Auspicious") ? ["Favorable Upapada Lagna soulmate recognition."] : []),
      ...(papaSamyaReport.balanceStatus.includes("Balanced") ? ["Balanced Papa Samya creating mutual endurance."] : []),
    ];

    // Build unified remedies
    const unifiedRemedies: MasterKundliReport["unifiedRemedies"] = [
      {
        category: "Ritual / Puja",
        title: "Kalyana Sundareswarar or Uma-Maheshwara Vrata",
        description: "Observing sacred communion rituals dedicated to divine counterparts Shiva and Parvati bestows lifetime conjugal protection, dissolving residual Rajju or Nadi afflictions.",
      },
      {
        category: "Mantra / Japa",
        title: "Maha Mrityunjaya & Vishnu Sahasranama",
        description: "Reciting or listening to the Maha Mrityunjaya Mantra (for vitality and overcoming Sandhi vulnerabilities) and Vishnu Sahasranama (for sustaining marital prosperity).",
      },
      {
        category: "Charity / Lifestyle",
        title: "Anna Daan (Grain & Food Charity)",
        description: "Offering cooked yellow rice or grain offerings on Thursdays and Tuesdays to spiritual seekers or birds balances malefic Papa points and honors Jupiter/Mars.",
      },
      {
        category: "Gemstone / Yantra",
        title: "Subtle Energetic Anchors",
        description: "Wearing yellow sapphire (Pukhraj) or natural pearl after consultation, or placing a consecrated Sri Yantra in the northeast corner of the home.",
      },
    ];

    const masterSummary =
      masterGrade === "A+"
        ? `A rare, superlative Vedic match scored at ${masterIndex}%. Classical Ashtakoota, Dasakoota vitality ropes, and Jaimini Upapada alignments harmonize effortlessly, promising spiritual growth, worldly success, and deep companionship.`
        : masterGrade === "A"
        ? `A highly auspicious union scored at ${masterIndex}%. The charts exhibit robust fundamental compatibility with minor points easily neutralized through mutual respect and classical remedies.`
        : masterGrade === "B"
        ? `A balanced match scored at ${masterIndex}%. While certain areas require patience (such as dasha transitions or malefic points), the positive foundational bonds offer steady partnership.`
        : `A karmic union scored at ${masterIndex}% with sensitive areas requiring conscious communication and traditional Vedic remedial pacifications before major life steps.`;

    return {
      person1Name,
      person2Name,
      masterIndex,
      masterGrade,
      masterVerdict,
      masterSummary,
      ashtakootaReport,
      dasakootaReport,
      papaSamyaReport,
      dashaSandhiReport,
      jaiminiReport,
      criticalVetoes,
      auspiciousYogas,
      unifiedRemedies,
    };
  }
}

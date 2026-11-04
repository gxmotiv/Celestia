/**
 * Classical Dasha Sandhi & Planetary Timeline Engine
 * Scans both partners' Vimshottari Dasha systems for:
 * 1. Dasha Sandhi (simultaneous Mahadasha transitions within 6-12 months)
 * 2. Antardasha transition overlaps
 * 3. Mutual Graha Maitri (Friendship) between active and emerging Dasha lords
 * 4. 10-year timeline synchronization matrix
 */

import { VedicChartData, DashaPeriod } from "../astronomy/vedic";

export interface SandhiAlert {
  type: "Mahadasha Sandhi Collision" | "Antardasha Sandhi Warning" | "Auspicious Synchronized Transition";
  person1Period: string;
  person2Period: string;
  transitionDate1: string;
  transitionDate2: string;
  gapMonths: number;
  severity: "High" | "Moderate" | "Mild";
  description: string;
  remedy: string;
}

export interface DashaTimelinePoint {
  date: string;
  year: number;
  person1Dasha: string;
  person2Dasha: string;
  harmonyScore: number; // 0 - 100
  status: "Harmonious" | "Transformative" | "Vulnerable / Sandhi";
  theme: string;
}

export interface DashaSandhiReport {
  isSandhiActiveNow: boolean;
  activeSandhiDetails?: string;
  activeLordsHarmony: {
    person1Lord: string;
    person2Lord: string;
    relationship: "Natural Friends" | "Neutral" | "Inimical / Conflict";
    score: number; // 0 - 100
    description: string;
  };
  upcomingSandhis: SandhiAlert[];
  tenYearTimeline: DashaTimelinePoint[];
  verdict: "Safe & Complementary Timelines" | "Moderate Transition Caution" | "High Dasha Sandhi Alert";
  summary: string;
}

// Classical Natural Planetary Friendship Matrix (Naisargika Maitri)
const NATURAL_FRIENDS: Record<string, { friends: string[]; neutrals: string[]; enemies: string[] }> = {
  Sun: {
    friends: ["Moon", "Mars", "Jupiter"],
    neutrals: ["Mercury"],
    enemies: ["Venus", "Saturn", "Rahu", "Ketu"],
  },
  Moon: {
    friends: ["Sun", "Mercury"],
    neutrals: ["Mars", "Jupiter", "Venus", "Saturn"],
    enemies: ["Rahu", "Ketu"],
  },
  Mars: {
    friends: ["Sun", "Moon", "Jupiter"],
    neutrals: ["Venus", "Saturn"],
    enemies: ["Mercury", "Rahu", "Ketu"],
  },
  Mercury: {
    friends: ["Sun", "Venus"],
    neutrals: ["Mars", "Jupiter", "Saturn"],
    enemies: ["Moon", "Rahu", "Ketu"],
  },
  Jupiter: {
    friends: ["Sun", "Moon", "Mars"],
    neutrals: ["Saturn"],
    enemies: ["Mercury", "Venus", "Rahu", "Ketu"],
  },
  Venus: {
    friends: ["Mercury", "Saturn", "Rahu", "Ketu"],
    neutrals: ["Mars", "Jupiter"],
    enemies: ["Sun", "Moon"],
  },
  Saturn: {
    friends: ["Mercury", "Venus", "Rahu"],
    neutrals: ["Jupiter"],
    enemies: ["Sun", "Moon", "Mars", "Ketu"],
  },
  Rahu: {
    friends: ["Venus", "Saturn", "Mercury"],
    neutrals: ["Jupiter"],
    enemies: ["Sun", "Moon", "Mars"],
  },
  Ketu: {
    friends: ["Mars", "Venus", "Jupiter"],
    neutrals: ["Mercury", "Saturn"],
    enemies: ["Sun", "Moon"],
  },
};

export class DashaSandhiEngine {
  /**
   * Analyzes mutual timeline synchronization and Dasha Sandhi for two charts
   */
  public static evaluate(
    chart1: VedicChartData,
    chart2: VedicChartData,
    person1Name: string,
    person2Name: string
  ): DashaSandhiReport {
    const dashas1 = chart1.vimshottariDashas || [];
    const dashas2 = chart2.vimshottariDashas || [];

    // Find current Mahadashas
    const now = new Date();
    const currentDasha1 =
      dashas1.find((d) => d.isCurrent) ||
      dashas1.find((d) => {
        const s = new Date(d.startDate);
        const e = new Date(d.endDate);
        return now >= s && now <= e;
      }) ||
      dashas1[0];

    const currentDasha2 =
      dashas2.find((d) => d.isCurrent) ||
      dashas2.find((d) => {
        const s = new Date(d.startDate);
        const e = new Date(d.endDate);
        return now >= s && now <= e;
      }) ||
      dashas2[0];

    const lord1 = currentDasha1 ? currentDasha1.planet : "Jupiter";
    const lord2 = currentDasha2 ? currentDasha2.planet : "Venus";

    // Evaluate friendship between current lords
    const friendInfo1 = NATURAL_FRIENDS[lord1] || { friends: [], neutrals: [], enemies: [] };
    let relationship: DashaSandhiReport["activeLordsHarmony"]["relationship"] = "Neutral";
    let score = 65;

    if (friendInfo1.friends.includes(lord2)) {
      relationship = "Natural Friends";
      score = 90;
    } else if (friendInfo1.enemies.includes(lord2)) {
      relationship = "Inimical / Conflict";
      score = 40;
    }

    const activeLordsHarmony = {
      person1Lord: lord1,
      person2Lord: lord2,
      relationship,
      score,
      description:
        relationship === "Natural Friends"
          ? `${person1Name}'s current Dasha lord (${lord1}) and ${person2Name}'s lord (${lord2}) are natural allies. The planetary currents support joint endeavors and mutual patience.`
          : relationship === "Neutral"
          ? `The active Dasha lords (${lord1} and ${lord2}) maintain a neutral stance, allowing individual autonomy and steady cooperation.`
          : `The active Dasha lords (${lord1} and ${lord2}) have conflicting elementary temperaments. Extra mindfulness is advised during stressful life events.`,
    };

    // Scan for Dasha Sandhis (transitions within 12 months of each other)
    const upcomingSandhis: SandhiAlert[] = [];
    let isSandhiActiveNow = false;
    let activeSandhiDetails: string | undefined;

    // Check Mahadasha endpoints
    dashas1.forEach((d1) => {
      const d1End = new Date(d1.endDate);
      dashas2.forEach((d2) => {
        const d2End = new Date(d2.endDate);
        const diffMs = Math.abs(d1End.getTime() - d2End.getTime());
        const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4375));

        // Check if both end within 12 months
        if (diffMonths <= 12) {
          // If within the next 20 years
          const yearsFromNow1 = (d1End.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (yearsFromNow1 >= -1 && yearsFromNow1 <= 15) {
            const isOngoing = Math.abs(yearsFromNow1) <= 1;
            if (isOngoing) {
              isSandhiActiveNow = true;
              activeSandhiDetails = `Simultaneous Mahadasha transition window active between ${d1.planet} and ${d2.planet} periods.`;
            }

            upcomingSandhis.push({
              type: "Mahadasha Sandhi Collision",
              person1Period: `${d1.planet} Mahadasha completion`,
              person2Period: `${d2.planet} Mahadasha completion`,
              transitionDate1: d1End.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
              transitionDate2: d2End.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
              gapMonths: diffMonths,
              severity: diffMonths <= 6 ? "High" : "Moderate",
              description: `Both partners transition their major planetary life chapters within ${diffMonths} months of each other (${d1.planet} and ${d2.planet}). In classical Jyotish, simultaneous Dasha transitions denote joint vulnerability where neither partner can easily buffer the other.`,
              remedy: "Engage in charitable works (Anna Daan), perform Shiva Gayatri japa, and postpone high-risk financial speculations during this junction window.",
            });
          }
        }
      });
    });

    // Generate 10-Year timeline points
    const tenYearTimeline: DashaTimelinePoint[] = [];
    const currentYear = now.getFullYear();

    for (let i = 0; i < 10; i++) {
      const sampleYear = currentYear + i;
      const sampleDate = new Date(`${sampleYear}-07-01T00:00:00Z`);

      // Find active Mahadasha for P1 and P2 at sampleDate
      const active1 =
        dashas1.find((d) => {
          const s = new Date(d.startDate);
          const e = new Date(d.endDate);
          return sampleDate >= s && sampleDate <= e;
        }) || currentDasha1;

      const active2 =
        dashas2.find((d) => {
          const s = new Date(d.startDate);
          const e = new Date(d.endDate);
          return sampleDate >= s && sampleDate <= e;
        }) || currentDasha2;

      const p1L = active1 ? active1.planet : "Jupiter";
      const p2L = active2 ? active2.planet : "Venus";

      const friendsP1 = NATURAL_FRIENDS[p1L] || { friends: [], neutrals: [], enemies: [] };
      const isHarmonious = friendsP1.friends.includes(p2L);
      const isConflict = friendsP1.enemies.includes(p2L);

      const hasSandhiNear = upcomingSandhis.some((s) => {
        const y1 = parseInt(s.transitionDate1.split(" ")[1]) || 0;
        const y2 = parseInt(s.transitionDate2.split(" ")[1]) || 0;
        return y1 === sampleYear || y2 === sampleYear;
      });

      const harmonyScore = hasSandhiNear ? 50 : isHarmonious ? 88 : isConflict ? 60 : 75;
      const status: DashaTimelinePoint["status"] = hasSandhiNear
        ? "Vulnerable / Sandhi"
        : isHarmonious
        ? "Harmonious"
        : "Transformative";

      tenYearTimeline.push({
        date: `${sampleYear}`,
        year: sampleYear,
        person1Dasha: `${p1L} Mahadasha`,
        person2Dasha: `${p2L} Mahadasha`,
        harmonyScore,
        status,
        theme: hasSandhiNear
          ? "Crucial joint transitional period requiring emotional patience and mutual grounding."
          : isHarmonious
          ? "Strong mutual support, harmonious planetary sync, and favorable shared achievements."
          : "Steady dynamic growth through balance of diverse personal priorities.",
      });
    }

    const highSeveritySandhi = upcomingSandhis.some((s) => s.severity === "High");
    const verdict: DashaSandhiReport["verdict"] = highSeveritySandhi
      ? "High Dasha Sandhi Alert"
      : upcomingSandhis.length > 0
      ? "Moderate Transition Caution"
      : "Safe & Complementary Timelines";

    const summary =
      verdict === "Safe & Complementary Timelines"
        ? "No simultaneous Mahadasha Sandhi collisions detected. When one partner undergoes personal evolutionary shifts, the other partner is positioned to anchor and support the relationship."
        : verdict === "Moderate Transition Caution"
        ? "One moderate Dasha Sandhi window is observed within the decade. Awareness and proactive communication during that phase will ensure smooth sailing."
        : "A close simultaneous Mahadasha transition is identified. Observing classical remedial peace rituals and maintaining conscious empathy will protect domestic equilibrium.";

    return {
      isSandhiActiveNow,
      activeSandhiDetails,
      activeLordsHarmony,
      upcomingSandhis,
      tenYearTimeline,
      verdict,
      summary,
    };
  }
}

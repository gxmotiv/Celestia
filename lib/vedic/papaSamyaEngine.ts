/**
 * Classical Vedic Papa Samya (Malefic Balance) Engine
 * Implements the traditional Parashari and South Indian Vivaha Melapak methodology:
 * Calculates weighted malefic points from Lagna, Chandra (Moon), and Shukra (Venus)
 * for Mars, Saturn, Sun, Rahu, and Ketu in the 1st, 2nd, 4th, 7th, 8th, and 12th houses.
 */

import { VedicChartData, VedicPlanet } from "../astronomy/vedic";

export interface MaleficPlacementDetail {
  planet: string;
  sanskritName: string;
  pivot: "Lagna" | "Moon" | "Venus";
  house: number;
  houseSignificance: string;
  points: number;
  description: string;
}

export interface ChartPapaScore {
  personName: string;
  totalPoints: number;
  pointsFromLagna: number;
  pointsFromMoon: number;
  pointsFromVenus: number;
  pointsByPlanet: Record<string, number>;
  placements: MaleficPlacementDetail[];
}

export interface PapaSamyaComparison {
  person1Score: ChartPapaScore;
  person2Score: ChartPapaScore;
  pointsDifference: number; // |P1 - P2|
  relativeDifferencePercent: number;
  balanceStatus:
    | "Balanced Equilibrium (Mutual Neutralization)"
    | "Mild Disparity (Harmonious Tolerance)"
    | "Significant Imbalance (Remedies Advised)";
  verdictDescription: string;
  remedialAdvice: string[];
}

export class PapaSamyaEngine {
  private static MALEFIC_WEIGHTS: Record<string, { weight: number; sanskrit: string }> = {
    mars: { weight: 1.0, sanskrit: "Kuja (मंगल)" },
    saturn: { weight: 0.75, sanskrit: "Shani (शनि)" },
    sun: { weight: 0.5, sanskrit: "Surya (सूर्य)" },
    rahu: { weight: 0.5, sanskrit: "Rahu (राहु)" },
    ketu: { weight: 0.5, sanskrit: "Ketu (केतु)" },
  };

  private static HOUSE_WEIGHTS: Record<number, { factor: number; label: string }> = {
    7: { factor: 1.0, label: "7th House (Kalatra / Marriage & Spouse)" },
    8: { factor: 1.0, label: "8th House (Mangalya & Longevity of Bond)" },
    1: { factor: 0.75, label: "1st House (Tanu / Temperament & Vitality)" },
    4: { factor: 0.5, label: "4th House (Sukha / Domestic Harmony)" },
    12: { factor: 0.5, label: "12th House (Shayana / Intimacy & Bed Comfort)" },
    2: { factor: 0.25, label: "2nd House (Kutumba / Family Speech & Wealth)" },
  };

  private static PIVOT_WEIGHTS: Record<"Lagna" | "Moon" | "Venus", number> = {
    Lagna: 1.0,   // 100% direct bodily & karmic manifestation
    Moon: 0.5,    // 50% emotional & mental perception
    Venus: 0.25,  // 25% conjugal & sensual expression
  };

  /**
   * Calculates individual Papa score for a single Vedic chart
   */
  public static calculateChartPapa(chart: VedicChartData, personName: string): ChartPapaScore {
    const lagnaRasi = chart.lagna.rasiIndex;
    const moonPlanet = chart.planets.find((p) => p.id === "moon") || chart.planets[1];
    const venusPlanet = chart.planets.find((p) => p.id === "venus") || chart.planets[5];

    const moonRasi = moonPlanet ? moonPlanet.rasiIndex : lagnaRasi;
    const venusRasi = venusPlanet ? venusPlanet.rasiIndex : lagnaRasi;

    const placements: MaleficPlacementDetail[] = [];
    const pointsByPlanet: Record<string, number> = {
      Mars: 0,
      Saturn: 0,
      Sun: 0,
      Rahu: 0,
      Ketu: 0,
    };

    let pointsFromLagna = 0;
    let pointsFromMoon = 0;
    let pointsFromVenus = 0;

    const pivots: { name: "Lagna" | "Moon" | "Venus"; baseRasi: number }[] = [
      { name: "Lagna", baseRasi: lagnaRasi },
      { name: "Moon", baseRasi: moonRasi },
      { name: "Venus", baseRasi: venusRasi },
    ];

    for (const [planetId, meta] of Object.entries(this.MALEFIC_WEIGHTS)) {
      const planetObj = chart.planets.find((p) => p.id === planetId);
      if (!planetObj) continue;

      const planetRasi = planetObj.rasiIndex;
      const planetStandardName = planetObj.name;

      for (const pivot of pivots) {
        // Calculate house from pivot (1-12)
        const houseFromPivot = ((planetRasi - pivot.baseRasi + 12) % 12) + 1;

        if (this.HOUSE_WEIGHTS[houseFromPivot]) {
          const houseInfo = this.HOUSE_WEIGHTS[houseFromPivot];
          const pivotFactor = this.PIVOT_WEIGHTS[pivot.name];
          const rawScore = meta.weight * houseInfo.factor * pivotFactor;
          const score = Math.round(rawScore * 100) / 100;

          if (score > 0) {
            placements.push({
              planet: planetStandardName,
              sanskritName: meta.sanskrit,
              pivot: pivot.name,
              house: houseFromPivot,
              houseSignificance: houseInfo.label,
              points: score,
              description: `${planetStandardName} in house ${houseFromPivot} from ${pivot.name} contributes ${score.toFixed(2)} papa units.`,
            });

            pointsByPlanet[planetStandardName] =
              (pointsByPlanet[planetStandardName] || 0) + score;

            if (pivot.name === "Lagna") pointsFromLagna += score;
            else if (pivot.name === "Moon") pointsFromMoon += score;
            else if (pivot.name === "Venus") pointsFromVenus += score;
          }
        }
      }
    }

    const totalPoints =
      Math.round((pointsFromLagna + pointsFromMoon + pointsFromVenus) * 100) / 100;

    return {
      personName,
      totalPoints,
      pointsFromLagna: Math.round(pointsFromLagna * 100) / 100,
      pointsFromMoon: Math.round(pointsFromMoon * 100) / 100,
      pointsFromVenus: Math.round(pointsFromVenus * 100) / 100,
      pointsByPlanet,
      placements,
    };
  }

  /**
   * Compares Papa Samya between two charts
   */
  public static compare(
    chart1: VedicChartData,
    chart2: VedicChartData,
    person1Name: string,
    person2Name: string
  ): PapaSamyaComparison {
    const p1Score = this.calculateChartPapa(chart1, person1Name);
    const p2Score = this.calculateChartPapa(chart2, person2Name);

    const diff = Math.abs(p1Score.totalPoints - p2Score.totalPoints);
    const maxScore = Math.max(p1Score.totalPoints, p2Score.totalPoints, 0.01);
    const relativePercent = Math.round((diff / maxScore) * 100);

    let balanceStatus: PapaSamyaComparison["balanceStatus"];
    let verdictDescription = "";
    const remedialAdvice: string[] = [];

    if (relativePercent <= 15) {
      balanceStatus = "Balanced Equilibrium (Mutual Neutralization)";
      verdictDescription = `Both charts carry closely matched malefic intensity (${p1Score.totalPoints.toFixed(
        2
      )} vs ${p2Score.totalPoints.toFixed(
        2
      )} papa units, ${relativePercent}% delta). Under classical Parashari doctrine, mutual papas cancel each other, producing emotional resilience and enduring bond longevity.`;
      remedialAdvice.push("Continue regular combined spiritual devotions (such as Shiva-Parvati or Vishnu Sahasranama) to maintain auspicious vibrational harmony.");
    } else if (relativePercent <= 30) {
      balanceStatus = "Mild Disparity (Harmonious Tolerance)";
      verdictDescription = `There is a moderate difference in malefic weighting (${p1Score.totalPoints.toFixed(
        2
      )} vs ${p2Score.totalPoints.toFixed(
        2
      )} papa units). While manageable through maturity and communication, gentle balancing remedies will prevent emotional burnout.`;
      remedialAdvice.push("The partner with higher points should observe fasting on Tuesdays or Saturdays according to dominant malefic planets.");
      remedialAdvice.push("Offering water to the rising Sun (Arghya) each morning to enhance sattvic tolerance.");
    } else {
      balanceStatus = "Significant Imbalance (Remedies Advised)";
      verdictDescription = `A noticeable disparity exists between both charts (${p1Score.totalPoints.toFixed(
        2
      )} vs ${p2Score.totalPoints.toFixed(
        2
      )} papa units, ${relativePercent}% disparity). Classical Jyotish advises intentional remedies to prevent one partner from shouldering an unfair emotional or health burden.`;
      remedialAdvice.push("Perform Navagraha Shanti Puja or Rudrabhishekam prior to major commitments.");
      remedialAdvice.push("Light sesame oil lamps (Til Deepam) on Saturdays for Lord Shani and Hanuman Chalisa recitation.");
      remedialAdvice.push("Cultivate proactive patience during Mars-Saturn transits across natal 1st, 7th, or 8th houses.");
    }

    return {
      person1Score: p1Score,
      person2Score: p2Score,
      pointsDifference: Math.round(diff * 100) / 100,
      relativeDifferencePercent: relativePercent,
      balanceStatus,
      verdictDescription,
      remedialAdvice,
    };
  }
}

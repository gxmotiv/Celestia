/**
 * Advanced Western Astrological Calculations:
 * 1. Midpoint System (Cosmobiology & Uranian Astrology - Ebertin 90° dial/360° structure)
 * 2. Harmonic Charts System (4th, 5th, 7th, 8th, 9th harmonics with interpretations)
 * 3. Declinations & Parallels / Contraparallels System
 */

import { PlanetPosition, normalizeDegrees, formatDegreeMinute, ZODIAC_SIGNS, type WesternChartData } from "./ephemeris";

// -------------------------------------------------------------
// 1. MIDPOINT SYSTEM
// -------------------------------------------------------------

export interface MidpointItem {
  planet1: string;
  planet2: string;
  midpoint: number; // 0 to 360°
  dial90: number;   // 0 to 90° Cosmobiology modulus
  sign: string;
  signDegreeFormatted: string;
  activatedBy: Array<{
    planet: string;
    aspectType: "Conjunction" | "Opposition" | "Square" | "Semisquare" | "Sesquiquadrate";
    orb: number;
  }>;
  interpretation: string;
}

export class MidpointCalculator {
  /**
   * Calculate direct midpoint along shortest arc
   */
  public calculateMidpoint(lon1: number, lon2: number): number {
    let diff = lon2 - lon1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const mid = lon1 + diff / 2;
    return normalizeDegrees(mid);
  }

  /**
   * Calculate natal midpoints from the full Western chart, including its
   * Ascendant and Midheaven. The raw planet list intentionally excludes these
   * two angles, so callers rendering a natal 90° dial must use this entry point.
   */
  public calculateNatalMidpoints(
    chart: Pick<WesternChartData, "planets" | "ascendant" | "midheaven">
  ): MidpointItem[] {
    return this.calculateAllMidpoints([
      ...chart.planets,
      chart.ascendant,
      chart.midheaven,
    ]);
  }

  /**
   * Find if any planet aspects the midpoint in the 8th harmonic series (0°, 45°, 90°, 135°, 180°)
   * within a strict orb (default 1.5°).
   */
  public findActivatingPlanets(
    midpoint: number,
    planets: PlanetPosition[],
    excluded: string[],
    maxOrb = 1.75
  ): MidpointItem["activatedBy"] {
    const activations: MidpointItem["activatedBy"] = [];

    const HARD_ASPECTS: Array<{
      type: "Conjunction" | "Opposition" | "Square" | "Semisquare" | "Sesquiquadrate";
      angle: number;
    }> = [
      { type: "Conjunction", angle: 0 },
      { type: "Opposition", angle: 180 },
      { type: "Square", angle: 90 },
      { type: "Semisquare", angle: 45 },
      { type: "Sesquiquadrate", angle: 135 },
    ];

    for (const p of planets) {
      if (excluded.includes(p.name)) continue;

      let sep = Math.abs(p.longitude - midpoint);
      if (sep > 180) sep = 360 - sep;

      for (const asp of HARD_ASPECTS) {
        const diff = Math.abs(sep - asp.angle);
        if (diff <= maxOrb) {
          activations.push({
            planet: p.name,
            aspectType: asp.type,
            orb: Math.round(diff * 100) / 100,
          });
          break;
        }
      }
    }

    return activations;
  }

  public interpretMidpoint(p1: string, p2: string, activations: MidpointItem["activatedBy"]): string {
    const basePairs: Record<string, string> = {
      "Sun/Moon": "Vital soul balance, marriage synthesis, and emotional-physical harmony.",
      "Venus/Mars": "Passionate polarity, creative and romantic magnetism, sexual expression.",
      "Jupiter/Saturn": "Constructive growth, philosophical stabilization, reality versus vision.",
      "Sun/Jupiter": "Success consciousness, optimism, fortunate leadership, and dignified expansion.",
      "Moon/Venus": "Affectionate peace, maternal warmth, grace, and receptive artistic beauty.",
      "Mars/Saturn": "Endurance, disciplinary grit, labor under pressure, concentrated effort.",
      "Sun/MC": "Conscious vocation, social identity, core self-realization in the public sphere.",
      "Sun/ASC": "Physical vitality, personal charisma, and direct presentation to the world.",
      "Mercury/Jupiter": "Broad intellect, philosophical synthesis, publishing, and optimistic ideas.",
      "Uranus/Pluto": "Radical transformation, sudden breakthroughs, and awakening of collective power.",
    };

    const key = `${p1}/${p2}`;
    const altKey = `${p2}/${p1}`;
    const baseMeaning = basePairs[key] || basePairs[altKey] || `Synergy of ${p1} and ${p2} blending consciousness and drive.`;

    if (activations.length === 0) {
      return `${baseMeaning} (Receptive midpoint without tight direct hard activation).`;
    }

    const first = activations[0];
    return `${baseMeaning} The midpoint is also aspected by ${first.planet} (${first.aspectType}, orb ${first.orb}°). Interpretive meanings are traditional astrological symbolism, not a demonstrated causal effect.`;
  }

  /**
   * Calculate all major midpoints
   */
  public calculateAllMidpoints(planets: PlanetPosition[]): MidpointItem[] {
    const items: MidpointItem[] = [];
    const corePlanets = planets.filter((p) =>
      ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "NorthNode", "Ascendant", "Midheaven"].includes(p.name) && !p.calculationNote
    );

    for (let i = 0; i < corePlanets.length; i++) {
      for (let j = i + 1; j < corePlanets.length; j++) {
        const p1 = corePlanets[i];
        const p2 = corePlanets[j];
        const mid = this.calculateMidpoint(p1.longitude, p2.longitude);
        const dial90 = Math.round((mid % 90) * 100) / 100;
        const signIdx = Math.floor(mid / 30);
        const signName = ZODIAC_SIGNS[signIdx]?.name || "Aries";

        const activatedBy = this.findActivatingPlanets(mid, corePlanets, [p1.name, p2.name]);
        const interpretation = this.interpretMidpoint(p1.name, p2.name, activatedBy);

        items.push({
          planet1: p1.name,
          planet2: p2.name,
          midpoint: Math.round(mid * 100) / 100,
          dial90,
          sign: signName,
          signDegreeFormatted: formatDegreeMinute(mid),
          activatedBy,
          interpretation,
        });
      }
    }

    // Sort: activated midpoints first, then alphabetical
    return items.sort((a, b) => b.activatedBy.length - a.activatedBy.length);
  }
}

// -------------------------------------------------------------
// 2. HARMONIC CHARTS SYSTEM
// -------------------------------------------------------------

export interface HarmonicPlanet {
  name: string;
  symbol: string;
  harmonicLongitude: number;
  sign: string;
  signDegreeFormatted: string;
}

export interface HarmonicChart {
  harmonicNumber: number;
  name: string;
  theme: string;
  description: string;
  planets: HarmonicPlanet[];
  conjunctions: Array<{
    planet1: string;
    planet2: string;
    orb: number;
    interpretation: string;
  }>;
}

export class HarmonicChartCalculator {
  public static readonly KEY_HARMONICS: Record<
    number,
    { name: string; theme: string; description: string }
  > = {
    4: {
      name: "4th Harmonic (H4) - Manifestation & Stress",
      theme: "Square & Opposition Series (4th/8th harmonics)",
      description: "Reveals how inner friction translates into concrete material achievements, endurance, and practical structures in the physical world.",
    },
    5: {
      name: "5th Harmonic (H5) - Creative Genius & Art",
      theme: "Quintile Series (72° / 144°)",
      description: "Unveils innate talent, playfulness, artistic craftsmanship, problem-solving elegance, and pure joyful creation without external pressure.",
    },
    7: {
      name: "7th Harmonic (H7) - Mysticism & Inspiration",
      theme: "Septile Series (51°25' / 102°51')",
      description: "Governs spiritual longing, cosmic poetry, sacred vision, sacrifice, mystical devotion, and divine unworldly dreams.",
    },
    8: {
      name: "8th Harmonic (H8) - Tenacity & Crisis Mastery",
      theme: "Semisquare & Sesquiquadrate Series",
      description: "Shows resilience in crisis, the transformative forge of pressure, survival instincts, and power regenerated through surrender.",
    },
    9: {
      name: "9th Harmonic (H9) - Novile Series",
      theme: "Novile divisions (40° / 80° and related ninth-harmonic angles)",
      description: "A ninth-harmonic chart formed by multiplying longitudes by nine. It is not equivalent to the Vedic Navamsha (D9), which uses a separate sign-division method. Interpretive themes vary by school.",
    },
  };

  public calculateHarmonic(
    planets: PlanetPosition[],
    harmonicNumber: number
  ): HarmonicChart {
    if (!Number.isInteger(harmonicNumber) || harmonicNumber < 1 || harmonicNumber > 360) {
      throw new RangeError("Harmonic number must be an integer from 1 to 360.");
    }
    const meta =
      HarmonicChartCalculator.KEY_HARMONICS[harmonicNumber] || {
        name: `${harmonicNumber}th Harmonic (H${harmonicNumber})`,
        theme: `Harmonic Division ${harmonicNumber}`,
        description: `Mathematical harmonic chart produced by multiplying ecliptic longitudes by ${harmonicNumber} and reducing them to 0–360°. Astrological interpretations vary by school; these are not measured physical or neurological frequencies.`,
      };

    const harmonicPlanets: HarmonicPlanet[] = planets.map((p) => {
      const hLon = normalizeDegrees(p.longitude * harmonicNumber);
      const signIdx = Math.floor(hLon / 30);
      const signName = ZODIAC_SIGNS[signIdx]?.name || "Aries";

      return {
        name: p.name,
        symbol: p.symbol,
        harmonicLongitude: Math.round(hLon * 1000) / 1000,
        sign: signName,
        signDegreeFormatted: formatDegreeMinute(hLon),
      };
    });

    // Detect conjunctions in harmonic chart (which correspond to exact aspects in natal chart!)
    const conjunctions: HarmonicChart["conjunctions"] = [];
    const maxOrb = 8.0 / harmonicNumber; // Scaled harmonic orb

    for (let i = 0; i < harmonicPlanets.length; i++) {
      for (let j = i + 1; j < harmonicPlanets.length; j++) {
        const hp1 = harmonicPlanets[i];
        const hp2 = harmonicPlanets[j];

        let diff = Math.abs(hp1.harmonicLongitude - hp2.harmonicLongitude);
        if (diff > 180) diff = 360 - diff;

        if (diff <= maxOrb) {
          conjunctions.push({
            planet1: hp1.name,
            planet2: hp2.name,
            orb: Math.round(diff * 100) / 100,
            interpretation: `In the H${harmonicNumber} chart, ${hp1.name} and ${hp2.name} are separated by ${diff.toFixed(
              2
            )}°. This is a mathematical harmonic proximity; its astrological meaning depends on the interpretive tradition.`,
          });
        }
      }
    }

    return {
      harmonicNumber,
      name: meta.name,
      theme: meta.theme,
      description: meta.description,
      planets: harmonicPlanets,
      conjunctions,
    };
  }
}

// -------------------------------------------------------------
// 3. DECLINATIONS & PARALLELS / CONTRAPARALLELS
// -------------------------------------------------------------

export interface ParallelAspect {
  planet1: string;
  planet2: string;
  type: "Parallel" | "Contraparallel";
  symbol: string;
  dec1: number;
  dec2: number;
  orb: number;
  isOutOfBounds1: boolean;
  isOutOfBounds2: boolean;
  interpretation: string;
}

export interface DeclinationData {
  planet: string;
  symbol: string;
  declination: number; // -90° to +90°
  formattedDec: string; // e.g. "18°24' N"
  isOutOfBounds: boolean; // > 23°26' (the maximum solar declination)
}

export interface DeclinationReport {
  declinations: DeclinationData[];
  parallels: ParallelAspect[];
  contraparallels: ParallelAspect[];
  outOfBoundsCount: number;
}

export class DeclinationCalculator {
  /**
   * Convert ecliptic longitude and latitude into Equatorial Declination:
   * sin(dec) = sin(lat) * cos(eps) + cos(lat) * sin(eps) * sin(lon)
   */
  public calculateDeclination(
    eclipticLon: number,
    eclipticLat = 0,
    obliquity = 23.43929
  ): number {
    if (![eclipticLon, eclipticLat, obliquity].every(Number.isFinite) ||
        Math.abs(eclipticLat) > 90 || Math.abs(obliquity) > 90) {
      throw new RangeError("Declination requires finite ecliptic coordinates and obliquity.");
    }
    const DEG2RAD = Math.PI / 180.0;
    const RAD2DEG = 180.0 / Math.PI;

    const lonRad = eclipticLon * DEG2RAD;
    const latRad = eclipticLat * DEG2RAD;
    const epsRad = obliquity * DEG2RAD;

    const sinDec =
      Math.sin(latRad) * Math.cos(epsRad) +
      Math.cos(latRad) * Math.sin(epsRad) * Math.sin(lonRad);

    const decRad = Math.asin(Math.max(-1, Math.min(1, sinDec)));
    return decRad * RAD2DEG;
  }

  public formatDeclination(dec: number): string {
    const abs = Math.abs(dec);
    const deg = Math.floor(abs);
    const min = Math.floor((abs - deg) * 60);
    const hemi = dec >= 0 ? "N" : "S";
    return `${deg}°${min.toString().padStart(2, "0")}' ${hemi}`;
  }

  /**
   * Calculate declinations and find parallels & contraparallels
   */
  public calculateAll(
    planets: PlanetPosition[],
    obliquity = 23.43929,
    maxOrb = 1.2
  ): DeclinationReport {
    if (!Number.isFinite(obliquity) || Math.abs(obliquity) > 90 || !Number.isFinite(maxOrb) || maxOrb < 0) {
      throw new RangeError("Declination analysis requires valid obliquity and a non-negative finite orb.");
    }
    // The maximum solar declination is the obliquity of date, not a fixed J2000 constant.
    const OOB_THRESHOLD = Math.abs(obliquity);

    const declinationList: DeclinationData[] = planets.map((p) => {
      const dec = this.calculateDeclination(p.longitude, p.latitude || 0, obliquity);
      const isOOB = Math.abs(dec) > OOB_THRESHOLD;

      return {
        planet: p.name,
        symbol: p.symbol,
        declination: Math.round(dec * 1000) / 1000,
        formattedDec: this.formatDeclination(dec),
        isOutOfBounds: isOOB,
      };
    });

    const parallels: ParallelAspect[] = [];
    const contraparallels: ParallelAspect[] = [];

    for (let i = 0; i < declinationList.length; i++) {
      for (let j = i + 1; j < declinationList.length; j++) {
        const d1 = declinationList[i];
        const d2 = declinationList[j];

        // Parallel: Both North or both South, same declination (within orb)
        // Acts like an energetic Conjunction in 3D celestial space
        if (
          (d1.declination >= 0 && d2.declination >= 0) ||
          (d1.declination < 0 && d2.declination < 0)
        ) {
          const orb = Math.abs(Math.abs(d1.declination) - Math.abs(d2.declination));
          if (orb <= maxOrb) {
            parallels.push({
              planet1: d1.planet,
              planet2: d2.planet,
              type: "Parallel",
              symbol: "||",
              dec1: d1.declination,
              dec2: d2.declination,
              orb: Math.round(orb * 100) / 100,
              isOutOfBounds1: d1.isOutOfBounds,
              isOutOfBounds2: d2.isOutOfBounds,
              interpretation: `${d1.planet} and ${d2.planet} share the same latitude plane (${d1.formattedDec} / ${d2.formattedDec}), operating like an intensified conjunction that unifies their drives.`,
            });
          }
        }

        // Contraparallel: One North, one South, opposite declination (within orb)
        // Acts like an energetic Opposition across the celestial equator
        if (
          (d1.declination >= 0 && d2.declination < 0) ||
          (d1.declination < 0 && d2.declination >= 0)
        ) {
          const orb = Math.abs(Math.abs(d1.declination) - Math.abs(d2.declination));
          if (orb <= maxOrb) {
            contraparallels.push({
              planet1: d1.planet,
              planet2: d2.planet,
              type: "Contraparallel",
              symbol: "∦",
              dec1: d1.declination,
              dec2: d2.declination,
              orb: Math.round(orb * 100) / 100,
              isOutOfBounds1: d1.isOutOfBounds,
              isOutOfBounds2: d2.isOutOfBounds,
              interpretation: `${d1.planet} and ${d2.planet} mirror each other across the celestial equator (${d1.formattedDec} vs ${d2.formattedDec}), creating dynamic opposition-style polarity and awareness.`,
            });
          }
        }
      }
    }

    const outOfBoundsCount = declinationList.filter((d) => d.isOutOfBounds).length;

    return {
      declinations: declinationList,
      parallels: parallels.sort((a, b) => a.orb - b.orb),
      contraparallels: contraparallels.sort((a, b) => a.orb - b.orb),
      outOfBoundsCount,
    };
  }
}

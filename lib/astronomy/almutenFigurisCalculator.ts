/**
 * Almuten Figuris (Ruler of the Chart) Engine
 * Implements the classical Medieval doctrine of Rabbi Abraham Ibn Ezra and William Lilly.
 * Analyzes the 5 Hylegical/Almuten points:
 * 1. Ascendant
 * 2. Sun
 * 3. Moon
 * 4. Part of Fortune
 * 5. Pre-Natal Syzygy (SAN: New or Full Moon preceding birth)
 * Calculates essential dignities (Domicile +5, Exaltation +4, Triplicity +3, Terms +2, Faces +1)
 * plus accidental house dignities (+1 to +12), Day Ruler (+7), and Hour Ruler (+6).
 */

import { normalizeDegrees } from "./ephemeris";
import { swissEphemeris } from "./swissEphemeris";

export interface AlmutenCandidateScore {
  planet: string;
  symbol: string;
  essentialScore: number;
  accidentalScore: number;
  dayHourBonus: number;
  totalScore: number;
  rank: number;
  house: number;
  breakdown: {
    domiciles: number;
    exaltations: number;
    triplicities: number;
    terms: number;
    faces: number;
    houseScore: number;
  };
}

export interface AlmutenPointAnalysis {
  name: string;
  degreeFormatted: string;
  sign: string;
  domicile: string;
  exaltation: string;
  triplicity: string;
  term: string;
  face: string;
}

export interface AlmutenFigurisResult {
  almutenFiguris: string;
  almutenSymbol: string;
  almutenScore: number;
  /** @deprecated Compatibility alias for almutenFiguris; this is not a separate soul-ruler calculation. */
  lordOfSoul: string;
  /** @deprecated Compatibility alias for runnerUpPlanet; this is not a separate temperament calculation. */
  lordOfTemperament: string;
  runnerUpPlanet: string | null;
  methodNote: string;
  sanDegree: number;
  sanType: "New Moon" | "Full Moon";
  sanFormatted: string;
  sanUtcInstant: string;
  sanDaysBeforeBirth: number;
  dayRuler: string | null;
  hourRuler: string | null;
  points: AlmutenPointAnalysis[];
  scores: AlmutenCandidateScore[];
  significance: string;
}

// Classical Dignity Tables
const DOMICILE_RULERS = [
  "Mars",    // Aries
  "Venus",   // Taurus
  "Mercury", // Gemini
  "Moon",    // Cancer
  "Sun",     // Leo
  "Mercury", // Virgo
  "Venus",   // Libra
  "Mars",    // Scorpio
  "Jupiter", // Sagittarius
  "Saturn",  // Capricorn
  "Saturn",  // Aquarius
  "Jupiter", // Pisces
];

const EXALTATION_RULERS: Record<number, string> = {
  0: "Sun",     // Aries
  1: "Moon",    // Taurus
  3: "Jupiter", // Cancer
  5: "Mercury", // Virgo
  6: "Saturn",  // Libra
  9: "Mars",    // Capricorn
  11: "Venus",  // Pisces
};

// Dorothean Triplicities: [Day Ruler, Night Ruler, Participating]
const TRIPLICITY_RULERS: Record<number, { day: string; night: string; part: string }> = {
  0: { day: "Sun", night: "Jupiter", part: "Saturn" },     // Fire (Aries)
  1: { day: "Venus", night: "Moon", part: "Mars" },        // Earth (Taurus)
  2: { day: "Saturn", night: "Mercury", part: "Jupiter" }, // Air (Gemini)
  3: { day: "Venus", night: "Mars", part: "Moon" },        // Water (Cancer)
  4: { day: "Sun", night: "Jupiter", part: "Saturn" },     // Leo
  5: { day: "Venus", night: "Moon", part: "Mars" },        // Virgo
  6: { day: "Saturn", night: "Mercury", part: "Jupiter" }, // Libra
  7: { day: "Venus", night: "Mars", part: "Moon" },        // Scorpio
  8: { day: "Sun", night: "Jupiter", part: "Saturn" },     // Sagittarius
  9: { day: "Venus", night: "Moon", part: "Mars" },        // Capricorn
  10: { day: "Saturn", night: "Mercury", part: "Jupiter" },// Aquarius
  11: { day: "Venus", night: "Mars", part: "Moon" },       // Pisces
};

// Egyptian Terms: [limit degree, ruler] for each sign (0..11)
const EGYPTIAN_TERMS: Record<number, { limit: number; ruler: string }[]> = {
  0: [{ limit: 6, ruler: "Jupiter" }, { limit: 12, ruler: "Venus" }, { limit: 20, ruler: "Mercury" }, { limit: 25, ruler: "Mars" }, { limit: 30, ruler: "Saturn" }],
  1: [{ limit: 8, ruler: "Venus" }, { limit: 14, ruler: "Mercury" }, { limit: 22, ruler: "Jupiter" }, { limit: 27, ruler: "Saturn" }, { limit: 30, ruler: "Mars" }],
  2: [{ limit: 6, ruler: "Mercury" }, { limit: 12, ruler: "Jupiter" }, { limit: 17, ruler: "Venus" }, { limit: 24, ruler: "Mars" }, { limit: 30, ruler: "Saturn" }],
  3: [{ limit: 7, ruler: "Mars" }, { limit: 13, ruler: "Venus" }, { limit: 19, ruler: "Mercury" }, { limit: 26, ruler: "Jupiter" }, { limit: 30, ruler: "Saturn" }],
  4: [{ limit: 6, ruler: "Jupiter" }, { limit: 11, ruler: "Venus" }, { limit: 18, ruler: "Saturn" }, { limit: 24, ruler: "Mercury" }, { limit: 30, ruler: "Mars" }],
  5: [{ limit: 7, ruler: "Mercury" }, { limit: 17, ruler: "Venus" }, { limit: 21, ruler: "Jupiter" }, { limit: 28, ruler: "Mars" }, { limit: 30, ruler: "Saturn" }],
  6: [{ limit: 6, ruler: "Saturn" }, { limit: 14, ruler: "Venus" }, { limit: 21, ruler: "Jupiter" }, { limit: 28, ruler: "Mercury" }, { limit: 30, ruler: "Mars" }],
  7: [{ limit: 7, ruler: "Mars" }, { limit: 11, ruler: "Venus" }, { limit: 19, ruler: "Mercury" }, { limit: 24, ruler: "Jupiter" }, { limit: 30, ruler: "Saturn" }],
  8: [{ limit: 12, ruler: "Jupiter" }, { limit: 17, ruler: "Venus" }, { limit: 21, ruler: "Mercury" }, { limit: 26, ruler: "Saturn" }, { limit: 30, ruler: "Mars" }],
  9: [{ limit: 7, ruler: "Mercury" }, { limit: 14, ruler: "Jupiter" }, { limit: 22, ruler: "Venus" }, { limit: 26, ruler: "Saturn" }, { limit: 30, ruler: "Mars" }],
  10: [{ limit: 7, ruler: "Mercury" }, { limit: 13, ruler: "Venus" }, { limit: 20, ruler: "Jupiter" }, { limit: 25, ruler: "Mars" }, { limit: 30, ruler: "Saturn" }],
  11: [{ limit: 12, ruler: "Venus" }, { limit: 16, ruler: "Jupiter" }, { limit: 19, ruler: "Mercury" }, { limit: 28, ruler: "Mars" }, { limit: 30, ruler: "Saturn" }],
};

// Chaldean Faces (Decans): 10 degrees each (0-10, 10-20, 20-30)
const CHALDEAN_FACES = [
  ["Mars", "Sun", "Venus"],       // Aries
  ["Mercury", "Moon", "Saturn"],   // Taurus
  ["Jupiter", "Mars", "Sun"],      // Gemini
  ["Venus", "Mercury", "Moon"],    // Cancer
  ["Saturn", "Jupiter", "Mars"],   // Leo
  ["Sun", "Venus", "Mercury"],     // Virgo
  ["Moon", "Saturn", "Jupiter"],   // Libra
  ["Mars", "Sun", "Venus"],        // Scorpio
  ["Mercury", "Moon", "Saturn"],   // Sagittarius
  ["Jupiter", "Mars", "Sun"],      // Capricorn
  ["Venus", "Mercury", "Moon"],    // Aquarius
  ["Saturn", "Jupiter", "Mars"],   // Pisces
];

// Accidental Dignity by House
const HOUSE_SCORES: Record<number, number> = {
  1: 12,
  10: 11,
  7: 10,
  4: 9,
  11: 8,
  5: 7,
  2: 6,
  9: 5,
  8: 4,
  3: 3,
  12: 2,
  6: 1,
};

const ZODIAC_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿", Jupiter: "♃", Venus: "♀", Saturn: "♄"
};

export class AlmutenFigurisCalculator {
  /**
   * Find the most recent astronomical syzygy (New or Full Moon) before birth.
   *
   * The former implementation estimated the Sun's longitude with a fixed
   * phase-angle multiplier. That is not a time solution: relative lunar motion
   * varies through the lunation, so it could displace one of the five Almuten
   * points and change the dignity totals. This implementation brackets the
   * previous 0°/180° geocentric apparent ecliptic phase crossing and bisects it.
   *
   * The result is only as accurate as the repository's Astronomy Engine-backed
   * apparent geocentric Sun/Moon model; it is not a claim of native Swiss
   * Ephemeris accuracy or an independently certified historical ephemeris.
   */
  public calculatePreNatalSyzygy(birthJulianDay: number): {
    degree: number;
    type: "New Moon" | "Full Moon";
    julianDay: number;
    daysBeforeBirth: number;
  } {
    if (!Number.isFinite(birthJulianDay)) {
      throw new RangeError("Pre-natal syzygy search requires a finite birth Julian Day.");
    }

    const phaseAngle = (julianDay: number): number =>
      normalizeDegrees(
        swissEphemeris.getApparentMoonLongitude(julianDay) -
        swissEphemeris.getApparentSunLongitude(julianDay)
      );
    const signedAngleDifference = (angle: number, target: number): number => {
      const difference = normalizeDegrees(angle - target);
      return difference > 180 ? difference - 360 : difference;
    };

    // A 35-day lookback safely spans more than one complete synodic month.
    // Half-day samples keep each phase increment well below 180°, making the
    // unwrapped phase crossing unambiguous before the local bisection.
    const searchStart = birthJulianDay - 35;
    const stepDays = 1;
    let previousJd = searchStart;
    let previousPhase = phaseAngle(previousJd);
    let previousUnwrappedPhase = previousPhase;
    let latestSyzygy: { julianDay: number; type: "New Moon" | "Full Moon" } | null = null;

    for (let nextJd = searchStart + stepDays; nextJd <= birthJulianDay + 1e-10; nextJd += stepDays) {
      const currentJd = Math.min(nextJd, birthJulianDay);
      const currentPhase = phaseAngle(currentJd);
      const phaseAdvance = signedAngleDifference(currentPhase, previousPhase);

      // The geocentric lunar phase advances prograde. Reject a non-monotonic
      // or invalid sample rather than fabricating a syzygy from it.
      if (!Number.isFinite(phaseAdvance) || phaseAdvance < -1e-8 || phaseAdvance >= 180) {
        throw new RangeError("Apparent Sun/Moon phase did not advance consistently during syzygy search.");
      }

      const currentUnwrappedPhase = previousUnwrappedPhase + phaseAdvance;
      let targetPhase = (Math.floor((previousUnwrappedPhase + 1e-10) / 180) + 1) * 180;

      while (targetPhase <= currentUnwrappedPhase + 1e-10) {
        const targetNormalized = normalizeDegrees(targetPhase);
        const phaseError = (jd: number) => signedAngleDifference(phaseAngle(jd), targetNormalized);
        let low = previousJd;
        let high = currentJd;
        let lowError = phaseError(low);
        let highError = phaseError(high);

        // For a forward phase crossing, the signed error must move from
        // negative to positive (or land exactly on the target endpoint).
        if (Math.abs(lowError) <= 1e-10) {
          high = low;
        } else if (Math.abs(highError) <= 1e-10) {
          low = high;
        } else {
          if (!(lowError < 0 && highError > 0)) {
            throw new RangeError("Could not bracket the pre-natal syzygy phase crossing.");
          }
          for (let iteration = 0; iteration < 32 && high - low > 1e-7; iteration++) {
            const middle = low + (high - low) / 2;
            const middleError = phaseError(middle);
            if (middleError < 0) {
              low = middle;
            } else {
              high = middle;
            }
          }
        }

        const crossingJd = high;
        if (crossingJd <= birthJulianDay + 1e-10) {
          latestSyzygy = {
            julianDay: crossingJd,
            type: Math.abs(targetPhase / 180 % 2) < 1e-9 ? "New Moon" : "Full Moon",
          };
        }
        targetPhase += 180;
      }

      previousJd = currentJd;
      previousPhase = currentPhase;
      previousUnwrappedPhase = currentUnwrappedPhase;
      if (currentJd >= birthJulianDay) break;
    }

    if (!latestSyzygy) {
      throw new RangeError("No previous New Moon or Full Moon was found in the 35-day search window.");
    }

    const daysBeforeBirth = birthJulianDay - latestSyzygy.julianDay;
    if (!Number.isFinite(daysBeforeBirth) || daysBeforeBirth < -1e-8 || daysBeforeBirth > 35) {
      throw new RangeError("Resolved pre-natal syzygy falls outside the valid lookback interval.");
    }

    return {
      degree: swissEphemeris.getApparentSunLongitude(latestSyzygy.julianDay),
      type: latestSyzygy.type,
      julianDay: latestSyzygy.julianDay,
      daysBeforeBirth: Math.max(0, daysBeforeBirth),
    };
  }

  public calculate(params: {
    ascendant: number;
    sun: number;
    moon: number;
    partOfFortune: number;
    planets: { name: string; longitude: number; house: number }[];
    isDayChart: boolean;
    dayRuler: string | null;
    hourRuler: string | null;
    julianDay: number;
  }): AlmutenFigurisResult {
    const { ascendant, sun, moon, partOfFortune, planets, isDayChart, dayRuler, hourRuler, julianDay } = params;

    // 1. Determine the exact prior New/Full Moon from the natal UTC Julian Day.
    const san = this.calculatePreNatalSyzygy(julianDay);

    const candidatePoints = [
      { name: "Ascendant", lon: ascendant },
      { name: "Sun", lon: sun },
      { name: "Moon", lon: moon },
      { name: "Part of Fortune", lon: partOfFortune },
      { name: "Pre-Natal Syzygy (SAN)", lon: san.degree },
    ];

    const pointAnalyses: AlmutenPointAnalysis[] = [];

    // Track tallies for the 7 traditional planets
    const scoresMap: Record<string, {
      essential: number;
      accidental: number;
      dayHourBonus: number;
      house: number;
      domiciles: number;
      exaltations: number;
      triplicities: number;
      terms: number;
      faces: number;
    }> = {
      Sun: { essential: 0, accidental: 0, dayHourBonus: 0, house: 1, domiciles: 0, exaltations: 0, triplicities: 0, terms: 0, faces: 0 },
      Moon: { essential: 0, accidental: 0, dayHourBonus: 0, house: 1, domiciles: 0, exaltations: 0, triplicities: 0, terms: 0, faces: 0 },
      Mercury: { essential: 0, accidental: 0, dayHourBonus: 0, house: 1, domiciles: 0, exaltations: 0, triplicities: 0, terms: 0, faces: 0 },
      Venus: { essential: 0, accidental: 0, dayHourBonus: 0, house: 1, domiciles: 0, exaltations: 0, triplicities: 0, terms: 0, faces: 0 },
      Mars: { essential: 0, accidental: 0, dayHourBonus: 0, house: 1, domiciles: 0, exaltations: 0, triplicities: 0, terms: 0, faces: 0 },
      Jupiter: { essential: 0, accidental: 0, dayHourBonus: 0, house: 1, domiciles: 0, exaltations: 0, triplicities: 0, terms: 0, faces: 0 },
      Saturn: { essential: 0, accidental: 0, dayHourBonus: 0, house: 1, domiciles: 0, exaltations: 0, triplicities: 0, terms: 0, faces: 0 },
    };

    // Populate planet houses
    planets.forEach((p) => {
      if (scoresMap[p.name]) {
        scoresMap[p.name].house = p.house || 1;
      }
    });

    // 2. Evaluate essential dignities across the 5 points
    candidatePoints.forEach((pt) => {
      const signIdx = Math.floor(pt.lon / 30);
      const degreeInSign = pt.lon % 30;
      const signName = ZODIAC_NAMES[signIdx];

      // Domicile (+5)
      const dom = DOMICILE_RULERS[signIdx];
      if (scoresMap[dom]) {
        scoresMap[dom].essential += 5;
        scoresMap[dom].domiciles += 5;
      }

      // Exaltation (+4)
      const ex = EXALTATION_RULERS[signIdx] || "None";
      if (ex !== "None" && scoresMap[ex]) {
        scoresMap[ex].essential += 4;
        scoresMap[ex].exaltations += 4;
      }

      // Triplicity (+3)
      const tripObj = TRIPLICITY_RULERS[signIdx];
      const tripRuler = isDayChart ? tripObj.day : tripObj.night;
      if (scoresMap[tripRuler]) {
        scoresMap[tripRuler].essential += 3;
        scoresMap[tripRuler].triplicities += 3;
      }

      // Term (+2)
      const termList = EGYPTIAN_TERMS[signIdx];
      const termEntry = termList.find((t) => degreeInSign < t.limit) || termList[termList.length - 1];
      const termRuler = termEntry.ruler;
      if (scoresMap[termRuler]) {
        scoresMap[termRuler].essential += 2;
        scoresMap[termRuler].terms += 2;
      }

      // Face (+1)
      const faceIdx = Math.min(2, Math.floor(degreeInSign / 10));
      const faceRuler = CHALDEAN_FACES[signIdx][faceIdx];
      if (scoresMap[faceRuler]) {
        scoresMap[faceRuler].essential += 1;
        scoresMap[faceRuler].faces += 1;
      }

      const degMin = `${Math.floor(degreeInSign)}°${Math.floor((degreeInSign % 1) * 60)}'`;
      pointAnalyses.push({
        name: pt.name,
        degreeFormatted: `${degMin} ${signName}`,
        sign: signName,
        domicile: dom,
        exaltation: ex,
        triplicity: tripRuler,
        term: termRuler,
        face: faceRuler,
      });
    });

    // 3. Accidental Dignities (by House)
    Object.keys(scoresMap).forEach((pName) => {
      const h = scoresMap[pName].house;
      const hScore = HOUSE_SCORES[h] || 1;
      scoresMap[pName].accidental = hScore;

      // 4. Day and Hour Ruler Bonuses
      if (dayRuler !== null && pName === dayRuler) {
        scoresMap[pName].dayHourBonus += 7;
      }
      if (hourRuler !== null && pName === hourRuler) {
        scoresMap[pName].dayHourBonus += 6;
      }
    });

    // 5. Build candidate score table & sort by total score
    const scores: AlmutenCandidateScore[] = Object.keys(scoresMap).map((pName) => {
      const data = scoresMap[pName];
      const total = data.essential + data.accidental + data.dayHourBonus;
      return {
        planet: pName,
        symbol: PLANET_SYMBOLS[pName] || "",
        essentialScore: data.essential,
        accidentalScore: data.accidental,
        dayHourBonus: data.dayHourBonus,
        totalScore: total,
        rank: 1,
        house: data.house,
        breakdown: {
          domiciles: data.domiciles,
          exaltations: data.exaltations,
          triplicities: data.triplicities,
          terms: data.terms,
          faces: data.faces,
          houseScore: data.accidental,
        },
      };
    });

    scores.sort((a, b) => b.totalScore - a.totalScore);
    scores.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    const winner = scores[0];
    const runnerUp = scores[1];

    const sanSignIdx = Math.floor(san.degree / 30);
    const sanDegInSign = san.degree % 30;
    const sanFormatted = `${Math.floor(sanDegInSign)}°${Math.floor((sanDegInSign % 1) * 60)}' ${ZODIAC_NAMES[sanSignIdx]}`;

    return {
      almutenFiguris: winner.planet,
      almutenSymbol: winner.symbol,
      almutenScore: winner.totalScore,
      lordOfSoul: winner.planet,
      lordOfTemperament: runnerUp ? runnerUp.planet : winner.planet,
      runnerUpPlanet: runnerUp?.planet ?? null,
      methodNote: "Celestia-specific hybrid weighting: the Ascendant, Sun, Moon, Part of Fortune and previous syzygy are scored using domicile +5, exaltation +4, the active Dorothean triplicity ruler +3, Egyptian term +2 and Chaldean face +1. Additional accidental points use Celestia’s custom 12-to-1 house ranking, plus custom +7 day-ruler and +6 hour-ruler bonuses only when ordinary planetary day/hour rulers are available; these temporal additions are omitted where polar conditions prevent a classical sunrise/sunset schedule. This combination is not an exact reproduction of one historical author’s complete scoring method. The labels Lord of Soul and Lord of Temperament are not separately calculated by this engine; the legacy fields are aliases for rank 1 and rank 2.",
      sanDegree: san.degree,
      sanType: san.type,
      sanFormatted,
      sanUtcInstant: new Date((san.julianDay - 2440587.5) * 86400000).toISOString(),
      sanDaysBeforeBirth: san.daysBeforeBirth,
      dayRuler,
      hourRuler,
      points: pointAnalyses,
      scores,
      significance: `Under Celestia’s configured weighted method, ${winner.planet} ranks first with ${winner.totalScore} total points (${winner.essentialScore} essential, ${winner.accidentalScore} house, ${winner.dayHourBonus} temporal). The ranking is method-dependent and should not be treated as a canonical result shared by all traditional schools.`,
    };
  }
}

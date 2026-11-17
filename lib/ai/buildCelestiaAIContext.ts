import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { NumerologyProfile } from "@/lib/astronomy/numerology";
import { BaZiProfile } from "@/lib/astronomy/chinese";
import { swissEphemeris } from "@/lib/astronomy/swissEphemeris";
import { KPEngine } from "@/lib/kp/kpEngine";
import { KPPredictionEngine, KP_EVENT_RULES } from "@/lib/kp/kpPredictionEngine";
import { KPFourStepEngine } from "@/lib/kp/kpFourStepEngine";
import { CompleteDashaOrchestrator } from "@/lib/vedic/completeDashaSystems";
import {
  MultiSystemTransitEngine,
  TRANSIT_SYSTEM_PRESETS,
} from "@/lib/astronomy/MultiSystemTransitEngine";

export interface CelestiaAIContextInput {
  western: WesternChartData;
  vedic: VedicChartData;
  numerology: NumerologyProfile;
  bazi: BaZiProfile;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezoneOffsetHours: number;
}

/**
 * Build one shared, provenance-labelled AI context from Celestia's own
 * calculation engines. This function interprets no chart data and asks no
 * model to calculate planetary positions.
 */
export function buildCelestiaAIContext(input: CelestiaAIContextInput) {
  const referenceDate = new Date();
  const generatedAt = referenceDate.toISOString();
  const [yearText, monthText, dayText] = input.birthDate.split("-");
  const [hourText, minuteText] = input.birthTime.split(":");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const calculationNotes: string[] = [];
  const unavailable: string[] = [];

  let birthInstant: Date | null = null;
  if (
    [year, month, day, hour, minute, input.latitude, input.longitude, input.timezoneOffsetHours]
      .every(Number.isFinite) &&
    month >= 1 && month <= 12 &&
    day >= 1 && day <= 31 &&
    hour >= 0 && hour <= 23 &&
    minute >= 0 && minute <= 59
  ) {
    birthInstant = swissEphemeris.createUTCDate(
      year,
      month,
      day,
      hour,
      minute,
      0,
      input.timezoneOffsetHours
    );
  } else {
    unavailable.push("Extended KP, dasha, and transit calculations: birth date/time or coordinates are invalid.");
  }

  let dashaContext: Record<string, unknown> | null = null;
  if (birthInstant) {
    try {
      const moon = input.vedic.planets.find((planet) => planet.name === "Moon");
      if (!moon) {
        unavailable.push("Extended dasha convergence: natal Vedic Moon was not present.");
      } else {
        const planetsInSigns: Record<string, string> = {};
        input.vedic.planets.forEach((planet) => {
          planetsInSigns[planet.name] = planet.rasiName;
        });

        const allDashas = new CompleteDashaOrchestrator().generateAllDashas({
          birthDate: birthInstant,
          referenceDate,
          moonLongitude: moon.siderealLongitude,
          moonNakshatra1Indexed: moon.nakshatraIndex + 1,
          moonDegreeInNakshatra: moon.siderealLongitude % (360 / 27),
          ascendantSign: input.vedic.lagna.rasiName,
          planetsInSigns,
        });

        const pickCurrent = <T extends { isCurrent: boolean }>(items: T[]) =>
          items.find((item) => item.isCurrent) ?? null;

        dashaContext = {
          referenceDate: generatedAt,
          source: "CompleteDashaOrchestrator",
          currentPrana: allDashas.currentPrana
            ? {
                lord: allDashas.currentPrana.lord,
                fullName: allDashas.currentPrana.fullName,
                startDate: allDashas.currentPrana.startDate,
                endDate: allDashas.currentPrana.endDate,
                durationFormatted: allDashas.currentPrana.durationFormatted,
              }
            : null,
          currentYogini: pickCurrent(allDashas.yogini),
          currentYoginiSub: allDashas.currentYoginiSub,
          currentChara: pickCurrent(allDashas.chara),
          currentKalachakra: pickCurrent(allDashas.kalachakra),
          currentAshtottari: pickCurrent(allDashas.ashtottari),
          convergence: allDashas.convergence,
          note: "This orchestrator output is a calculation-engine result. Its traditional rules and date conventions should be reviewed separately; it is not an empirical prediction.",
        };
      }
    } catch (error) {
      unavailable.push(
        `Extended dasha convergence failed: ${error instanceof Error ? error.message : "unknown calculation error"}`
      );
    }
  }

  let kpContext: Record<string, unknown> | null = null;
  if (birthInstant) {
    try {
      const kpChart = new KPEngine().generateKPChart(input.western, input.vedic, birthInstant);
      const predictionEngine = new KPPredictionEngine();
      const predictions = Object.values(KP_EVENT_RULES).map((rule) =>
        predictionEngine.predictEvent(
          rule.house,
          kpChart.cusps,
          kpChart.planets,
          kpChart.currentDashaLord,
          kpChart.currentAntardashaLord,
          kpChart.currentPratyantardashaLord
        )
      );
      const fourStepEngine = new KPFourStepEngine();
      const positionalStatus = fourStepEngine.calculatePositionalStatus(
        kpChart.cusps,
        kpChart.planets
      );
      const fourStepByPlanet = kpChart.planets
        .filter((planet) => ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].includes(planet.name))
        .map((planet) =>
          fourStepEngine.evaluatePlanetFourStep(
            planet.name,
            kpChart.cusps,
            kpChart.planets,
            positionalStatus
          )
        );
      const cuspalInterlinks = fourStepEngine.calculateCuspalInterlinks(
        kpChart.cusps,
        kpChart.planets,
        positionalStatus
      );

      kpContext = {
        source: "KPEngine + KPPredictionEngine + KPFourStepEngine",
        ayanamsa: kpChart.ayanamsa,
        ayanamsaFormatted: kpChart.ayanamsaFormatted,
        cusps: kpChart.cusps,
        planets: kpChart.planets,
        houseSignificators: kpChart.houseSignificators,
        planetSignifications: kpChart.planetSignifications,
        rulingPlanets: kpChart.rulingPlanets,
        currentDashaLord: kpChart.currentDashaLord,
        currentAntardashaLord: kpChart.currentAntardashaLord,
        predictions,
        fourStepByPlanet,
        cuspalInterlinks,
        confidenceInterpretation: "The percentage displayed by the current KP prediction engine is a rule-weighted heuristic score, not a statistically calibrated probability or measured chance of a real-world event.",
        horaryStatus: "Not calculated in the general AI context. KP Horary depends on the querent's selected horary number, table, and question and must only be included after the user runs that feature.",
      };
    } catch (error) {
      unavailable.push(
        `KP context generation failed: ${error instanceof Error ? error.message : "unknown calculation error"}`
      );
    }
  }

  const transitContext: Record<string, unknown> = {
    referenceDate: generatedAt,
    systems: {},
    comparison: null,
  };
  if (birthInstant) {
    const systemResults: Record<string, unknown> = {};
    const transitSystems = ["western", "vedic", "hellenistic", "westernSidereal"];
    for (const systemId of transitSystems) {
      const config = TRANSIT_SYSTEM_PRESETS[systemId];
      if (!config) {
        unavailable.push(`Transit preset "${systemId}" is not registered.`);
        continue;
      }
      try {
        const result = new MultiSystemTransitEngine(
          config,
          input.western,
          input.vedic,
          referenceDate
        ).calculateSystemTransits(referenceDate);
        systemResults[systemId] = {
          config: result.config,
          dateFormatted: result.dateFormatted,
          ayanamsaDegrees: result.ayanamsaDegrees,
          houseSystemUsed: result.houseSystemUsed,
          zodiacUsed: result.zodiacUsed,
          planets: result.planets,
          aspects: result.aspects.slice(0, 30),
          specialConditions: result.specialConditions,
        };
      } catch (error) {
        unavailable.push(
          `Transit system "${systemId}" failed: ${error instanceof Error ? error.message : "unknown calculation error"}`
        );
      }
    }
    transitContext.systems = systemResults;

    try {
      const comparison = new MultiSystemTransitEngine(
        TRANSIT_SYSTEM_PRESETS.western,
        input.western,
        input.vedic,
        referenceDate
      ).compareSystems(referenceDate);
      transitContext.comparison = {
        dateFormatted: comparison.dateFormatted,
        ayanamsaDifference: comparison.ayanamsaDifference,
        divergenceSummary: comparison.divergenceSummary,
        planetComparisons: comparison.planetComparisons,
      };
    } catch (error) {
      unavailable.push(
        `Western/Vedic transit comparison failed: ${error instanceof Error ? error.message : "unknown calculation error"}`
      );
    }
  }

  return {
    schemaVersion: 1,
    generatedAt,
    calculationReference: {
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      timezoneOffsetHours: input.timezoneOffsetHours,
      latitude: input.latitude,
      longitude: input.longitude,
      birthInstantUtc: birthInstant?.toISOString() ?? null,
      timezoneCaveat: "The source form supplies a numeric UTC offset. This context does not independently verify historical IANA timezone rules for the birth date.",
    },
    systems: {
      western: {
        source: "calculateWesternChart",
        chart: input.western,
      },
      vedic: {
        source: "calculateVedicChart",
        chart: input.vedic,
        jaimini: input.vedic.jaiminiKarakas ?? null,
        divisionalChartCoverage: input.vedic.d9Chart ? ["D1 (base chart)", "D9 (Navamsa)"] : ["D1 (base chart)"],
        divisionalChartNote: "Only divisional charts present in the supplied VedicChartData object are included. Do not infer missing D2-D60 charts.",
      },
      numerology: {
        source: "calculateNumerologyProfile",
        profile: input.numerology,
        completeReport: input.numerology.completeReport,
        implementedBranches: ["Pythagorean", "Vedic / Indian", "Chaldean", "Chinese Lo Shu", "Kabbalah", "Tamil En Kaniyam"],
        branchCount: 6,
      },
      bazi: {
        source: "calculateBaZiProfile",
        profile: input.bazi,
      },
      dasha: dashaContext,
      kp: kpContext,
      transits: transitContext,
    },
    coverage: {
      included: [
        "Full supplied Western natal chart object",
        "Full supplied Vedic natal chart object, including Jaimini and D9 fields when present",
        "Complete numerology report available from the current profile",
        "Full supplied BaZi Four Pillars profile",
        "Calculated Yogini, Chara, Kalachakra, and Ashtottari dasha snapshots and convergence",
        "KP chart, all 12 standard event-rule outputs, planetary four-step summaries, and cuspal interlinks",
        "Current-date Western, Vedic, Hellenistic, and Western Sidereal transit snapshots",
        "Western-versus-Vedic transit comparison",
      ],
      notIncludedWithoutAdditionalUserInputOrFeatureData: [
        "Partner/synastry analysis: requires a second person's birth profile or a completed relationship result",
        "KP Horary: requires the user's selected horary number, table, and question",
        "D2-D60 divisional charts not present in the supplied VedicChartData object",
        "Feature-specific UI state or calculations that are not exposed to this AI synthesis view",
      ],
      calculationNotes,
      unavailable,
    },
    interpretationRules: [
      "Treat chart values as supplied calculation outputs, not as independently verified astronomy.",
      "Never invent missing placements, dates, divisional charts, horary inputs, partner data, or dasha periods.",
      "Keep tropical Western, sidereal Vedic, KP, BaZi, and each numerology tradition conceptually separate before synthesizing them.",
      "Clearly label traditional doctrine, calculation output, heuristic interpretation, and empirical fact.",
      "Never present an astrological prediction as certainty or as a scientifically established fact.",
    ],
  };
}

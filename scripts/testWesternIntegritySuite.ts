import assert from "node:assert/strict";
import {
  calculateWesternChart,
  calculateAspects,
  filterCalculationReadyPoints,
  isAngularAspectApplying,
  normalizeDegrees,
  type PlanetPosition,
  type WesternChartData,
} from "../lib/astronomy/ephemeris";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import { MinorAspectsEngine } from "../lib/astronomy/minorAspects";
import { PlanetaryHoursCalculator } from "../lib/astronomy/planetaryHours";
import {
  calculateSolarAltitudeDegrees,
  isSunAboveHorizonInChart,
} from "../lib/astronomy/horizon";
import { calculateHellenisticAnalysis, calculateSiderealComparison } from "../lib/astronomy/hellenistic";
import { ProgressionsEngine } from "../lib/astronomy/predictiveHellenisticEngine";
import { ArabianPartsCalculator } from "../lib/astronomy/arabianPartsCalculator";
import { AlmutenFigurisCalculator } from "../lib/astronomy/almutenFigurisCalculator";
import {
  FirdariaEngine,
  ZodiacalReleasingEngine,
} from "../lib/astronomy/predictiveHellenisticEngine";
import { EclipseAnalyzer, FixedStarsEngine, MedicalAstrologyEngine } from "../lib/astronomy/specializedWesternEngines";
import { WesternBenchmarkRunner } from "../lib/astronomy/westernBenchmarkTests";
import {
  MultiSystemTransitEngine,
  TRANSIT_SYSTEM_PRESETS,
} from "../lib/astronomy/MultiSystemTransitEngine";
import { calculateVedicChart } from "../lib/astronomy/vedic";
import { LunarPointsCalculator } from "../lib/astronomy/lunarPointsCalculator";
import {
  DeclinationCalculator,
  HarmonicChartCalculator,
  MidpointCalculator,
} from "../lib/astronomy/advancedWesternCalculators";
import { DailyHoroscope, TransitEngine } from "../lib/astronomy/transits";
import { SolarArcDirectionsEngine, WesternReturnEngine } from "../lib/astronomy/westernDirectionsAndReturns";

let assertions = 0;
function check(condition: unknown, message: string): void {
  assert.ok(condition, message);
  assertions += 1;
}
function close(actual: number, expected: number, tolerance: number, message: string): void {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    message + "; expected " + expected + ", received " + actual);
  assertions += 1;
}

function syntheticSun(longitude: number): PlanetPosition {
  return {
    id: "Sun",
    name: "Sun",
    symbol: "☉",
    longitude,
    latitude: 0,
    speed: 0.9856,
    isRetrograde: false,
    sign: "Aries",
    signIndex: 0,
    signDegree: longitude % 30,
    signDegreeFormatted: "0°00' Aries",
    house: 1, // Deliberately wrong for a day chart: sect must ignore this.
    element: "Fire",
    modality: "Cardinal",
  };
}

function syntheticSectChart(localSiderealTime: number): WesternChartData {
  const sun = syntheticSun(0);
  const point = { ...sun, id: "Ascendant", name: "Ascendant" };
  return {
    planets: [sun],
    houses: [],
    aspects: [],
    ascendant: point,
    midheaven: { ...point, id: "Midheaven", name: "Midheaven" },
    descendant: 180,
    imumCoeli: 180,
    julianDay: 2451545,
    siderealTime: localSiderealTime,
    obliquity: 0,
    birthLatitude: 0,
    birthLongitude: 0,
    houseSystem: "Placidus",
  };
}

// Classical planetary hours require an actual sunrise and sunset. Polar
// dates keep a broad day/night sect classification but must not fabricate
// zero-minute hours or day/hour rulers.
const planetaryHoursEngine = new PlanetaryHoursCalculator();
const polarDaySunTimes = planetaryHoursEngine.calculateSunTimes(2024, 6, 21, 80, 0, 0);
check(polarDaySunTimes.solarCondition === "polar-day",
  "High-latitude summer fixture is classified as polar day");
const polarDayHours = planetaryHoursEngine.calculate(2024, 6, 21, 12, 0, 80, 0, 0);
check(polarDayHours.isBirthInDaytime === true,
  "Polar day retains the diurnal sect classification");
check(polarDayHours.hoursAvailable === false && polarDayHours.hours.length === 0,
  "Polar day does not fabricate 24 unequal hours");
check(polarDayHours.dayRuler === null && polarDayHours.currentHourRuler === null &&
  polarDayHours.birthHourNumber === null,
  "Polar day has no invented planetary day/hour ruler or birth-hour number");
check(polarDayHours.dayHourDurationMinutes === null && polarDayHours.nightHourDurationMinutes === null,
  "Polar day does not report zero-length planetary-hour durations");

const polarNightSunTimes = planetaryHoursEngine.calculateSunTimes(2024, 1, 21, 80, 0, 0);
check(polarNightSunTimes.solarCondition === "polar-night",
  "High-latitude winter fixture is classified as polar night");
const polarNightHours = planetaryHoursEngine.calculate(2024, 1, 21, 12, 0, 80, 0, 0);
check(polarNightHours.isBirthInDaytime === false,
  "Polar night retains the nocturnal sect classification");
check(polarNightHours.hoursAvailable === false && polarNightHours.hours.length === 0,
  "Polar night does not fabricate 24 unequal hours");
check(polarNightHours.dayRuler === null && polarNightHours.currentHourRuler === null &&
  polarNightHours.birthHourNumber === null,
  "Polar night has no invented planetary day/hour ruler or birth-hour number");
check(Boolean(polarNightHours.availabilityNote?.includes("does not rise")),
  "Polar night discloses why classical planetary hours are unavailable");

const ordinaryPlanetaryHours = planetaryHoursEngine.calculate(2024, 3, 20, 12, 0, 51.4769, 0, 0);
check(ordinaryPlanetaryHours.hoursAvailable && ordinaryPlanetaryHours.hours.length === 24,
  "Ordinary sunrise/sunset dates retain the full 24-hour planetary schedule");
check(ordinaryPlanetaryHours.hours.every((hour) => hour.endTime !== hour.startTime),
  "Ordinary planetary hours have non-zero displayed intervals");

console.log("Western calculation integrity regression suite");

// At the exact aspect instant, the phase cannot be inferred from a single
// longitude snapshot even when relative speed is known.
check(isAngularAspectApplying(0, 60, 60, 1) === null,
  "The shared aspect helper reports an exact sextile as phase-indeterminate");
check(isAngularAspectApplying(0, 59, 60, -1) === true,
  "The shared aspect helper identifies a closing sextile before exactitude");
check(isAngularAspectApplying(0, 61, 60, -1) === false,
  "The shared aspect helper identifies a widening sextile after exactitude");

const exactNatalAspect = calculateAspects([
  syntheticSun(0),
  { ...syntheticSun(60), id: "ExactAspectProbe", name: "ExactAspectProbe", speed: 1.5 },
]).find((aspect) => aspect.planet1 === "Sun" || aspect.planet2 === "Sun");
check(exactNatalAspect?.isApplying === null,
  "An exact natal aspect is not mislabeled as separating");

// Natal aspects to chart angles have no modeled angular speed. They must not be
// reported as separating merely because angle points were stored with speed 0.
const angleAspect = calculateAspects([
  syntheticSun(0),
  { ...syntheticSun(0), id: "Ascendant", name: "Ascendant", speed: 0 },
]).find((aspect) => aspect.planet1 === "Sun" || aspect.planet2 === "Sun");
check(angleAspect?.isApplying === null,
  "Natal planet-to-angle aspect direction is indeterminate without a modeled angle speed");
const stationaryAspect = calculateAspects([
  { ...syntheticSun(0), speed: 0 },
  { ...syntheticSun(90), id: "StationaryBody", name: "StationaryBody", speed: 0 },
]).find((aspect) => aspect.planet1 === "Sun" || aspect.planet2 === "Sun");
check(stationaryAspect?.isApplying === null,
  "A fully stationary relative aspect is not falsely labelled separating");

const missingSpeedAspect = calculateAspects([
  syntheticSun(0),
  { ...syntheticSun(60), id: "MissingSpeedBody", name: "MissingSpeedBody", speed: undefined },
]).find((aspect) => aspect.planet1 === "Sun" || aspect.planet2 === "Sun");
check(missingSpeedAspect?.isApplying === null,
  "Main natal aspect direction is unavailable when one point has no instantaneous speed");

const stationaryAgainstMovingAspect = calculateAspects([
  { ...syntheticSun(0), speed: 0 },
  { ...syntheticSun(59), id: "MovingProbe", name: "MovingProbe", speed: 1 },
]).find((aspect) => aspect.planet1 === "Sun" || aspect.planet2 === "Sun");
check(stationaryAgainstMovingAspect?.isApplying === true,
  "A real stationary body remains a valid zero speed when paired with a moving body");

// The natal "Major Ptolemaic" table must contain only the five classical
// Ptolemaic aspects. Quincunx and Semisextile belong to the minor-aspect engine.
function natalAspectAt(longitude: number) {
  return calculateAspects([
    syntheticSun(0),
    { ...syntheticSun(longitude), id: "AspectProbe", name: "AspectProbe" },
  ]);
}
const expectedPtolemaic: Array<[number, string]> = [
  [0, "Conjunction"],
  [60, "Sextile"],
  [90, "Square"],
  [120, "Trine"],
  [180, "Opposition"],
];
for (const [longitude, name] of expectedPtolemaic) {
  check(
    natalAspectAt(longitude).some((aspect) => aspect.aspectName === name),
    "Natal major-aspect engine includes the Ptolemaic " + name
  );
}
check(natalAspectAt(30).length === 0,
  "Semisextile is not duplicated in the major Ptolemaic aspect result");
check(natalAspectAt(150).length === 0,
  "Quincunx is not duplicated in the major Ptolemaic aspect result");

const minorAspectEngine = new MinorAspectsEngine();
const semisextileResult = minorAspectEngine.calculateMinorAspects([
  syntheticSun(0),
  { ...syntheticSun(30), id: "AspectProbe", name: "AspectProbe" },
]);
check(semisextileResult.some((aspect) => aspect.aspectType.name === "Semisextile"),
  "Semisextile remains available in the minor-aspect engine");
const quincunxResult = minorAspectEngine.calculateMinorAspects([
  syntheticSun(0),
  { ...syntheticSun(150), id: "AspectProbe", name: "AspectProbe" },
]);
check(quincunxResult.some((aspect) => aspect.aspectType.name === "Quincunx"),
  "Quincunx remains available in the minor-aspect engine");



// 0. Advanced coordinate/point integrity: mean apogee reference, OOB threshold, axes and harmonic labels.
const lunarPoints = new LunarPointsCalculator();
const meanApogee2024 = lunarPoints.calculateMeanLilithLon(2460310.5);
close(meanApogee2024.lon, 159.9732, 0.02,
  "Mean Black Moon Lilith is near the Swiss Ephemeris 2024-01-01 mean-apogee reference");
check(Number.isFinite(meanApogee2024.speed) && meanApogee2024.speed > 0.10 && meanApogee2024.speed < 0.12,
  "Mean lunar-apogee speed is derived from the changing mean-apogee model");
const approxTrueApogee = lunarPoints.calculateTrueLilithLon(2460310.5);
check(Number.isFinite(approxTrueApogee.speed) && approxTrueApogee.speed !== 0.111,
  "Approximate True Lilith speed is derived from the model rather than fixed to 0.111°/day");

const declinationEngine = new DeclinationCalculator();
const obliquityDateFixture = {
  ...syntheticSun(90),
  latitude: 0,
};
const dateObliquityReport = declinationEngine.calculateAll([obliquityDateFixture], 23.5);
check(dateObliquityReport.declinations[0].isOutOfBounds === false,
  "OOB threshold follows the supplied obliquity of date instead of a fixed J2000 constant");
const midpointEngine = new MidpointCalculator();
const midpointChart = calculateWesternChart(2000, 1, 1, 12, 0, 51.4769, 0, 0, "Placidus");
const calculationReadyPoints = filterCalculationReadyPoints(midpointChart.planets);
check(!calculationReadyPoints.some((planet) => planet.name === "Chiron"),
  "Central calculation-provenance filter excludes the annotated Chiron placeholder");

const harmonicWithoutPlaceholder = new HarmonicChartCalculator()
  .calculateHarmonic(midpointChart.planets, 5);
check(!harmonicWithoutPlaceholder.planets.some((planet) => planet.name === "Chiron"),
  "Harmonic charts exclude explicitly approximate placeholder points");

const declinationWithoutPlaceholder = new DeclinationCalculator()
  .calculateAll(midpointChart.planets, midpointChart.obliquity);
check(!declinationWithoutPlaceholder.declinations.some((planet) => planet.planet === "Chiron"),
  "Declination and parallel calculations exclude explicitly approximate placeholder points");

close(midpointChart.additionalPoints?.vertex.longitude ?? Number.NaN, 188.469312, 0.01,
  "Natal additional-points Vertex uses the corrected western prime-vertical intersection");
close(midpointChart.additionalPoints?.eastPoint.longitude ?? Number.NaN, 11.373900, 0.01,
  "Natal additional-points East Point uses RA = RAMC + 90° rather than duplicating MC");
const allMidpointPoints = [
  ...midpointChart.planets,
  midpointChart.ascendant,
  midpointChart.midheaven,
];
const midpointRows = midpointEngine.calculateAllMidpoints(allMidpointPoints);
check(midpointRows.some((item) =>
  (item.planet1 === "Sun" && item.planet2 === "Ascendant") ||
  (item.planet2 === "Sun" && item.planet1 === "Ascendant")
), "Midpoint set includes the Sun/Ascendant axis");
check(midpointRows.some((item) =>
  (item.planet1 === "Sun" && item.planet2 === "Midheaven") ||
  (item.planet2 === "Sun" && item.planet1 === "Midheaven")
), "Midpoint set includes the Sun/Midheaven axis");

// Exercise the same full-chart entry point used by the Advanced Western UI.
// This guards the wiring, not just the lower-level pairwise midpoint method.
const natalMidpointRows = midpointEngine.calculateNatalMidpoints(midpointChart);
check(natalMidpointRows.some((item) =>
  (item.planet1 === "Sun" && item.planet2 === "Ascendant") ||
  (item.planet2 === "Sun" && item.planet1 === "Ascendant")
), "Advanced Western natal midpoint entry point includes Sun/Ascendant");
check(natalMidpointRows.some((item) =>
  (item.planet1 === "Sun" && item.planet2 === "Midheaven") ||
  (item.planet2 === "Sun" && item.planet1 === "Midheaven")
), "Advanced Western natal midpoint entry point includes Sun/Midheaven");
check(natalMidpointRows.length === midpointRows.length,
  "Natal midpoint entry point preserves the complete core-point pair set including both angles");
let invalidHarmonicRejected = false;
try {
  new HarmonicChartCalculator().calculateHarmonic(midpointChart.planets, 0);
} catch {
  invalidHarmonicRejected = true;
}
check(invalidHarmonicRejected, "Harmonic number zero is rejected");



// 0b. Fagan-Bradley comparison is calculated at the natal epoch, not from a fixed current constant.
const faganReferenceChart = calculateWesternChart(2026, 10, 1, 0, 0, 51.4769, 0, 0, "Placidus");
const chironPosition = faganReferenceChart.planets.find((planet) => planet.name === "Chiron");
check(Boolean(chironPosition && chironPosition.calculationNote?.includes("not an integrated or perturbed Chiron ephemeris")),
  "Chiron position exposes its placeholder-model limitation");
check(Boolean(chironPosition && chironPosition.speed === undefined && chironPosition.motionStatus === "unknown"),
  "Chiron has no fabricated constant speed or direct/retrograde status");
check(!faganReferenceChart.aspects.some((aspect) => aspect.planet1 === "Chiron" || aspect.planet2 === "Chiron"),
  "Unvalidated Chiron placeholder is excluded from major-aspect calculations");
check(!calculateAspects([
  { ...chironPosition!, name: "Chiron", id: "Chiron" },
  syntheticSun(chironPosition?.longitude ?? 0),
]).some((aspect) => aspect.planet1 === "Chiron" || aspect.planet2 === "Chiron"),
  "Direct major-aspect engine calls also ignore points with approximation notes");
check(!new MinorAspectsEngine().calculateMinorAspects(faganReferenceChart.planets)
  .some((aspect) => aspect.planet1 === "Chiron" || aspect.planet2 === "Chiron"),
  "Unvalidated Chiron placeholder is excluded from minor-aspect calculations");
check(!new MidpointCalculator().calculateNatalMidpoints(faganReferenceChart)
  .some((midpoint) => midpoint.planet1 === "Chiron" || midpoint.planet2 === "Chiron"),
  "Unvalidated Chiron placeholder is excluded from midpoint calculations");
const asteroidPositions = faganReferenceChart.asteroids
  ? Object.values(faganReferenceChart.asteroids)
  : [];
check(asteroidPositions.length === 4 && asteroidPositions.every((planet) =>
  Boolean(planet.calculationNote?.includes("fixed J2000-era Keplerian elements"))),
  "All four simplified asteroid positions disclose the fixed-element approximation");

const siderealComparison = calculateSiderealComparison(faganReferenceChart);
close(siderealComparison.faganBradleyAyanamsa, 25.1128, 0.01,
  "Fagan-Bradley ayanamsa on 2026-10-01 agrees with the Swiss Ephemeris reference near 25°06'46");
check(siderealComparison.referenceUtc.startsWith("2026-10-01"),
  "Sidereal comparison exposes the UTC epoch used for the ayanamsa");
const oldEpochChart = calculateWesternChart(2000, 1, 1, 12, 0, 51.4769, 0, 0, "Placidus");
const oldEpochSidereal = calculateSiderealComparison(oldEpochChart);
check(oldEpochSidereal.faganBradleyAyanamsa < siderealComparison.faganBradleyAyanamsa,
  "Fagan-Bradley ayanamsa changes across epochs rather than using a timeless constant");

// 0c. Secondary progression event labels use the progressed age's life-year, not the current year offset.
const progressionBirth = new Date("1990-07-14T10:30:00.000Z");
const progressionNow = new Date("2026-01-10T10:30:00.000Z");
const progressionReport = new ProgressionsEngine().calculateProgressions(
  progressionBirth, progressionNow, 51.4769, 0
);
check(progressionReport.age === 35, "Secondary progression age uses elapsed tropical years");
check(progressionReport.progressedDate === new Date(
  progressionBirth.getTime() + ((progressionNow.getTime() - progressionBirth.getTime()) / (365.2422 * 86400000)) * 86400000
).toISOString(), "Progressed date is serialized as a deterministic UTC ISO timestamp");
check(progressionReport.moonSignChanges.every((event) => event.year === 1990 + event.age),
  "Progressed Moon sign-change calendar year is derived from birth year plus life age");
check(progressionReport.moonSignChanges.every((event) => event.age >= 0),
  "Progressed Moon forecast does not report pre-birth sign changes");

// 0d. Solar Arc Directions and exact solar/lunar return event solvers.
const directedBirth = new Date("2000-06-01T12:00:00.000Z");
const directedAtAgeTen = new Date("2010-06-01T12:00:00.000Z");
const directedFixture = calculateWesternChart(2000, 6, 1, 12, 0, 51.4769, 0, 0, "Placidus");
const solarArcReport = new SolarArcDirectionsEngine().calculate(directedFixture, directedBirth, directedAtAgeTen, 1);
const expectedProgressedAge = (directedAtAgeTen.getTime() - directedBirth.getTime()) / (365.2422 * 86400000);
const expectedSolarArc = expectedProgressedAge * 0.98564733;
close(solarArcReport.ageYears, expectedProgressedAge, 1e-10, "Solar arc age is computed from elapsed tropical years including leap days");
close(solarArcReport.arcDegrees, expectedSolarArc, 1e-8, "Naibod solar arc uses 0.98564733 degrees per tropical year");
close(
  solarArcReport.directedPlanets.find((point) => point.name === "Sun")?.longitude ?? Number.NaN,
  normalizeDegrees((directedFixture.planets.find((point) => point.name === "Sun")?.longitude ?? 0) + expectedSolarArc),
  1e-6,
  "Solar arc shifts the natal Sun by the calculated Naibod arc"
);
close(
  solarArcReport.directedAngles.find((point) => point.name === "Ascendant")?.longitude ?? Number.NaN,
  normalizeDegrees(directedFixture.ascendant.longitude + expectedSolarArc),
  1e-6,
  "Solar arc shifts the Ascendant by the same Naibod arc"
);
const returnEngine = new WesternReturnEngine();
const solarReturn = returnEngine.calculateSolarReturn(directedFixture, 2026, 51.4769, 0, "Placidus");
check(solarReturn.exactUtc.startsWith("2026-"), "Solar return solver finds the requested calendar-year return");
check(solarReturn.longitudeErrorDegrees < 0.00001,
  "Solar return event solves to within 0.00001 degrees of the natal Sun longitude");
check(solarReturn.chart.houseSystem === "Placidus" && solarReturn.chart.houses.length === 12,
  "Solar return chart recalculates twelve Placidus cusps at its reference location");
const relocatedSolarReturn = returnEngine.calculateSolarReturn(directedFixture, 2026, 40.7128, -74.006, "Placidus");
check(relocatedSolarReturn.exactUtc === solarReturn.exactUtc,
  "Relocating a solar return does not change the geocentric exact return instant");
check(Math.abs(relocatedSolarReturn.chart.ascendant.longitude - solarReturn.chart.ascendant.longitude) > 1,
  "Relocating a solar return changes its local Ascendant and house geometry");
const lunarReturnReference = new Date("2026-11-12T00:00:00.000Z");
const lunarReturn = returnEngine.calculateNextLunarReturn(directedFixture, lunarReturnReference, 51.4769, 0, "WholeSign");
check(new Date(lunarReturn.exactUtc).getTime() > lunarReturnReference.getTime(),
  "Lunar return solver finds the next return strictly after the reference date");
check(new Date(lunarReturn.exactUtc).getTime() - lunarReturnReference.getTime() <= 36 * 86400000,
  "Next lunar return falls within the expected 36-day search interval");
check(lunarReturn.longitudeErrorDegrees < 0.00001,
  "Lunar return event solves to within 0.00001 degrees of the natal Moon longitude");
check(lunarReturn.chart.houseSystem === "WholeSign" && lunarReturn.chart.houses.length === 12,
  "Lunar return chart honors the selected Whole Sign system");
const subsequentLunarReturn = returnEngine.calculateNextLunarReturn(
  directedFixture, new Date(lunarReturn.exactUtc), 51.4769, 0, "WholeSign"
);
const firstLunarReturnTime = new Date(lunarReturn.exactUtc).getTime();
const subsequentLunarReturnTime = new Date(subsequentLunarReturn.exactUtc).getTime();
check(subsequentLunarReturnTime > firstLunarReturnTime,
  "Using a solved Lunar Return instant as the next reference finds a later return, not the same crossing");
check(
  subsequentLunarReturnTime - firstLunarReturnTime > 20 * 86400000 &&
  subsequentLunarReturnTime - firstLunarReturnTime <= 36 * 86400000,
  "The subsequent Lunar Return is approximately one lunar cycle after the prior return"
);
check(subsequentLunarReturn.longitudeErrorDegrees < 0.00001,
  "The subsequent Lunar Return also solves to within 0.00001 degrees of the natal Moon longitude");

// Pre-natal syzygy must resolve the actual previous New/Full Moon crossing,
// not estimate its Sun longitude using a fixed phase-angle multiplier.
const sanEngine = new AlmutenFigurisCalculator();
const sanReferenceEphemeris = new SwissEphemerisEngine();
const april2024NewMoonBirth = sanReferenceEphemeris.calculateJulianDay(2024, 4, 9, 12, 0, 0, 0);
const april2024NewMoonSan = sanEngine.calculatePreNatalSyzygy(april2024NewMoonBirth);
check(april2024NewMoonSan.type === "New Moon",
  "A birth after the 8 April 2024 New Moon identifies the previous syzygy as New Moon");
const nasaAprilNewMoonJd = sanReferenceEphemeris.calculateJulianDay(2024, 4, 8, 18, 21, 0, 0);
close(april2024NewMoonSan.julianDay, nasaAprilNewMoonJd, 0.02,
  "Solved New Moon is within 0.02 day of NASA Sky Calendar 8 April 2024 18:21 UTC");
close(
  sanReferenceEphemeris.getApparentSunLongitude(april2024NewMoonSan.julianDay),
  april2024NewMoonSan.degree,
  1e-10,
  "Pre-natal New Moon degree is the apparent solar longitude at the solved event instant"
);
const march2024FullMoonBirth = sanReferenceEphemeris.calculateJulianDay(2024, 3, 26, 12, 0, 0, 0);
const march2024FullMoonSan = sanEngine.calculatePreNatalSyzygy(march2024FullMoonBirth);
check(march2024FullMoonSan.type === "Full Moon",
  "A birth after the 25 March 2024 Full Moon identifies the previous syzygy as Full Moon");
const nasaMarchFullMoonJd = sanReferenceEphemeris.calculateJulianDay(2024, 3, 25, 7, 0, 0, 0);
close(march2024FullMoonSan.julianDay, nasaMarchFullMoonJd, 0.02,
  "Solved Full Moon is within 0.02 day of NASA Sky Calendar 25 March 2024 07:00 UTC");
const beforeMarchFullMoonBirth = sanReferenceEphemeris.calculateJulianDay(2024, 3, 24, 12, 0, 0, 0);
const beforeMarchFullMoonSan = sanEngine.calculatePreNatalSyzygy(beforeMarchFullMoonBirth);
check(beforeMarchFullMoonSan.type === "New Moon" &&
  beforeMarchFullMoonSan.daysBeforeBirth > 13.5 && beforeMarchFullMoonSan.daysBeforeBirth < 14.8,
  "A birth before the March Full Moon correctly looks back to the prior March New Moon");
let invalidSanDateRejected = false;
try {
  sanEngine.calculatePreNatalSyzygy(Number.NaN);
} catch {
  invalidSanDateRejected = true;
}
check(invalidSanDateRejected, "Pre-natal syzygy rejects a non-finite birth Julian Day");

// The Almuten view must expose its configured weighting and must not present
// the legacy soul/temperament aliases as separate technical calculations.
const almutenAuditChart = faganReferenceChart.almutenFiguris;
check(Boolean(almutenAuditChart && almutenAuditChart.methodNote.includes("Celestia-specific hybrid weighting")),
  "Almuten result discloses its custom hybrid point and weighting method");
check(Boolean(almutenAuditChart && almutenAuditChart.runnerUpPlanet === almutenAuditChart.scores[1]?.planet),
  "Almuten result exposes rank two as a runner-up, not a separately calculated temperament lord");
check(Boolean(almutenAuditChart && almutenAuditChart.lordOfSoul === almutenAuditChart.almutenFiguris &&
  almutenAuditChart.lordOfTemperament === (almutenAuditChart.runnerUpPlanet ?? almutenAuditChart.almutenFiguris)),
  "Legacy soul/temperament fields remain compatibility aliases for the ranked results");

// 1. Solar altitude and sect are based on real horizon geometry, not house numbers.
close(
  calculateSolarAltitudeDegrees({
    eclipticLongitude: 0,
    obliquity: 0,
    localSiderealTime: 0,
    geographicLatitude: 0,
  }),
  90,
  1e-9,
  "Point on local meridian at equator is at zenith"
);
close(
  calculateSolarAltitudeDegrees({
    eclipticLongitude: 0,
    obliquity: 0,
    localSiderealTime: 180,
    geographicLatitude: 0,
  }),
  -90,
  1e-9,
  "Point on opposite meridian at equator is at nadir"
);
close(
  calculateSolarAltitudeDegrees({
    eclipticLongitude: 0,
    obliquity: 0,
    localSiderealTime: 90,
    geographicLatitude: 0,
  }),
  0,
  1e-9,
  "Point on geometric horizon has zero altitude"
);
check(isSunAboveHorizonInChart(syntheticSectChart(0)) === true,
  "Sun above horizon is a day chart even when supplied house number is 1");
check(isSunAboveHorizonInChart(syntheticSectChart(180)) === false,
  "Sun below horizon is a night chart even when supplied house number is 1");

// 2. Western house systems resolve consistently and polar fallbacks are explicit.
const swiss = new SwissEphemerisEngine();
// Independent Swiss Ephemeris house-cusp reference for 2000-01-01 12:00 UT,
// Greenwich Observatory latitude 51.4769° N, longitude 0° E.
const placidusReference = swiss.calculateHouses(2451545.0, 51.4769, 0, "P");
close(placidusReference.ascendant, 24.265235, 0.005, "Placidus reference Ascendant matches Swiss Ephemeris fixture");
close(placidusReference.midheaven, 279.611088, 0.005, "Placidus reference Midheaven matches Swiss Ephemeris fixture");
close(placidusReference.houseCusps[1], 61.141524, 0.005, "Placidus 2nd cusp matches Swiss Ephemeris fixture");
close(placidusReference.houseCusps[2], 82.020398, 0.005, "Placidus 3rd cusp matches Swiss Ephemeris fixture");
close(placidusReference.houseCusps[10], 299.062295, 0.005, "Placidus 11th cusp matches Swiss Ephemeris fixture");
close(placidusReference.houseCusps[11], 327.701257, 0.005, "Placidus 12th cusp matches Swiss Ephemeris fixture");
close(placidusReference.vertex, 188.469312, 0.01, "Vertex matches Swiss Ephemeris reference coordinate");
close(placidusReference.equatorialAscendant, 11.373900, 0.01, "East Point/equatorial Ascendant matches Swiss Ephemeris reference coordinate");
const args = [2000, 1, 1, 12, 0, 40.7128, -74.006, -5] as const;
const autoChart = calculateWesternChart(...args, "Auto");
check(autoChart.requestedHouseSystem === "Auto", "Auto selection is preserved as the requested mode");
check(autoChart.houseSystem === "Placidus", "Auto selects Placidus for the modern Western profile at ordinary latitude");
check(autoChart.houses.length === 12, "Auto Western chart returns twelve house cusps");
check(autoChart.houses.every((house) => Number.isFinite(house.longitude)), "Auto Western chart has twelve finite cusp longitudes");
const wholeSignChart = calculateWesternChart(...args, "WholeSign");
const equalChart = calculateWesternChart(...args, "Equal");
const porphyryChart = calculateWesternChart(...args, "Porphyry");
check(wholeSignChart.houseSystem === "WholeSign", "Whole Sign request reports the actual system used");
check(equalChart.houseSystem === "Equal", "Equal request reports the actual system used");
check(porphyryChart.houseSystem === "Porphyry", "Porphyry request reports the actual system used");
for (const entry of [
  ["Whole Sign", wholeSignChart],
  ["Equal", equalChart],
  ["Porphyry", porphyryChart],
] as const) {
  check(entry[1].houses.length === 12, entry[0] + " returns twelve cusps");
  check(entry[1].houses.every((house) => Number.isFinite(house.longitude)), entry[0] + " returns twelve finite cusp longitudes");
  close(
    normalizeDegrees(entry[1].houses[6].longitude - entry[1].houses[0].longitude),
    180,
    0.001,
    entry[0] + " keeps the 1st/7th axis antipodal"
  );
}
const belowPolarFallback = swiss.calculateHouses(2451545, 66.5, 15, "P");
if (belowPolarFallback.houseSystemUsed === "O") {
  const belowPolarChart = calculateWesternChart(2000, 1, 1, 12, 0, 66.5, 15, 0, "Placidus");
  check(belowPolarChart.houseSystem === "Porphyry",
    "Numerical Placidus fallback reports Porphyry as the actual house system");
  check(Boolean(belowPolarChart.houseSystemNote && belowPolarChart.houseSystemNote.includes("numerically")),
    "Numerical Placidus fallback is disclosed to the chart user");
}
const polarAuto = calculateWesternChart(2000, 1, 1, 12, 0, 70, 0, 0, "Auto");
check(polarAuto.houseSystem === "Porphyry", "Auto selects Porphyry at Celestia's conservative polar-latitude threshold");
check(Boolean(
  polarAuto.houseSystemNote &&
  polarAuto.houseSystemNote.includes("Celestia's conservative policy") &&
  polarAuto.houseSystemNote.includes("not a claim")
), "Polar fallback disclosure identifies the Celestia policy and avoids claiming universal Placidus impossibility");
const polarSouthAuto = calculateWesternChart(2000, 1, 1, 12, 0, -70, 0, 0, "Auto");
check(polarSouthAuto.houseSystem === "Porphyry",
  "The same conservative polar fallback policy applies in the southern hemisphere");
check(Boolean(polarSouthAuto.houseSystemNote && polarSouthAuto.houseSystemNote.includes("Celestia's conservative policy")),
  "Southern polar fallback also discloses the application policy");
check(polarAuto.houses.length === 12, "Polar fallback returns twelve cusps");
check(polarAuto.houses.every((house) => Number.isFinite(house.longitude)), "Polar fallback returns twelve finite cusp longitudes");
const polarExplicitPlacidus = calculateWesternChart(2000, 1, 1, 12, 0, 70, 0, 0, "Placidus");
check(polarExplicitPlacidus.houseSystem === "Porphyry",
  "Explicit Placidus request reports Porphyry when polar fallback is used");
check(swiss.calculateHouses(2451545, 70, 0, "O").houseSystemUsed === "O",
  "Porphyry system code is recorded in house-calculation metadata");
for (const latitude of [-66.5, -60, -30, 0, 30, 60, 66.5]) {
  const result = swiss.calculateHouses(2451545, latitude, 15, "P");
  check(
    result.houseCusps.length === 12 && result.houseCusps.every(Number.isFinite),
    "Placidus/explicit fallback returns twelve finite cusps at latitude " + latitude
  );
  check(
    result.houseSystemUsed === "P" || result.houseSystemUsed === "O",
    "Numerically resolved Placidus latitude " + latitude + " reports the system actually used"
  );
}
let invalidCoordinatesRejected = false;
try {
  calculateWesternChart(2000, 1, 1, 12, 0, 91, 0, 0, "Auto");
} catch {
  invalidCoordinatesRejected = true;
}
check(invalidCoordinatesRejected, "Invalid latitude is rejected instead of generating a plausible-looking chart");

// 3. Hellenistic sect and planetary joys do not inherit Western quadrant house numbers.
const hellenisticPlacidus = calculateHellenisticAnalysis(autoChart);
const hellenisticWholeSign = calculateHellenisticAnalysis(wholeSignChart);
check(
  hellenisticPlacidus.isDiurnal === hellenisticWholeSign.isDiurnal,
  "Hellenistic sect is invariant when Western house system changes"
);
assert.deepEqual(
  hellenisticPlacidus.joys.map((item) => [item.planet, item.actualHouse, item.hasJoy]),
  hellenisticWholeSign.joys.map((item) => [item.planet, item.actualHouse, item.hasJoy]),
  "Hellenistic planetary joys always use Whole Sign placements"
);
assertions += 1;

// 4. Vedic and Hellenistic transit presets retain their own Whole Sign framework.
const birthInstant = new Date("2000-01-01T17:00:00.000Z");
const vedicChart = calculateVedicChart(autoChart, birthInstant);
const vedicTransit = new MultiSystemTransitEngine(
  TRANSIT_SYSTEM_PRESETS.vedic,
  autoChart,
  vedicChart,
  new Date("2026-11-12T00:00:00.000Z")
);
check(vedicTransit.houseSystemUsed === "whole-sign", "Vedic transit preset selects Whole Sign houses");
check(
  vedicTransit.calculateHouse(vedicChart.lagna.siderealLongitude, true) === 1,
  "Vedic Whole Sign transit frame puts sidereal Ascendant in house 1"
);
const hellenisticTransit = new MultiSystemTransitEngine(
  TRANSIT_SYSTEM_PRESETS.hellenistic,
  autoChart,
  vedicChart,
  new Date("2026-11-12T00:00:00.000Z")
);
check(hellenisticTransit.houseSystemUsed === "whole-sign", "Hellenistic transit preset selects Whole Sign houses");
check(
  hellenisticTransit.calculateHouse(autoChart.ascendant.longitude, false) === 1,
  "Hellenistic Whole Sign transit frame puts tropical Ascendant in house 1"
);

// 5. Firdaria: true sect, correct major/sub-period sequence, no false node sub-periods.
const firdaria = new FirdariaEngine();
const dayChart = syntheticSectChart(0);
const nightChart = syntheticSectChart(180);
const dayVenusStart = firdaria.calculateFirdaria(dayChart, 10.5);
check(dayVenusStart.isDiurnal, "Firdaria detects daytime from solar altitude");
check(dayVenusStart.activeMajorLord === "Venus", "Day Firdaria enters Venus major at age 10");
check(dayVenusStart.activeSubLord === "Venus", "Venus major begins with Venus sub-period");
const dayVenusMercury = firdaria.calculateFirdaria(dayChart, 11.2);
check(dayVenusMercury.activeMajorLord === "Venus", "Age 11.2 remains within Venus major");
check(dayVenusMercury.activeSubLord === "Mercury", "Venus major sub-periods follow Chaldean order from Venus");
const dayNode = firdaria.calculateFirdaria(dayChart, 72);
check(dayNode.activeMajorLord === "NorthNode", "Age 72 is within the North Node major period");
check(dayNode.activeSubLord.includes("No sub-period"), "Node major is not divided into seven false sub-periods");
check(dayNode.nightOrder === "nodes-after-planets",
  "Firdaria report records the default node-order variant");
const repeatedCycle = firdaria.calculateFirdaria(dayChart, 76);
check(repeatedCycle.activeMajorLord === "Sun", "The 75-year Firdaria cycle repeats from the beginning");
const nightStart = firdaria.calculateFirdaria(nightChart, 0);
check(!nightStart.isDiurnal, "Firdaria detects night chart from actual solar altitude");
check(nightStart.activeMajorLord === "Moon", "Night Firdaria begins with Moon major");
check(nightStart.activeSubLord === "Moon", "Night Moon major begins with Moon sub-period");
check(nightStart.nightOrder === "nodes-after-planets", "Standard nocturnal Firdaria order is explicit");
const nightNodesAfterMars = firdaria.calculateFirdaria(nightChart, 39, "nodes-after-mars");
check(nightNodesAfterMars.activeMajorLord === "NorthNode",
  "Alternative nocturnal order places the North Node after the first four planetary majors");
check(nightNodesAfterMars.activeSubLord.includes("No sub-period"),
  "Alternative nocturnal node major has no invented seven-planet sub-periods");
check(nightNodesAfterMars.nightOrder === "nodes-after-mars",
  "Alternative nocturnal order is recorded in the Firdaria report");
const nightStandardAge39 = firdaria.calculateFirdaria(nightChart, 39, "nodes-after-planets");
check(nightStandardAge39.activeMajorLord === "Sun",
  "Standard nocturnal order places the Sun after the seven planetary majors");

// 6. Zodiacal Releasing: active L1/L2, 360-day year, angularity from Fortune and LoB.
const zr = new ZodiacalReleasingEngine();
const zrBirth = new Date("2000-01-01T00:00:00.000Z");
const zrOneYear = new Date(zrBirth.getTime() + 360 * 86400000);
const zrAtOneYear = zr.calculateReleasing(
  zrBirth,
  15,
  "Spirit (Career & Purpose)",
  zrOneYear,
  65
);
check(zrAtOneYear.currentL1Period.sign === "Aries", "ZR L1 identifies active Aries chapter after one 360-day year");
check(zrAtOneYear.currentL2Period.sign === "Aries", "ZR L2 starts from parent L1 sign");
check(zrAtOneYear.currentL1Period.angleFromFortune === 11, "ZR angularity is counted from Lot of Fortune");
check(zrAtOneYear.currentL1Period.isPeak === false, "ZR does not mark 11th from Fortune as a peak");
const zrGeminiStart = new Date(zrBirth.getTime() + 23 * 360 * 86400000);
const zrAfterLoB = new Date(zrGeminiStart.getTime() + (211 * 30 + 5) * 86400000);
const zrLoBReport = zr.calculateReleasing(
  zrGeminiStart,
  65,
  "Spirit (Career & Purpose)",
  zrAfterLoB,
  65
);
check(zrLoBReport.currentL1Period.sign === "Gemini", "ZR locates Gemini L1 after Aries and Taurus periods");
check(zrLoBReport.currentL2Period.sign === "Sagittarius", "ZR jumps to sign opposite Gemini after the 211-month L2 circuit");
check(zrLoBReport.currentL2Period.isLoosingOfBond === true, "ZR flags the Loosing of the Bond period");

// 7. Arabian Parts: sect override and 9th-house ruler Travel Lot.
const lotsCalculator = new ArabianPartsCalculator();
const lotCusps = Array.from({ length: 12 }, (_, index) => normalizeDegrees(15 + index * 30));
const lotParams = {
  ascendant: 15,
  sun: 20,
  moon: 70,
  mercury: 80,
  venus: 90,
  mars: 100,
  jupiter: 200,
  saturn: 150,
  houseCusps: lotCusps,
};
const dayLots = lotsCalculator.calculateAll({ ...lotParams, isDayChart: true });
const nightLots = lotsCalculator.calculateAll({ ...lotParams, isDayChart: false });
close(dayLots.partOfFortune.longitude, 65, 1e-9, "Day Fortune uses ASC + Moon - Sun");
close(nightLots.partOfFortune.longitude, 325, 1e-9, "Night Fortune reverses luminary arc");
close(dayLots.partOfTravel.longitude, 70, 1e-9, "Day Travel Lot uses ASC + 9th cusp - 9th ruler");
close(nightLots.partOfTravel.longitude, 70, 1e-9, "Abū Maʿshar / al-Qabīsī Travel Lot uses the same 9th-cusp minus 9th-ruler arc by night");
check(dayLots.partOfTravel.formula.includes("same by day and night"), "Travel Lot formula label identifies the documented invariant sect convention by day");
check(nightLots.partOfTravel.formula.includes("same by day and night"), "Travel Lot formula label identifies the documented invariant sect convention");
close(dayLots.partOfNecessity.longitude, 0, 1e-9, "Day Necessity uses ASC + Fortune - Mercury");
close(nightLots.partOfNecessity.longitude, 130, 1e-9, "Night Necessity reverses the Mercury/Fortune arc");
close(dayLots.partOfCourage.longitude, 340, 1e-9, "Day Courage uses ASC + Fortune - Mars");
close(nightLots.partOfCourage.longitude, 150, 1e-9, "Night Courage reverses the Mars/Fortune arc");
close(dayLots.partOfVictory.longitude, 250, 1e-9, "Day Victory uses ASC + Jupiter - Spirit");
close(nightLots.partOfVictory.longitude, 240, 1e-9, "Night Victory reverses the Jupiter/Spirit arc");
check(dayLots.allParts.length === 15, "Seven Hermetic Lots are included alongside eight supplementary variants");
check(dayLots.partOfNemesis === dayLots.partOfCatastrophe,
  "The canonical Nemesis property aliases the legacy Catastrophe field");
check(dayLots.partOfHealth.interpretation.includes("cannot") &&
  dayLots.partOfHealth.interpretation.includes("diagnose disease"),
  "Health Lot result explicitly cannot diagnose disease or estimate health risk");
check(dayLots.partOfSurgery.interpretation.includes("does not predict surgery"),
  "Mars-Saturn separation Lot explicitly does not predict surgery");


// 8. Transit direction and forecast outputs must be computed, not invented.
const transitDate = new Date("2026-11-12T00:00:00.000Z");
const transitFixtureChart = calculateWesternChart(2000, 1, 1, 12, 0, 51.4769, 0, 0, "Placidus");
const baseTransitEngine = new TransitEngine(transitFixtureChart, transitDate);
const transitingSun = baseTransitEngine.getPlanetaryPositions(transitDate).Sun;
const applyingNatal = {
  ...transitFixtureChart.planets[0],
  id: "SyntheticNatal",
  name: "SyntheticNatal",
  longitude: normalizeDegrees(transitingSun.longitude - 59),
  sign: "Synthetic",
  signDegreeFormatted: "Synthetic natal point",
};
const transitingPlaceholderChart = {
  ...transitFixtureChart,
  planets: transitFixtureChart.planets.map((planet) => planet.name === "Chiron"
    ? { ...planet, longitude: transitingSun.longitude }
    : planet),
};
const transitPlaceholderResults = new TransitEngine(transitingPlaceholderChart, transitDate)
  .getCurrentTransits(transitDate);
check(!transitPlaceholderResults.some((item) => item.natalPlanet === "Chiron"),
  "Transit engine excludes the approximate Chiron placeholder even when a transit is exactly conjunct its stored longitude");

const eclipsePlaceholderChart = {
  ...transitFixtureChart,
  planets: transitFixtureChart.planets.map((planet) => planet.name === "Chiron"
    ? { ...planet, longitude: transitingSun.longitude }
    : planet),
};
const eclipseNatalAspects = new TransitEngine(eclipsePlaceholderChart, transitDate)
  .getEclipseTransits(transitDate);
check(eclipseNatalAspects.every((event) =>
  !event.natalAspects.some((item) => item.includes("Chiron"))
), "Eclipse-to-natal transit overlays exclude the approximate Chiron placeholder");

const applyingChart = { ...transitFixtureChart, planets: [applyingNatal] };
const applyingTransit = new TransitEngine(applyingChart, transitDate)
  .getCurrentTransits(transitDate)
  .find((item) => item.transitingPlanet === "Sun" && item.natalPlanet === "SyntheticNatal" && item.aspect === "Sextile");
check(applyingTransit?.isApplying === true,
  "TransitEngine marks a direct Sun approaching the 60° sextile as applying");
check(Boolean(applyingTransit?.peak.includes("Applying")),
  "Applying transit uses a labelled local linear estimate, not an absolute-speed peak guess");

const separatingNatal = {
  ...applyingNatal,
  longitude: normalizeDegrees(transitingSun.longitude - 61),
};
const separatingChart = { ...transitFixtureChart, planets: [separatingNatal] };
const separatingTransit = new TransitEngine(separatingChart, transitDate)
  .getCurrentTransits(transitDate)
  .find((item) => item.transitingPlanet === "Sun" && item.natalPlanet === "SyntheticNatal" && item.aspect === "Sextile");
check(separatingTransit?.isApplying === false,
  "TransitEngine marks a direct Sun moving away from the 60° sextile as separating");
check(Boolean(separatingTransit?.peak.includes("Separating")),
  "Separating transit is not falsely assigned a future exact peak");
check(
  new TransitEngine(transitFixtureChart, transitDate).calculateTransitDuration("Saturn", "Square").includes("not solved"),
  "Transit duration is not presented as an exact solved interval when ingress/exact/egress are not calculated"
);

const dailySnapshot = new DailyHoroscope(transitFixtureChart).generateDailyHoroscope(transitDate);
check(dailySnapshot.activeTransitCount >= 0, "Daily snapshot reports a geometric active-transit count");
check(dailySnapshot.transitSummary.includes("not a score"), "Daily snapshot discloses that aspect count is not a fortune/energy score");
check(!("overallEnergy" in dailySnapshot), "Daily snapshot no longer emits a fabricated numeric energy score");
check(dailySnapshot.luckyHours.startsWith("Not calculated"),
  "Daily snapshot does not invent lucky-clock hours without location and sunrise/sunset calculation");

const monthlyCalendar = new DailyHoroscope(transitFixtureChart).generateMonthlyForecast(10, 2026);
check(monthlyCalendar.highlights.some((item) => item.title === "Astronomical New Moon"),
  "Monthly calendar contains a dynamically searched astronomical New Moon");
check(monthlyCalendar.highlights.some((item) => item.title === "Astronomical Full Moon"),
  "Monthly calendar contains a dynamically searched astronomical Full Moon");
check(monthlyCalendar.highlights.every((item) => {
  const time = Date.parse(item.date + "T00:00:00.000Z");
  return time >= Date.UTC(2026, 10, 1) && time < Date.UTC(2026, 11, 1);
}), "Monthly lunar-phase events are inside the selected UTC month");

const timingWindows = new TransitEngine(transitFixtureChart, transitDate).getTimingWindows();
check(Object.values(timingWindows).every((window) =>
  window.bestTimes.length === 0 && window.challengingTimes.length === 0 &&
  window.nextOpportunity === "Not calculated"
), "Timing-window panel does not emit invented date-free best days or next opportunities");

// 9. Eclipse events are dynamically searched, sorted, and not drawn from expired fixed dates.
const eclipseChart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, -74.006, -5, "Placidus");
const eclipseStart = new Date("2026-11-12T00:00:00.000Z");
const eclipses = new EclipseAnalyzer().analyzeEclipses(eclipseChart, eclipseStart, 2);
check(eclipses.length >= 2, "Dynamic eclipse search returns events in next two years");
check(eclipses.some((event) => event.type.includes("Solar")), "Dynamic eclipse search includes a global solar event");
check(eclipses.some((event) => event.type.includes("Lunar")), "Dynamic eclipse search includes a lunar event");
check(
  eclipses.every((event) => new Date(event.peakUtc).getTime() >= eclipseStart.getTime()),
  "Dynamic eclipse search does not return expired hard-coded events"
);
check(
  eclipses.every((event, index) => index === 0 || eclipses[index - 1].peakUtc <= event.peakUtc),
  "Dynamic eclipse events are sorted by peak time"
);

// 10. Fixed-star data are explicitly reference entries, not a falsely claimed 35+ catalogue.
check(FixedStarsEngine.FIXED_STARS.length === 20, "Fixed-star catalogue count matches the 20 implemented reference entries");
const fixedStarsEngine = new FixedStarsEngine();
check(fixedStarsEngine.isCatalogueEpochCompatible(oldEpochChart),
  "J2000 fixed-star reference catalogue is compatible with a J2000 chart epoch");
check(!fixedStarsEngine.isCatalogueEpochCompatible(faganReferenceChart),
  "The J2000-only fixed-star catalogue is not marked compatible with a modern chart epoch");
check(fixedStarsEngine.calculateStarContacts(faganReferenceChart).length === 0,
  "Modern fixed-star contacts remain uncalculated rather than using unadjusted J2000 longitudes");
const regulus = FixedStarsEngine.FIXED_STARS.find((star) => star.name.includes("Regulus"));
check(Boolean(regulus && Math.abs(regulus.longitude - 149.83) < 0.05),
  "Regulus J2000 tropical longitude reference is near Leo 29 degrees 50 minutes");

// 11. The dedicated deep Western benchmark runner must report meaningful passing assertions.
const benchmarkChart = calculateWesternChart(2000, 1, 1, 12, 0, 51.4769, 0, 0, "Placidus");
const benchmark = new WesternBenchmarkRunner().runFullSuite(benchmarkChart);
check(benchmark.totalTests >= 25, "Western deep benchmark suite executes its expected test set");
check(
  benchmark.failedCount === 0,
  "Western deep benchmark suite has no failed assertions: " +
    benchmark.results.filter((item) => !item.passed).map((item) => item.id + ":" + item.actual).join(" | ")
);

console.log("Western calculation integrity suite passed: " + assertions + " assertions; deep benchmark " +
  benchmark.passedCount + "/" + benchmark.totalTests + ".");

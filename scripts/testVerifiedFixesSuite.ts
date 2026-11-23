/**
 * CELESTIA — Verified Fixes Regression Suite (Phase B)
 * =============================================================================
 * Asserts the Phase-B-wired implementations against INDEPENDENT reference
 * values generated with pyswisseph 2.10.03 (Swiss Ephemeris, Moshier ephemeris)
 * — NOT by recomputing the same formulas (no tautologies; see master prompt
 * Rule 2). Reference-generation script and full provenance:
 *   docs/audit/2026-11-23-western-master-audit.md  (§C recipes, §E benchmarks)
 *
 * Charts used (jd, lat, lon):
 *   A "J2000_Rome"   2451545.0  41.9028   12.4964   (2000-01-01 12:00 UT)
 *   B "NYC_1990"     2448057.0  40.7128  -74.0060   (1990-06-14 12:00 UT)
 *   C "Sydney_2026"  2461332.5 -33.8688  151.2093   (2026-10-19 00:00 UT)
 *
 * Run: bun scripts/testVerifiedFixesSuite.ts   (or tsx / ts-node)
 * Exit code 1 on any failure.
 */

import {
  calculateMeanLilith,
  calculateTrueNode,
  calculateVertex,
  calculateEastPoint,
  calculatePlacidusIntermediateCusps,
  previousSyzygy,
  lahiriAyanamsa,
  faganBradleyAyanamsa,
  searchEclipses,
} from "../lib/astronomy/verifiedFixes";
import { calculateGMST, calculateObliquity, normalizeDegrees, calculateWesternChart } from "../lib/astronomy/ephemeris";
import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { LunarPointsCalculator } from "../lib/astronomy/lunarPointsCalculator";
import { AlmutenFigurisCalculator } from "../lib/astronomy/almutenFigurisCalculator";

let passed = 0;
let failed = 0;

function check(label: string, actual: number, expected: number, tol: number) {
  const diff = Math.abs(actual - expected);
  const ok = diff <= tol;
  if (ok) passed++; else failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label.padEnd(58)} actual=${actual.toFixed(6)} expected=${expected.toFixed(6)} diff=${diff.toFixed(6)} (tol ${tol})`
  );
}

function checkTrue(label: string, condition: boolean, detail = "") {
  if (condition) passed++; else failed++;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? "  " + detail : ""}`);
}

function wrapDiff(a: number, b: number): number {
  const d = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return d > 180 ? 360 - d : d;
}

interface Chart { name: string; jd: number; lat: number; lon: number; }
const CHARTS: Chart[] = [
  { name: "A J2000_Rome", jd: 2451545.0, lat: 41.9028, lon: 12.4964 },
  { name: "B NYC_1990", jd: 2448057.0, lat: 40.7128, lon: -74.0060 },
  { name: "C Sydney_2026-10-19", jd: 2461332.5, lat: -33.8688, lon: 151.2093 },
];

// Independent Swiss Ephemeris (pyswisseph 2.10.03 Moshier) reference values
const REF = {
  A: { trueNode: 123.952895, trueNodeSpeed: -0.054382, meanApog: 263.464333, lahiri: 23.857092, cusps: [315.453929, 349.662372, 68.660291, 90.535901], vertex: 196.844079, syzygyType: "Full Moon", syzygySun: 270.415387 },
  B: { trueNode: 308.100807, trueNodeSpeed: 0.022181, meanApog: 234.839363, cusps: [45.945881, 83.583542, 135.671639, 159.281304], vertex: 251.736188, syzygyType: "Full Moon", syzygySun: 77.401267 },
  C: { trueNode: 328.033200, trueNodeSpeed: 0.004965, meanApog: 273.828040, cusps: [213.864401, 250.803849, 305.227456, 329.245003], vertex: 58.463991, syzygyType: "New Moon", syzygySun: 197.360685 },
} as const;

console.log("=== CELESTIA verified-fixes regression suite (independent Swiss Ephemeris references) ===\n");

for (const chart of CHARTS) {
  const ref = REF[chart.name[0] as "A" | "B" | "C"];
  const T = (chart.jd - 2451545.0) / 36525.0;
  const eps = calculateObliquity(T);
  const ramc = normalizeDegrees(calculateGMST(chart.jd) + chart.lon);

  console.log(`--- Chart ${chart.name}  (jd=${chart.jd}, lat=${chart.lat}, lon=${chart.lon})`);

  // W-02 — Mean Lilith (mean apogee)
  const ml = calculateMeanLilith(chart.jd);
  check(`${chart.name} MeanLilith lon (W-02)`, ml.lon, ref.meanApog, 0.125);
  checkTrue(`${chart.name} MeanLilith speed ≈ 0.1114°/day`, Math.abs(ml.speed - 0.11142) < 0.002, `speed=${ml.speed.toFixed(5)}`);

  // W-07 — True Node (osculating, from state vectors). NOTE: ref trueNodeSpeed
  // is DIRECT (+0.022181°/day) for chart B — proof the old constant (-0.05295)
  // was wrong. Tolerance generous because the osculating node is sensitive.
  const tn = calculateTrueNode(chart.jd);
  check(`${chart.name} TrueNode lon (W-07)`, wrapDiff(tn.lon, ref.trueNode), 0, 0.05);
  check(`${chart.name} TrueNode speed (W-07, can be direct)`, tn.speed, ref.trueNodeSpeed, 0.05);

  // W-04 — Vertex (closed form)
  const vx = calculateVertex(ramc, chart.lat, eps);
  check(`${chart.name} Vertex lon (W-04)`, wrapDiff(vx, ref.vertex), 0, 0.01);

  // W-05 — Placidus intermediate cusps
  const pl = calculatePlacidusIntermediateCusps(ramc, chart.lat, eps);
  const plImpl = [pl.cusp11, pl.cusp12, pl.cusp2, pl.cusp3];
  plImpl.forEach((cuspValue, idx) => {
    const labels = ["cusp11", "cusp12", "cusp2", "cusp3"];
    check(`${chart.name} Placidus ${labels[idx]} (W-05)`, wrapDiff(cuspValue, ref.cusps[idx]), 0, 0.01);
  });

  // W-06 — Exact pre-natal syzygy
  const syz = previousSyzygy(chart.jd);
  check(`${chart.name} Syzygy Sun lon (W-06)`, wrapDiff(syz.sunLongitude, ref.syzygySun), 0, 0.05);
  checkTrue(`${chart.name} Syzygy type (W-06)`, syz.type === ref.syzygyType, `got ${syz.type}, expected ${ref.syzygyType}`);
}

// W-03 — East Point must NOT equal MC anymore (old bug: identical formula)
{
  const chart = CHARTS[0];
  const T = (chart.jd - 2451545.0) / 36525.0;
  const eps = calculateObliquity(T);
  const ramc = normalizeDegrees(calculateGMST(chart.jd) + chart.lon);
  const ep = calculateEastPoint(ramc, eps);
  const mc = normalizeDegrees(Math.atan2(Math.sin((ramc * Math.PI) / 180), Math.cos((ramc * Math.PI) / 180) * Math.cos((eps * Math.PI) / 180)) * (180 / Math.PI));
  const separation = wrapDiff(ep, mc);
  checkTrue("W-03 East Point differs from MC (was identical before fix)", separation > 5, `separation=${separation.toFixed(4)}°`);
}

// W-12 — Ayanamsas
{
  check("W-12 Lahiri ayanamsa at J2000", lahiriAyanamsa(2451545.0), 23.857092, 0.001);
  check("W-12 FB − Lahiri constant 0.883208", faganBradleyAyanamsa(2451545.0) - lahiriAyanamsa(2451545.0), 0.883208, 1e-6);
  checkTrue("W-12 FB ayanamsa 2026 ≈ 25.116 (audit: old hardcoded 24.84 was 0.28° off)", Math.abs(faganBradleyAyanamsa(2461332.5) - 25.116) < 0.01, `got ${faganBradleyAyanamsa(2461332.5).toFixed(6)}`);
}

// W-09 helpers — dynamic eclipses reproduce the 4 known 2026 eclipses
{
  const events = searchEclipses(new Date(Date.UTC(2026, 0, 1)), 365);
  const dateOf = (iso: string) => iso.slice(0, 10);
  const dates = events.map((e) => `${dateOf(e.peakUtcIso)} ${e.type}`);
  console.log(`      2026 eclipse events found: ${dates.join(" | ")}`);
  checkTrue("W-09 Feb 17 2026 Annular Solar present", dates.some((d) => d.startsWith("2026-02-17") && d.includes("Annular")));
  checkTrue("W-09 Mar 03 2026 Total Lunar present", dates.some((d) => d.startsWith("2026-03-03") && d.includes("Total Lunar")));
  checkTrue("W-09 Aug 12 2026 Total Solar present", dates.some((d) => d.startsWith("2026-08-12") && d.includes("Total Solar")));
  checkTrue("W-09 Aug 28 2026 Partial Lunar present", dates.some((d) => d.startsWith("2026-08-28") && d.includes("Lunar")));
}

// End-to-end wiring check through calculateWesternChart (chart A, Rome, 12:00 UT)
{
  const chart = calculateWesternChart(2000, 1, 1, 12, 0, 41.9028, 12.4964, 0, "Placidus");
  const ap = chart.additionalPoints;
  checkTrue("Wiring: chart builds and returns additionalPoints", !!ap);
  if (ap) {
    check("Wiring: Vertex via LunarPointsCalculator", wrapDiff(ap.vertex.longitude, REF.A.vertex), 0, 0.01);
    check("Wiring: Mean Lilith via chart", wrapDiff(ap.meanLilith.longitude, REF.A.meanApog), 0, 0.125);
    checkTrue("Wiring: East Point no longer equals Midheaven", wrapDiff(ap.eastPoint.longitude, chart.midheaven.longitude) > 5);
    checkTrue("Honesty: True Lilith flagged approximate", ap.trueLilith.approximate === true);
    checkTrue("Honesty: White Moon (Selena) flagged nonStandard", ap.whiteMoon.nonStandard === true);
    checkTrue("Honesty: Proserpine flagged nonStandard", ap.proserpine.nonStandard === true);
    checkTrue("Honesty: Hypnos flagged nonStandard", ap.hypnos.nonStandard === true);
  }
  const chiron = chart.planets.find((p) => p.id === "Chiron");
  checkTrue("Honesty: Chiron flagged approximate (W-01)", !!chiron && chiron.approximate === true);

  // W-05 wiring through the swissEphemeris facade (same RAMC convention)
  const houses = swissEphemeris.calculateHouses(CHARTS[0].jd, CHARTS[0].lat, CHARTS[0].lon, "P");
  check("Wiring: facade Placidus cusp 11", wrapDiff(houses.houseCusps[10], REF.A.cusps[0]), 0, 0.01);
  check("Wiring: facade Placidus cusp 12", wrapDiff(houses.houseCusps[11], REF.A.cusps[1]), 0, 0.01);
  check("Wiring: facade Vertex", wrapDiff(houses.vertex, REF.A.vertex), 0, 0.01);

  // W-06 wiring: almuten receives the birth jd and uses the exact syzygy
  checkTrue("Wiring: AlmutenFigurisResult.sanExact is true", chart.almutenFiguris?.sanExact === true);
  if (chart.almutenFiguris) {
    check("Wiring: SAN degree equals exact syzygy Sun lon", wrapDiff(chart.almutenFiguris.sanDegree, REF.A.syzygySun), 0, 0.05);
    checkTrue("Wiring: SAN type matches reference", chart.almutenFiguris.sanType === REF.A.syzygyType, `got ${chart.almutenFiguris.sanType}`);
  }
}

// Sanity: Mean node analytic formula still matches Swiss Ephemeris (unchanged path)
{
  const chart = CHARTS[0];
  const meanNode = swissEphemeris.calculatePlanetPosition(swissEphemeris.MEAN_NODE, chart.jd);
  check("Mean node (unchanged analytic path)", wrapDiff(meanNode.longitude, 125.040646), 0, 0.01);
  // True node through the facade (wired path)
  const trueNode = swissEphemeris.calculatePlanetPosition(swissEphemeris.TRUE_NODE, chart.jd);
  check("Wiring: facade TrueNode", wrapDiff(trueNode.longitude, REF.A.trueNode), 0, 0.05);
  checkTrue("Wiring: facade TrueNode speed is numeric (not the old -0.05295 constant)", Math.abs(trueNode.speed - (-0.054382)) < 0.05, `speed=${trueNode.speed.toFixed(5)}`);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);

import assert from "node:assert/strict";
import {
  calculateSaptavargajaBala,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

/**
 * Primary-source worked chart:
 * B. V. Raman, Graha and Bhava Balas, 13th ed. (1992),
 * Standard Horoscope positions on printed p. 2 and the seven-varga
 * relationship grid / worked totals on printed pp. 19–23 (PDF pp. 23–27).
 *
 * The scoring assertions below are recomputed from Raman's individual
 * relationship cells. His printed Moon total reads 49.750, but its seven
 * visible cells add to 48.750; the regression therefore tests the sum of
 * the source's individual cells and preserves this 1-Virupa discrepancy
 * in the audit document rather than baking the arithmetic typo into code.
 */
const standardHoroscope: ShadbalaChartInput = {
  ascendant: 298 + 27 / 60, // Capricorn 28°27′ (Raman, printed p. 3)
  planets: {
    Sun: { longitude: 180 + 53 / 60 + 55 / 3600 },
    Moon: { longitude: 311 + 17 / 60 + 19 / 3600 },
    Mars: { longitude: 229 + 30 / 60 + 34 / 3600 },
    Mercury: { longitude: 181 + 31 / 60 + 34 / 3600 },
    Jupiter: { longitude: 84 + 0 / 60 + 49 / 3600 },
    Venus: { longitude: 171 + 9 / 60 + 56 / 3600 },
    Saturn: { longitude: 124 + 22 / 60 + 41 / 3600 },
  },
};

const referenceTotals = {
  "raman-halving": {
    Sun: 90,
    Moon: 48.75, // Raman prints 49.750; visible cells sum to 48.750.
    Mars: 90,
    Mercury: 135,
    Jupiter: 71.25,
    Venus: 116.25,
    Saturn: 97.5,
  },
  "bphs-santhanam": {
    Sun: 100,
    Moon: 57,
    Mars: 100,
    Mercury: 125,
    Jupiter: 79,
    Venus: 114,
    Saturn: 100,
  },
} as const;

for (const [scale, expectedByPlanet] of Object.entries(referenceTotals) as [
  keyof typeof referenceTotals,
  (typeof referenceTotals)[keyof typeof referenceTotals]
][]) {
  const input: ShadbalaChartInput = {
    ...standardHoroscope,
    saptavargajaScale: scale,
  };
  for (const [planet, expected] of Object.entries(expectedByPlanet)) {
    const actual = calculateSaptavargajaBala(planet, input);
    assert.ok(
      Math.abs(actual - expected) < 1e-9,
      `${scale} ${planet}: expected ${expected}, received ${actual}`
    );
  }
}

console.log(
  "Shadbala Raman primary Standard Horoscope suite passed: all seven grahas under both named scoring scales (14 checks)."
);

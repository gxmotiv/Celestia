import assert from "node:assert/strict";
import {
  calculateSaptavargajaBala,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

/**
 * Independent worked-chart fixture:
 * B. V. Raman, Graha and Bhava Balas (1942), Standard Horoscope, as
 * transcribed and recalculated in:
 * https://www.livepanditji.com/blog/sthana-bala-saptavargaja-ojayugma-kendradi-drekkana/
 *
 * The reference publishes the seven graha longitudes and the D1/D2/D3/D7/
 * D9/D12/D30 dignity table. It also explicitly notes two inconsistencies in
 * Raman's original printed cells (Mars D30 and Saturn D7), so the expected
 * values below use the source page's recalculated cell grid, not the two
 * disputed original cells. All seven expected totals are stated there for
 * both the Raman halving scale and the R. Santhanam BPHS scale.
 */
const standardHoroscope: ShadbalaChartInput = {
  ascendant: 9 * 30 + 24 + 57 / 60, // Capricorn 24°57′
  planets: {
    Sun: { longitude: 5 * 30 + 29 + 8 / 60 },       // Virgo 29°08′
    Moon: { longitude: 10 * 30 + 11 + 40 / 60 },    // Aquarius 11°40′
    Mars: { longitude: 7 * 30 + 19 + 49 / 60 },     // Scorpio 19°49′
    Mercury: { longitude: 6 * 30 + 0 + 33 / 60 },   // Libra 00°33′
    Jupiter: { longitude: 2 * 30 + 23 + 35 / 60 },  // Gemini 23°35′
    Venus: { longitude: 5 * 30 + 20 + 4 / 60 },     // Virgo 20°04′
    Saturn: { longitude: 4 * 30 + 4 + 51 / 60 },    // Leo 04°51′
  },
};

const referenceTotals = {
  "raman-halving": {
    Sun: 129.375,
    Moon: 48.75,
    Mars: 90,
    Mercury: 150,
    Jupiter: 71.25,
    Venus: 110.625,
    Saturn: 97.5,
  },
  "bphs-santhanam": {
    Sun: 127,
    Moon: 57,
    Mars: 100,
    Mercury: 135,
    Jupiter: 79,
    Venus: 106,
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
  "Shadbala Raman Standard Horoscope suite passed: all seven grahas under both named scoring scales (14 checks)."
);

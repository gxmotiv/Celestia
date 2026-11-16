import assert from "node:assert/strict";
import {
  calculateSaptavargajaBala,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

const chart: ShadbalaChartInput = {
  ascendant: 0,
  planets: {
    Sun: { longitude: 10 },       // Aries
    Moon: { longitude: 40 },      // Taurus
    Mars: { longitude: 70 },      // Gemini
    Mercury: { longitude: 190 },  // Libra
    Jupiter: { longitude: 220 },  // Scorpio
    Venus: { longitude: 340 },    // Pisces
    Saturn: { longitude: 280 },   // Capricorn
  },
};

// Sun's seven varga signs are:
// D1 Aries (Mars: natural+temporary friend = 20)
// D2 Leo (Sun own = 30)
// D3 Leo (Sun own = 30)
// D7 Gemini (Mercury: natural neutral + temporary enemy = enemy = 4)
// D9 Cancer (Moon: natural+temporary friend = 20)
// D12 Leo (Sun own = 30)
// D30 Sagittarius (Jupiter: natural friend + temporary enemy = neutral = 10)
assert.equal(
  calculateSaptavargajaBala("Sun", chart),
  144,
  "BPHS/Santhanam Saptavargaja must score seven independent varga placements"
);

assert.equal(
  calculateSaptavargajaBala("Sun", {
    ...chart,
    saptavargajaScale: "raman-halving",
  }),
  146.25,
  "Raman's alternative halving scale must remain selectable and distinct"
);

// BPHS 3.51 places the Sun's Moolatrikona in Leo 0°–20°.
// This fixture has Sun at 10° Leo and independently known scores in the
// remaining six vargas; the D1 score is 45, not the ordinary own-sign 30.
const sunInMoolatrikona = {
  ...chart,
  planets: {
    ...chart.planets,
    Sun: { longitude: 130 },
  },
};
assert.equal(
  calculateSaptavargajaBala("Sun", sunInMoolatrikona),
  157,
  "D1 Moolatrikona must receive 45 Virupas under the declared D1-only policy"
);

// Raman, Graha and Bhava Balas, Article 30 (printed p. 23):
// the 45-Virupa Moolatrikona award applies in D1 only, not the other
// six vargas. Sun at 15° Aries is not D1 Moolatrikona, but maps to Leo
// (Sun's Moolatrikona sign) in both D3 and D9. Those varga placements
// must therefore score as own-sign 30, not 45.
const sunMoolatrikonaOnlyInOtherVargas: ShadbalaChartInput = {
  ...chart,
  planets: {
    ...chart.planets,
    Sun: { longitude: 15 },
  },
};
assert.equal(
  calculateDivisionalSignIndex(15, "D3"),
  4,
  "15° Aries must map to Leo in D3 for this source-profile regression"
);
assert.equal(
  calculateDivisionalSignIndex(15, "D9"),
  4,
  "15° Aries must map to Leo in D9 for this source-profile regression"
);
assert.equal(
  calculateSaptavargajaBala("Sun", sunMoolatrikonaOnlyInOtherVargas),
  140,
  "BPHS/Santhanam scoring must not award 45 for D3/D9 Moolatrikona-like varga signs"
);
assert.equal(
  calculateSaptavargajaBala("Sun", {
    ...sunMoolatrikonaOnlyInOtherVargas,
    saptavargajaScale: "raman-halving",
  }),
  142.5,
  "Raman scoring must also restrict the 45-Virupa Moolatrikona award to D1"
);

assert.throws(
  () => calculateSaptavargajaBala("Sun", {
    ascendant: 0,
    planets: { Sun: { longitude: 10 } },
  }),
  /all seven classical planetary longitudes/,
  "The calculation must not guess a compound relationship when the required graha positions are absent"
);

assert.throws(
  () => calculateSaptavargajaBala("Rahu", chart),
  /seven classical planets/,
  "This Shadbala Saptavargaja implementation is restricted to the seven classical grahas"
);

console.log("Shadbala Saptavargaja suite passed: seven vargas, two score scales, D1 Moolatrikona, and missing-input guards.");

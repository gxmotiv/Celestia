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

import assert from "node:assert/strict";
import { ShadbalaEngine } from "../lib/vedic/shadbalaEngine";

const engine = new ShadbalaEngine();
const midheaven = 110;
const ascendant = 0;
const positions = {
  Sun: { longitude: midheaven },
  Mars: { longitude: midheaven },
  Moon: { longitude: 290 },
  Venus: { longitude: 290 },
  Saturn: { longitude: 180 },
  Jupiter: { longitude: ascendant },
  Mercury: { longitude: ascendant },
};
const chart = { ascendant, midheaven, planets: positions };

for (const planet of ["Sun", "Mars", "Moon", "Venus", "Saturn", "Jupiter", "Mercury"]) {
  const result = engine.calculateDigBala(planet, chart);
  assert.equal(result.points, 60, `${planet} must receive 60 Virupas at its actual directional peak`);
  assert.equal(result.angularDistance, 0, `${planet} must have zero angular distance at its actual directional peak`);
}

// When no Midheaven is available, the documented compatibility fallback is retained.
const fallback = engine.calculateDigBala("Sun", {
  ascendant: 0,
  planets: { Sun: { longitude: 270 } },
});
assert.equal(fallback.points, 60);
assert.equal(fallback.angularDistance, 0);
assert.match(fallback.description, /no Midheaven was supplied/);

console.log("Shadbala Dig Bala suite passed: chart-derived MC/IC and the documented fallback.");

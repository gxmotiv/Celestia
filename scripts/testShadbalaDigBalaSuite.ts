import assert from "node:assert/strict";
import {
  ShadbalaEngine,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

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
const chart: ShadbalaChartInput = { ascendant, midheaven, planets: positions };

// BPHS 27.7-8 and Raman Ch. IV, Arts. 42-45: each graha's peak direction
// receives 60 Virupas, with a linear decline to zero at the opposite point.
const expectedStrongestHouse: Record<string, number> = {
  Jupiter: 1,
  Mercury: 1,
  Sun: 10,
  Mars: 10,
  Saturn: 7,
  Moon: 4,
  Venus: 4,
};
for (const planet of ["Sun", "Mars", "Moon", "Venus", "Saturn", "Jupiter", "Mercury"]) {
  const result = engine.calculateDigBala(planet, chart);
  assert.equal(result.points, 60, `${planet} must receive 60 Virupas at its actual directional peak`);
  assert.equal(result.angularDistance, 0, `${planet} must have zero angular distance at its actual directional peak`);
  assert.equal(result.strongestHouse, expectedStrongestHouse[planet]);
  assert.equal(result.available, true);
  assert.equal(result.estimated, false);
}

// A supplied Midheaven is essential for the meridian/nadir pair, but not for
// the Ascendant/Descendant pair. Do not mark Jupiter, Mercury, or Saturn
// approximate merely because the optional Midheaven is absent.
const noMidheavenPositions = {
  Sun: { longitude: 270 },
  Mars: { longitude: 270 },
  Moon: { longitude: 90 },
  Venus: { longitude: 90 },
  Saturn: { longitude: 180 },
  Jupiter: { longitude: 0 },
  Mercury: { longitude: 0 },
};
const noMidheavenChart: ShadbalaChartInput = {
  ascendant: 0,
  planets: noMidheavenPositions,
};
for (const planet of ["Jupiter", "Mercury", "Saturn"]) {
  const result = engine.calculateDigBala(planet, noMidheavenChart);
  assert.equal(result.points, 60);
  assert.equal(result.available, true);
  assert.equal(result.estimated, false);
}
for (const planet of ["Sun", "Mars", "Moon", "Venus"]) {
  const result = engine.calculateDigBala(planet, noMidheavenChart);
  assert.equal(result.points, 60);
  assert.equal(result.available, true);
  assert.equal(result.estimated, true);
  assert.match(result.description, /approximate/);
}

// Shadbala-level estimate flags are planet-specific: without MC, only the
// four meridian/nadir-dependent grahas receive an approximate Dig Bala note.
const jupiterShadbala = engine.calculateShadbala("Jupiter", noMidheavenChart);
assert.equal(
  jupiterShadbala.estimatedComponents.some((item) => item.includes("Dig Bala")),
  false,
  "Jupiter's Ascendant peak is exact without a Midheaven"
);
const sunShadbala = engine.calculateShadbala("Sun", noMidheavenChart);
assert.equal(
  sunShadbala.estimatedComponents.some((item) => item.includes("Dig Bala")),
  true,
  "Sun's meridian peak must be disclosed as approximate without a chart-derived Midheaven"
);
const incompleteJupiter = engine.calculateShadbala("Jupiter", {
  ...noMidheavenChart,
  ascendant: Number.NaN,
});
assert.ok(
  incompleteJupiter.unavailableComponents.some((item) => item.startsWith("Dig Bala:")),
  "An unavailable Dig Bala must make the six-fold subtotal explicitly incomplete"
);
assert.equal(
  incompleteJupiter.totalVirupas,
  Math.round((
    incompleteJupiter.sthanaBala.total +
    incompleteJupiter.kalaBala.total +
    incompleteJupiter.cheshtaBala.points +
    incompleteJupiter.naisargikaBala.points +
    incompleteJupiter.drikBala.points
  ) * 100) / 100,
  "An unavailable Dig Bala must contribute no fabricated score to the subtotal"
);

// Raman's Standard Horoscope (13th ed., 1992), printed pp. 2-3, 31-33:
// Example 14 supplies the powerless-point arcs; Example 15 divides those
// arcs by 3. The assertions recompute from the printed longitudes and the
// 1st/4th/7th/10th bhava midpoints, rather than copying apparent arithmetic
// slips in the printed Mercury/Jupiter final-value column.
const ramanStandardHoroscope: ShadbalaChartInput = {
  ascendant: 298 + 27 / 60, // 298°27′
  midheaven: 216 + 36 / 60, // 216°36′; 4th is the opposite 36°36′
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
const ramanExample15 = {
  Sun: 48.10,
  Moon: 31.56,
  Mars: 55.70,
  Mercury: 21.03,
  Jupiter: 11.48,
  Venus: 15.14,
  Saturn: 58.02,
};
for (const [planet, expected] of Object.entries(ramanExample15)) {
  const result = engine.calculateDigBala(planet, ramanStandardHoroscope);
  assert.equal(result.available, true, `Raman Standard Horoscope ${planet} must be computable`);
  assert.ok(result.points !== null);
  assert.ok(
    Math.abs(result.points - expected) <= 0.015,
    `Raman Example 15 ${planet}: expected ${expected}, received ${result.points}`
  );
}

// The optional MC is only replaceable by the explicitly disclosed
// ascendant-quadrant approximation when it is absent. Invalid supplied data
// must never be silently treated as "not supplied".
for (const invalidMidheaven of [Number.NaN, Number.POSITIVE_INFINITY, -0.01, 360]) {
  const result = engine.calculateDigBala("Sun", {
    ascendant: 0,
    midheaven: invalidMidheaven,
    planets: { Sun: { longitude: 270 } },
  });
  assert.equal(result.points, null);
  assert.equal(result.available, false);
  assert.ok(result.unavailableComponents.some((item) => item.includes("Midheaven")));
}
const validMeridianWithoutAscendant = engine.calculateDigBala("Sun", {
  ascendant: Number.NaN,
  midheaven: 110,
  planets: { Sun: { longitude: 110 } },
});
assert.equal(validMeridianWithoutAscendant.points, 60);
assert.equal(validMeridianWithoutAscendant.available, true);
assert.equal(validMeridianWithoutAscendant.actualHouse, null);
assert.equal(validMeridianWithoutAscendant.estimated, false);

for (const invalidAscendant of [Number.NaN, Number.POSITIVE_INFINITY, -0.01, 360]) {
  for (const planet of ["Jupiter", "Mercury", "Saturn"]) {
    const result = engine.calculateDigBala(planet, {
      ascendant: invalidAscendant,
      planets: { [planet]: { longitude: 0 } },
    });
    assert.equal(result.points, null);
    assert.equal(result.available, false);
    assert.ok(result.unavailableComponents.length > 0);
  }
}
const noAngleData = engine.calculateDigBala("Sun", {
  ascendant: Number.NaN,
  planets: { Sun: { longitude: 270 } },
});
assert.equal(noAngleData.points, null);
assert.equal(noAngleData.available, false);

// A bad/missing target longitude or an unsupported graha must not become a
// fabricated zero/House-1 score.
for (const badPosition of [undefined, { longitude: Number.NaN }, { longitude: 360 }]) {
  const result = engine.calculateDigBala("Sun", {
    ascendant: 0,
    midheaven: 270,
    planets: badPosition ? { Sun: badPosition } : {},
  });
  assert.equal(result.points, null);
  assert.equal(result.available, false);
}
assert.throws(
  () => engine.calculateDigBala("Rahu", chart),
  /seven classical planets/,
  "Dig Bala must reject non-classical targets"
);

// Linear interpolation and cyclic wraparound: 90° from peak = 30 Virupas;
// 180° from peak = 0 Virupas; 1° across 0°/360° = 59.67 Virupas.
const halfStrength = engine.calculateDigBala("Sun", {
  ascendant: 0,
  midheaven: 270,
  planets: { Sun: { longitude: 0 } },
});
assert.equal(halfStrength.angularDistance, 90);
assert.equal(halfStrength.points, 30);
const powerless = engine.calculateDigBala("Sun", {
  ascendant: 0,
  midheaven: 270,
  planets: { Sun: { longitude: 90 } },
});
assert.equal(powerless.angularDistance, 180);
assert.equal(powerless.points, 0);
const wraparound = engine.calculateDigBala("Sun", {
  ascendant: 0,
  midheaven: 359,
  planets: { Sun: { longitude: 0 } },
});
assert.equal(wraparound.angularDistance, 1);
assert.equal(wraparound.points, 59.67);

console.log(
  "Shadbala Dig Bala suite passed: directional peaks, planet-specific MC dependency, Raman Standard Horoscope, invalid-input handling, and angular boundaries."
);

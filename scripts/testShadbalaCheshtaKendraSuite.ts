import assert from "node:assert/strict";
import {
  calculateCheshtaKendra,
  ShadbalaEngine,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

const close = (actual: number, expected: number, label: string, tolerance = 0.015) => {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected}, received ${actual}`);
};

// Raman, Graha and Bhava Balas, Chapter VI, Standard Horoscope,
// Examples 49–51. The mean longitudes and Seeghrochas are the exact values
// printed in Articles 99 and 104. True longitudes are the Standard Horoscope
// positions used by Raman in Example 49.
const standardInput: ShadbalaChartInput = {
  ascendant: 0,
  planets: {
    Sun: { longitude: 179 + 8 / 60, meanLongitude: 181.23 },
    Moon: { longitude: 311 + 40 / 60 },
    Mars: {
      longitude: 229.50,
      meanLongitude: 266.34,
      dailyMotion: -0.20,
      isRetrograde: true,
    },
    Mercury: {
      longitude: 181.52,
      seeghrochaLongitude: 174.49,
      dailyMotion: 1.20,
    },
    Jupiter: {
      longitude: 84.01,
      meanLongitude: 66.91,
      dailyMotion: 0.08,
    },
    Venus: {
      longitude: 171.16,
      seeghrochaLongitude: 158.35,
      dailyMotion: 1.00,
    },
    Saturn: {
      longitude: 124.39,
      meanLongitude: 111.23,
      dailyMotion: 0.03,
    },
  },
};

const engine = new ShadbalaEngine();

const expected = {
  Mars: { kendra: 293.31, reduced: 66.69, points: 22.23 },
  Mercury: { kendra: 353.115, reduced: 6.885, points: 2.30 },
  Jupiter: { kendra: 105.77, reduced: 105.77, points: 35.26 },
  Venus: { kendra: 342.155, reduced: 17.845, points: 5.95 },
  Saturn: { kendra: 63.42, reduced: 63.42, points: 21.14 },
} as const;

// 1. All five non-luminary grahas reproduce Raman's published worked chart.
for (const planet of ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const) {
  const result = engine.calculateCheshtaBala(planet, standardInput);
  assert.equal(result.available, true, `${planet} should be available when its source inputs are present`);
  assert.equal(result.state, "Kendra computed");
  assert.ok(result.details, `${planet} must expose the Kendra calculation trace`);
  close(result.details.rawKendraDegrees, expected[planet].kendra, `${planet} raw Kendra`);
  close(result.details.reducedKendraDegrees, expected[planet].reduced, `${planet} reduced Kendra`);
  close(result.points, expected[planet].points, `${planet} Raman Example 51 Cheshta Bala`);
}

// 2. Inferior planets use mean Sun as the mean position and their own
// tabulated apogee as Seeghrocha (Raman Articles 95, 100, 102-104).
{
  const mercury = engine.calculateCheshtaBala("Mercury", standardInput);
  const venus = engine.calculateCheshtaBala("Venus", standardInput);
  assert.equal(mercury.details?.meanLongitude, standardInput.planets.Sun.meanLongitude);
  assert.equal(venus.details?.meanLongitude, standardInput.planets.Sun.meanLongitude);
  assert.equal(mercury.details?.seeghrochaLongitude, 174.49);
  assert.equal(venus.details?.seeghrochaLongitude, 158.35);
}

// 3. Superior planets use their own mean longitude and mean Sun as
// Seeghrocha (Raman Article 101).
{
  for (const planet of ["Mars", "Jupiter", "Saturn"] as const) {
    const result = engine.calculateCheshtaBala(planet, standardInput);
    assert.equal(result.details?.meanLongitude, standardInput.planets[planet].meanLongitude);
    assert.equal(result.details?.seeghrochaLongitude, standardInput.planets.Sun.meanLongitude);
  }
}

// 4. Apparent daily speed is diagnostic only. A retrograde flag must not
// replace the source Kendra calculation or force the score to 60.
{
  const result = engine.calculateCheshtaBala("Mars", standardInput);
  assert.equal(result.isRetrograde, true);
  assert.equal(result.motion, -0.20);
  assert.equal(result.points, expected.Mars.points);
  assert.notEqual(result.points, 60);
}

// 5. Missing mean longitude or Seeghrocha is explicitly unavailable even if
// apparent speed and retrograde status are supplied.
{
  const noMean = structuredClone(standardInput);
  delete noMean.planets.Mars.meanLongitude;
  const result = engine.calculateCheshtaBala("Mars", noMean);
  assert.equal(result.available, false);
  assert.equal(result.points, 0);
  assert.match(result.description, /Mars mean longitude/);
  assert.match(result.description, /daily speed cannot substitute/);

  const noInferiorApogee = structuredClone(standardInput);
  delete noInferiorApogee.planets.Mercury.seeghrochaLongitude;
  const mercury = engine.calculateCheshtaBala("Mercury", noInferiorApogee);
  assert.equal(mercury.available, false);
  assert.match(mercury.description, /Mercury seeghrocha\/apogee/);
}

// 6. Circular midpoint must handle the 0°/360° seam rather than averaging
// 359° and 1° to the wrong side of the zodiac.
{
  const forward = calculateCheshtaKendra(359, 1, 180);
  const reverse = calculateCheshtaKendra(1, 359, 180);
  assert.equal(forward.midpointLongitude, 0);
  assert.equal(reverse.midpointLongitude, 0);
  assert.equal(forward.reducedKendraDegrees, 180);
  assert.equal(reverse.reducedKendraDegrees, 180);
  assert.equal(forward.points, 60);
  assert.equal(reverse.points, 60);
}

// 7. Exact scale endpoints and invalid values.
{
  assert.equal(calculateCheshtaKendra(90, 90, 90).points, 0);
  assert.equal(calculateCheshtaKendra(0, 0, 180).points, 60);
  assert.throws(() => calculateCheshtaKendra(360, 0, 0), /normalized to \[0°, 360°\)/);
  assert.throws(() => calculateCheshtaKendra(0, Number.NaN, 0), /normalized to \[0°, 360°\)/);
  assert.throws(() => engine.calculateCheshtaBala("Rahu", standardInput), /seven classical planets/);
}

console.log(
  "Shadbala Cheshta Kendra suite passed: Raman Examples 49–51 for all five grahas, superior/inferior data routing, unavailable-input policy, circular midpoint and 0/60 endpoints."
);

import assert from "node:assert/strict";
import {
  calculateNathonnathaBala,
  ShadbalaEngine,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

const close = (actual: number | null, expected: number, label: string) => {
  assert.ok(actual !== null && Math.abs(actual - expected) < 1e-9,
    `${label}: expected ${expected}, received ${actual}`);
};

// Local apparent midnight: nocturnal grahas peak, diurnal grahas are at zero.
assert.equal(calculateNathonnathaBala("Sun", 0), 0);
assert.equal(calculateNathonnathaBala("Jupiter", 0), 0);
assert.equal(calculateNathonnathaBala("Venus", 0), 0);
assert.equal(calculateNathonnathaBala("Moon", 0), 60);
assert.equal(calculateNathonnathaBala("Mars", 0), 60);
assert.equal(calculateNathonnathaBala("Saturn", 0), 60);

// Local apparent noon: diurnal grahas peak, nocturnal grahas are at zero.
assert.equal(calculateNathonnathaBala("Sun", 720), 60);
assert.equal(calculateNathonnathaBala("Jupiter", 720), 60);
assert.equal(calculateNathonnathaBala("Venus", 720), 60);
assert.equal(calculateNathonnathaBala("Moon", 720), 0);
assert.equal(calculateNathonnathaBala("Mars", 720), 0);
assert.equal(calculateNathonnathaBala("Saturn", 720), 0);

// Six apparent hours from noon in either direction gives equal strengths.
for (const minutes of [360, 1080]) {
  assert.equal(calculateNathonnathaBala("Sun", minutes), 30);
  assert.equal(calculateNathonnathaBala("Moon", minutes), 30);
}

// Raman's Standard Horoscope, Example 17, Article 51:
// local apparent time 14:20 = 215° from midnight; fold 360° - 215° = 145°.
// Diva Bala = 145 / 3; Ratri Bala = (180 - 145) / 3.
close(calculateNathonnathaBala("Sun", 14 * 60 + 20), 145 / 3, "Raman Sun Diva Bala");
close(calculateNathonnathaBala("Moon", 14 * 60 + 20), 35 / 3, "Raman Moon Ratri Bala");
close(calculateNathonnathaBala("Mars", 14 * 60 + 20), 35 / 3, "Raman Mars Ratri Bala");
close(calculateNathonnathaBala("Jupiter", 14 * 60 + 20), 145 / 3, "Raman Jupiter Diva Bala");
close(calculateNathonnathaBala("Venus", 14 * 60 + 20), 145 / 3, "Raman Venus Diva Bala");
close(calculateNathonnathaBala("Saturn", 14 * 60 + 20), 35 / 3, "Raman Saturn Ratri Bala");

// Mercury is always full regardless of birth time knowledge.
assert.equal(calculateNathonnathaBala("Mercury", undefined, false), 60);
assert.equal(calculateNathonnathaBala("Sun", undefined), null);
assert.equal(calculateNathonnathaBala("Moon", 720, false), null);
assert.throws(() => calculateNathonnathaBala("Sun", -0.1), /between 0 and 1440/);
assert.throws(() => calculateNathonnathaBala("Moon", 1440), /between 0 and 1440/);
assert.throws(() => calculateNathonnathaBala("Rahu", 720), /seven classical planets/);

// Verify engine integration and the explicit incomplete-input path.
const engine = new ShadbalaEngine();
const positions: ShadbalaChartInput["planets"] = {
  Sun: { longitude: 180 },
  Moon: { longitude: 0 },
  Mars: { longitude: 30 },
  Mercury: { longitude: 60 },
  Jupiter: { longitude: 90 },
  Venus: { longitude: 120 },
  Saturn: { longitude: 150 },
};
const knownTime = engine.calculateKalaBala("Sun", {
  ascendant: 0,
  birthDate: new Date(Date.UTC(1918, 9, 16, 14, 20)),
  localApparentTimeMinutes: 14 * 60 + 20,
  birthTimeKnown: true,
  planets: positions,
});
close(knownTime.components.nathonnathaBala, 145 / 3, "Integrated Kala Bala Nathonnatha");
assert.deepEqual(
  knownTime.unavailableComponents,
  [
    "Tribhaga Bala (requires a known birth time, latitude, longitude and normal sunrise/sunset)",
    "Abda/Masa/Vara/Hora Bala (requires a known local sunrise-to-sunrise interval and supported Raman epoch date)",
  ],
  "Nathonnatha is available; Tribhaga and Raman's time lords remain unavailable without location and solar intervals"
);
assert.match(knownTime.description, /Meeus-corrected local apparent time/);

const unknownTime = engine.calculateKalaBala("Sun", {
  ascendant: 0,
  birthDate: new Date(Date.UTC(1918, 9, 16, 12, 0)),
  localApparentTimeMinutes: 720,
  birthTimeKnown: false,
  planets: positions,
});
assert.equal(unknownTime.components.nathonnathaBala, null,
  "An explicit unknown-time flag must override the placeholder noon instant");
assert.deepEqual(
  unknownTime.unavailableComponents,
  [
    "Nathonnatha Bala (requires a known local apparent birth time)",
    "Paksha Bala (requires valid Sun and Moon longitudes)",
    "Tribhaga Bala (requires a known birth time, latitude, longitude and normal sunrise/sunset)",
    "Abda/Masa/Vara/Hora Bala (requires a known local sunrise-to-sunrise interval and supported Raman epoch date)",
  ],
  "Unknown birth time invalidates local-time Nathonnatha, Paksha, Tribhaga and Raman time-lord calculations"
);
assert.match(unknownTime.description, /Nathonnatha is unavailable/);

console.log(
  "Shadbala Nathonnatha suite passed: apparent midnight/noon, mirrored hours, Raman Example 17, Mercury invariance and unknown-time fail-closed integration."
);

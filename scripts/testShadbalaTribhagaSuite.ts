import assert from "node:assert/strict";
import {
  calculateTribhagaBala,
  calculateTribhagaBalaFromSolarIntervals,
  type ShadbalaChartInput,
  type TribhagaSolarIntervals,
} from "../lib/vedic/shadbalaEngine";
import { PlanetaryHoursCalculator } from "../lib/astronomy/planetaryHours";

const base: TribhagaSolarIntervals = {
  birthLocalMinutes: 480,
  sunriseMinutes: 360,
  sunsetMinutes: 1080,
  previousSunsetMinutes: 1080,
  nextSunriseMinutes: 360,
};

// 1. BPHS 27.12 daylight order: Mercury, Sun, Saturn.
{
  const mercury = calculateTribhagaBalaFromSolarIntervals("Mercury", base);
  assert.equal(mercury.available, true);
  assert.equal(mercury.period, "day");
  assert.equal(mercury.part, "first");
  assert.equal(mercury.awardedLord, "Mercury");
  assert.equal(mercury.points, 60);

  const sun = calculateTribhagaBalaFromSolarIntervals("Sun", {
    ...base,
    birthLocalMinutes: 600, // exactly 10:00, first third ends at 10:00
  });
  assert.equal(sun.part, "middle", "An exact day-third boundary enters the next segment");
  assert.equal(sun.awardedLord, "Sun");
  assert.equal(sun.points, 60);

  const saturn = calculateTribhagaBalaFromSolarIntervals("Saturn", {
    ...base,
    birthLocalMinutes: 840,
  });
  assert.equal(saturn.part, "last");
  assert.equal(saturn.awardedLord, "Saturn");
  assert.equal(saturn.points, 60);

  assert.equal(calculateTribhagaBalaFromSolarIntervals("Mars", base).points, 0,
    "A non-ruler receives zero while the daylight calculation remains available");
}

// 2. BPHS 27.12 night order: Moon, Venus, Mars; pre-sunrise birth is part
// of the night that began on the previous civil date.
{
  const moon = calculateTribhagaBalaFromSolarIntervals("Moon", {
    ...base,
    birthLocalMinutes: 1080, // sunset is the start of first night third
  });
  assert.equal(moon.period, "night");
  assert.equal(moon.part, "first");
  assert.equal(moon.awardedLord, "Moon");
  assert.equal(moon.points, 60);

  const venus = calculateTribhagaBalaFromSolarIntervals("Venus", {
    ...base,
    birthLocalMinutes: 1320,
  });
  assert.equal(venus.part, "middle");
  assert.equal(venus.awardedLord, "Venus");
  assert.equal(venus.points, 60);

  const mars = calculateTribhagaBalaFromSolarIntervals("Mars", {
    ...base,
    birthLocalMinutes: 120,
  });
  assert.equal(mars.part, "last");
  assert.equal(mars.awardedLord, "Mars");
  assert.equal(mars.points, 60);

  const preSunriseMars = calculateTribhagaBalaFromSolarIntervals("Mars", {
    ...base,
    birthLocalMinutes: 240, // 04:00, last part of previous sunset-to-sunrise night
  });
  assert.equal(preSunriseMars.period, "night");
  assert.equal(preSunriseMars.part, "last");
  assert.equal(preSunriseMars.points, 60);
}

// 3. Jupiter receives one rupa at all times, including missing birth time,
// missing location and polar-day/polar-night conditions.
{
  assert.equal(calculateTribhagaBalaFromSolarIntervals("Jupiter").points, 60);
  const unavailable = calculateTribhagaBalaFromSolarIntervals("Sun");
  assert.equal(unavailable.available, false);
  assert.equal(unavailable.points, null);
  assert.equal(calculateTribhagaBalaFromSolarIntervals("Mercury").points, null);
  assert.throws(() => calculateTribhagaBalaFromSolarIntervals("Rahu"), /seven classical planets/);
  assert.throws(
    () => calculateTribhagaBalaFromSolarIntervals("Sun", { ...base, sunriseMinutes: 1100 }),
    /sunrise must precede sunset/
  );
  assert.throws(
    () => calculateTribhagaBalaFromSolarIntervals("Sun", { ...base, birthLocalMinutes: 1440 }),
    /clock minutes/
  );
}

// 4. The chart adapter uses the existing NOAA-based rise/set model and exact
// IANA date offset. Put a synthetic local birth clock at the middle of the
// calculated daylight interval; BPHS assigns the Sun the second third.
{
  const solar = new PlanetaryHoursCalculator();
  const riseSet = solar.calculateSunTimes(2026, 3, 20, 40.7128, -74.006, -4);
  assert.equal(riseSet.solarCondition, "normal");
  const sunriseMinutes = riseSet.sunrise * 60;
  const sunsetMinutes = riseSet.sunset * 60;
  const birthMinutes = Math.floor((sunriseMinutes + sunsetMinutes) / 2);
  const birthDate = new Date(Date.UTC(
    2026, 2, 20,
    Math.floor(birthMinutes / 60),
    birthMinutes % 60
  ));
  const input: ShadbalaChartInput = {
    ascendant: 0,
    birthDate,
    birthTimeKnown: true,
    latitude: 40.7128,
    longitude: -74.006,
    ianaTimezone: "America/New_York",
    timezoneOffsetSeconds: -4 * 3600,
    planets: {
      Sun: { longitude: 0 }, Moon: { longitude: 0 }, Mars: { longitude: 0 },
      Mercury: { longitude: 0 }, Jupiter: { longitude: 0 }, Venus: { longitude: 0 },
      Saturn: { longitude: 0 },
    },
  };
  const result = calculateTribhagaBala("Sun", input);
  assert.equal(result.available, true);
  assert.equal(result.period, "day");
  assert.equal(result.part, "middle");
  assert.equal(result.awardedLord, "Sun");
  assert.equal(result.points, 60);
  assert.match(result.description, /BPHS 27\.12/);
}

// 5. The adapter does not invent a day segment with unknown birth time,
// missing location or a polar condition; Jupiter's explicit exception remains.
{
  const date = new Date(Date.UTC(2026, 5, 21, 12, 0));
  const knownBase: ShadbalaChartInput = {
    ascendant: 0,
    birthDate: date,
    birthTimeKnown: true,
    latitude: 89,
    longitude: 0,
    timezoneOffsetSeconds: 0,
    planets: { Sun: { longitude: 0 } },
  };
  assert.equal(calculateTribhagaBala("Sun", {
    ...knownBase,
    birthTimeKnown: false,
  }).available, false);
  assert.equal(calculateTribhagaBala("Sun", {
    ...knownBase,
    latitude: undefined,
  }).available, false);
  assert.equal(calculateTribhagaBala("Sun", knownBase).available, false,
    "Polar-day/polar-night dates do not fabricate three ordinary solar divisions");
  assert.equal(calculateTribhagaBala("Jupiter", {
    ...knownBase,
    latitude: undefined,
    birthTimeKnown: false,
  }).points, 60);
}

console.log(
  "Shadbala Tribhaga suite passed: BPHS day/night ruler sequence, unequal boundaries, pre-sunrise attribution, Jupiter exception, unknown inputs, IANA zone and polar handling."
);

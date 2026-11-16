import assert from "node:assert/strict";
import {
  calculateRamanTimeLords,
  calculateRamanTimeLordsFromSunriseInterval,
  ShadbalaEngine,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

const DAY_MS = 86_400_000;

// B. V. Raman, Graha and Bhava Balas, Chapter V, Examples 20-26 and 31.
// His abbreviated epoch is 2 May 1827 (Wednesday). The Standard Horoscope
// birth date is 16 October 1918; the inclusive Ahargana is 33,405.
{
  const sunriseDate = new Date(Date.UTC(1918, 9, 16));
  const sunrise = new Date(Date.UTC(1918, 9, 16, 0, 0));
  const birth = new Date(sunrise.getTime() + 8.1 * 3_600_000);
  const nextSunrise = new Date(sunrise.getTime() + DAY_MS);
  const result = calculateRamanTimeLordsFromSunriseInterval(
    sunriseDate,
    sunrise,
    birth,
    nextSunrise
  );
  assert.ok(result);
  assert.equal(result.aharganaDays, 33405);
  assert.equal(result.effectiveSunriseDate, "1918-10-16");
  assert.equal(result.yearLord, "Saturn");
  assert.equal(result.monthLord, "Mercury");
  assert.equal(result.varaLord, "Mercury");
  assert.equal(result.horaNumber, 9);
  assert.equal(result.horaLord, "Moon");
  assert.equal(result.elapsedHours, 8.1);
  assert.equal(result.sunriseToSunriseHours, 24);
  assert.match(result.description, /Raman Ch\. V/);
}

// Exact hora boundaries use half-open intervals: 8 hours exactly starts
// the ninth of 24 equal sunrise-to-sunrise horas.
{
  const date = new Date(Date.UTC(1918, 9, 16));
  const sunrise = new Date(Date.UTC(1918, 9, 16, 6, 0));
  const next = new Date(sunrise.getTime() + DAY_MS);
  const beforeBoundary = calculateRamanTimeLordsFromSunriseInterval(
    date,
    sunrise,
    new Date(sunrise.getTime() + 8 * 3_600_000 - 1),
    next
  );
  const atBoundary = calculateRamanTimeLordsFromSunriseInterval(
    date,
    sunrise,
    new Date(sunrise.getTime() + 8 * 3_600_000),
    next
  );
  assert.ok(beforeBoundary && atBoundary);
  assert.equal(beforeBoundary.horaNumber, 8);
  assert.equal(atBoundary.horaNumber, 9);
  assert.equal(beforeBoundary.horaLord, "Mercury");
  assert.equal(atBoundary.horaLord, "Moon");
}

// The day is divided into 24 equal portions even when the actual
// sunrise-to-sunrise interval is not exactly 24 SI hours.
{
  const date = new Date(Date.UTC(2026, 5, 21));
  const sunrise = new Date(Date.UTC(2026, 5, 21, 0, 0));
  const day23h = new Date(sunrise.getTime() + 23 * 3_600_000);
  const birth = new Date(sunrise.getTime() + 8.1 / 24 * 23 * 3_600_000);
  const result = calculateRamanTimeLordsFromSunriseInterval(date, sunrise, birth, day23h);
  assert.ok(result);
  assert.equal(result.horaNumber, 9);
  assert.equal(result.horaLord, "Moon");
  assert.equal(result.sunriseToSunriseHours, 23);
}

// Invalid or unsupported inputs must not receive invented lords.
{
  const beforeEpoch = new Date(Date.UTC(1827, 4, 1));
  const sunrise = new Date(Date.UTC(1827, 4, 1, 6));
  assert.equal(
    calculateRamanTimeLordsFromSunriseInterval(
      beforeEpoch,
      sunrise,
      new Date(sunrise.getTime() + 1_000),
      new Date(sunrise.getTime() + DAY_MS)
    ),
    null
  );
  const date = new Date(Date.UTC(1918, 9, 16));
  const start = new Date(Date.UTC(1918, 9, 16, 6));
  assert.equal(
    calculateRamanTimeLordsFromSunriseInterval(
      date,
      start,
      new Date(start.getTime() - 1),
      new Date(start.getTime() + DAY_MS)
    ),
    null
  );
  assert.equal(
    calculateRamanTimeLordsFromSunriseInterval(
      date,
      start,
      new Date(start.getTime() + DAY_MS),
      new Date(start.getTime() + DAY_MS)
    ),
    null
  );
}

// End-to-end solar adapter: local civil birth time + resolved UTC instant +
// coordinates + IANA timezone must reproduce the Standard Horoscope lords.
{
  const standardPositions: ShadbalaChartInput["planets"] = {
    Sun: { longitude: 179 + 8 / 60 },
    Moon: { longitude: 311 + 40 / 60 },
    Mars: { longitude: 229 + 30 / 60 },
    Mercury: { longitude: 180 + 33 / 60 },
    Jupiter: { longitude: 84 },
    Venus: { longitude: 171 + 9 / 60 },
    Saturn: { longitude: 124 + 22 / 60 },
  };
  const input: ShadbalaChartInput = {
    ascendant: 298 + 27 / 60,
    birthDate: new Date(Date.UTC(1918, 9, 16, 14, 20)), // local civil clock encoded as UTC fields
    birthUtcInstant: new Date(Date.UTC(1918, 9, 16, 8, 50)), // UTC+05:30
    birthTimeKnown: true,
    latitude: 12.97,
    longitude: 77.59,
    ianaTimezone: "Asia/Kolkata",
    timezoneOffsetSeconds: 19_800,
    localApparentTimeMinutes: 14 * 60 + 20,
    planets: standardPositions,
  };

  const lords = calculateRamanTimeLords(input);
  assert.ok(lords, "Raman time lords resolve from the normal local solar day");
  assert.equal(lords.aharganaDays, 33405);
  assert.equal(lords.yearLord, "Saturn");
  assert.equal(lords.monthLord, "Mercury");
  assert.equal(lords.varaLord, "Mercury");
  assert.equal(lords.horaNumber, 9);
  assert.equal(lords.horaLord, "Moon");

  const engine = new ShadbalaEngine();
  assert.equal(engine.calculateKalaBala("Saturn", input).components.abdaBala, 15);
  assert.equal(engine.calculateKalaBala("Mercury", input).components.maasaBala, 30);
  assert.equal(engine.calculateKalaBala("Mercury", input).components.varaBala, 45);
  assert.equal(engine.calculateKalaBala("Moon", input).components.horaBala, 60);
  assert.ok(!engine.calculateKalaBala("Moon", input).unavailableComponents.some((x) => x.includes("Abda/Masa/Vara/Hora")));
}

console.log(
  "Shadbala Raman time-lord suite passed: inclusive Ahargana, 360/30-day year/month cycles, sunrise-day Vara, 24 equal Horas, DST-length interval support, and the 1918 Standard Horoscope."
);

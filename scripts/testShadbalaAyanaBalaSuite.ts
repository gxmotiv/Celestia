import assert from "node:assert/strict";
import {
  calculateAyanaBala,
  calculateAyanaBalaForSayanaLongitude,
  calculateAyanaBhujaDegrees,
  calculateBphsAyanaKhandaDegrees,
  calculateRamanKrantiDegrees,
  ShadbalaEngine,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

const close = (actual: number | null, expected: number, label: string, tolerance = 0.02) => {
  assert.ok(actual !== null && Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected}, received ${actual}`);
};

// Nearest-equinoctial Bhuja folds all four zodiac quadrants into [0°, 90°].
for (const [longitude, expected] of [
  [0, 0], [30, 30], [60, 60], [90, 90], [120, 60], [150, 30],
  [180, 0], [210, 30], [240, 60], [270, 90], [300, 60], [330, 30],
] as const) {
  assert.equal(calculateAyanaBhujaDegrees(longitude), expected,
    `Bhuja at Sayana longitude ${longitude}°`);
}
assert.throws(() => calculateAyanaBhujaDegrees(360), /normalized/);
assert.throws(() => calculateAyanaBhujaDegrees(Number.NaN), /normalized/);

// BPHS 27.15–17: Khandas 45°, 33° and 12° in each 30° segment.
// At the equinoxes, all planets begin at 30 Virupas.
for (const planet of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]) {
  close(calculateAyanaBalaForSayanaLongitude(planet, 0, "bphs-khanda").points, 30, `BPHS ${planet} at Aries equinox`);
  close(calculateAyanaBalaForSayanaLongitude(planet, 180, "bphs-khanda").points, 30, `BPHS ${planet} at Libra equinox`);
}

// BPHS direction: Sun/Mars/Jupiter/Venus add in north; Moon/Saturn in south;
// Mercury always adds. At the solstitial points the result reaches 0 or 60.
assert.equal(calculateAyanaBalaForSayanaLongitude("Sun", 90, "bphs-khanda").points, 60);
assert.equal(calculateAyanaBalaForSayanaLongitude("Sun", 270, "bphs-khanda").points, 0);
assert.equal(calculateAyanaBalaForSayanaLongitude("Mars", 90, "bphs-khanda").points, 60);
assert.equal(calculateAyanaBalaForSayanaLongitude("Venus", 270, "bphs-khanda").points, 0);
assert.equal(calculateAyanaBalaForSayanaLongitude("Moon", 90, "bphs-khanda").points, 0);
assert.equal(calculateAyanaBalaForSayanaLongitude("Moon", 270, "bphs-khanda").points, 60);
assert.equal(calculateAyanaBalaForSayanaLongitude("Saturn", 90, "bphs-khanda").points, 0);
assert.equal(calculateAyanaBalaForSayanaLongitude("Saturn", 270, "bphs-khanda").points, 60);
assert.equal(calculateAyanaBalaForSayanaLongitude("Mercury", 90, "bphs-khanda").points, 60);
assert.equal(calculateAyanaBalaForSayanaLongitude("Mercury", 270, "bphs-khanda").points, 60);

// Intermediate khanda arithmetic: 10° into the second 30° interval is
// 45 + (10/30 × 33) = 56 degrees, then /3 = 18.666... Virupas
// for a southern Sun (90 - 56)/3 = 11.333... instead.
{
  const khanda = calculateBphsAyanaKhandaDegrees(40);
  assert.equal(khanda.bhujaDegrees, 40);
  close(khanda.khandaDegrees, 56, "BPHS second Khanda interpolation", 1e-9);
  close(calculateAyanaBalaForSayanaLongitude("Jupiter", 40, "bphs-khanda").points, 48.67, "BPHS northern Jupiter Khanda");
  close(calculateAyanaBalaForSayanaLongitude("Jupiter", 220, "bphs-khanda").points, 11.33, "BPHS southern Jupiter Khanda");
}

// Raman Ch. V, arts. 72–75: the 15° Kranti increments total 24°.
// The Standard Horoscope's Sayana Sun is 202°10', Bhuja 22°10',
// Kranti 8°45' S; the Moon is 332°33', Kranti 10°45' S.
{
  const sunSayana = 202 + 10 / 60;
  const moonSayana = 332 + 33 / 60;
  const sunKranti = calculateRamanKrantiDegrees(sunSayana);
  const moonKranti = calculateRamanKrantiDegrees(moonSayana);
  assert.equal(sunKranti.hemisphere, "South");
  assert.equal(moonKranti.hemisphere, "South");
  close(sunKranti.krantiDegrees, 8.75, "Raman Standard Horoscope Sun Kranti");
  close(moonKranti.krantiDegrees, 10.75, "Raman Standard Horoscope Moon Kranti");

  const sun = calculateAyanaBalaForSayanaLongitude("Sun", sunSayana, "raman-kranti");
  const moon = calculateAyanaBalaForSayanaLongitude("Moon", moonSayana, "raman-kranti");
  close(sun.details!.basePoints, 19.06, "Raman Sun undoubled base");
  close(sun.points, 38.12, "Raman Sun doubles Kala Ayana", 0.02);
  assert.equal(sun.cheshtaPoints, 0, "Raman's worked accounting doubles Sun Ayana in Kala without a separate Sun Cheshta row");
  close(moon.points, 43.44, "Raman Moon Kala Ayana");
}

// Raman's directional rules: Sun/Jupiter/Mars/Venus favour north; Moon/Saturn
// favour south; Mercury adds either hemisphere. Sun's Kala value is doubled.
assert.equal(calculateAyanaBalaForSayanaLongitude("Sun", 90, "raman-kranti").points, 120);
assert.equal(calculateAyanaBalaForSayanaLongitude("Sun", 270, "raman-kranti").points, 0);
assert.equal(calculateAyanaBalaForSayanaLongitude("Moon", 90, "raman-kranti").points, 0);
assert.equal(calculateAyanaBalaForSayanaLongitude("Moon", 270, "raman-kranti").points, 60);
assert.equal(calculateAyanaBalaForSayanaLongitude("Saturn", 90, "raman-kranti").points, 0);
assert.equal(calculateAyanaBalaForSayanaLongitude("Saturn", 270, "raman-kranti").points, 60);
assert.equal(calculateAyanaBalaForSayanaLongitude("Mercury", 90, "raman-kranti").points, 60);
assert.equal(calculateAyanaBalaForSayanaLongitude("Mercury", 270, "raman-kranti").points, 60);

// Sidereal-to-Sayana conversion is explicit and fail-closed.
{
  const input: ShadbalaChartInput = {
    ascendant: 0,
    ayanamsaDegrees: 21 + 16 / 60,
    ayanaMethod: "raman-kranti",
    planets: {
      Sun: { longitude: 180 + 54 / 60 },
      Moon: { longitude: 311 + 17 / 60 },
    },
  };
  const sun = calculateAyanaBala("Sun", input);
  const moon = calculateAyanaBala("Moon", input);
  close(sun.details!.sayanaLongitude, 202 + 10 / 60, "Sayana Sun conversion");
  close(moon.details!.sayanaLongitude, 332 + 33 / 60, "Sayana Moon conversion");
  close(sun.points, 38.12, "Integrated Raman Sun Ayana", 0.02);
  close(moon.points, 43.44, "Integrated Raman Moon Ayana");

  const missingAyanamsa = calculateAyanaBala("Sun", {
    ascendant: 0,
    planets: { Sun: { longitude: 180 } },
  });
  assert.equal(missingAyanamsa.available, false);
  assert.equal(missingAyanamsa.points, null);
}

// Shadbala accounting: BPHS 27.18 includes undoubled Sun Ayana again as
// Sun Cheshta; Raman doubles it inside Kala and omits a separate Sun Cheshta.
{
  const positions: ShadbalaChartInput["planets"] = {
    Sun: { longitude: 180 + 54 / 60 },
    Moon: { longitude: 311 + 17 / 60 },
    Mars: { longitude: 229 + 30 / 60 },
    Mercury: { longitude: 181 + 31 / 60 },
    Jupiter: { longitude: 84 },
    Venus: { longitude: 171 + 9 / 60 },
    Saturn: { longitude: 124 + 22 / 60 },
  };
  const engine = new ShadbalaEngine();
  const bphsInput: ShadbalaChartInput = {
    ascendant: 0,
    ayanamsaDegrees: 21 + 16 / 60,
    ayanaMethod: "bphs-khanda",
    planets: positions,
  };
  const bphsKala = engine.calculateKalaBala("Sun", bphsInput);
  const bphsCheshta = engine.calculateCheshtaBala("Sun", bphsInput);
  assert.equal(bphsCheshta.available, true);
  assert.equal(bphsKala.components.ayanaBala, bphsCheshta.points);
  assert.match(bphsCheshta.description, /BPHS 27.18/);

  const ramanInput: ShadbalaChartInput = {
    ...bphsInput,
    ayanaMethod: "raman-kranti",
  };
  const ramanKala = engine.calculateKalaBala("Sun", ramanInput);
  const ramanCheshta = engine.calculateCheshtaBala("Sun", ramanInput);
  close(ramanKala.components.ayanaBala!, 38.12, "Raman doubles Sun Ayana inside Kala");
  assert.equal(ramanCheshta.points, 0);
  assert.match(ramanCheshta.description, /no separate Sun Cheshta row/);
}

console.log(
  "Shadbala Ayana Bala suite passed: BPHS 45/33/12 Khanda, Raman Kranti table, Sayana conversion, Standard Horoscope examples and Sun Kala/Cheshta accounting."
);

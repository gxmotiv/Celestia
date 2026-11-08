import { PlanetaryHoursCalculator } from "../lib/astronomy/planetaryHours";

const calc = new PlanetaryHoursCalculator();
let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log("PASS: " + name);
  } else {
    failed++;
    console.error("FAIL: " + name + (detail ? " — " + detail : ""));
  }
}
const close = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;
function circularHours(a: number, b: number) {
  const difference = Math.abs(a - b) % 24;
  return Math.min(difference, 24 - difference);
}

console.log("Location-aware planetary hours regression suite");

// Around the March equinox at the equator, sunrise/sunset should be near 06:00/18:00.
const equinox = calc.calculateSunTimes(2026, 3, 20, 0, 0, 0);
assert("Equinox equator sunrise is near 06:00", close(equinox.sunrise, 6, 0.35), equinox.sunrise.toFixed(3));
assert("Equinox equator sunset is near 18:00", close(equinox.sunset, 18, 0.35), equinox.sunset.toFixed(3));

// Moving 15° east advances local solar events by about one hour at the same UTC offset.
const east15 = calc.calculateSunTimes(2026, 3, 20, 0, 15, 0);
assert("15° east longitude advances local sunrise by one hour", close(circularHours(equinox.sunrise, east15.sunrise), 1, 0.02));
assert("15° east longitude advances local sunset by one hour", close(circularHours(equinox.sunset, east15.sunset), 1, 0.02));

// A 15° east longitude with +01:00 civil offset has approximately same clock time as 0°/+00:00.
const east15Plus1 = calc.calculateSunTimes(2026, 3, 20, 0, 15, 1);
assert("Longitude and UTC offset are both applied consistently", close(equinox.sunrise, east15Plus1.sunrise, 0.02));

// Every standard day yields twelve day and twelve night unequal hours, with one marked birth hour.
const daytime = calc.calculate(2026, 3, 20, 10, 30, 0, 0, 0);
assert("Planetary-hour list has 24 periods", daytime.hours.length === 24);
assert("Planetary-hour list has 12 daylight and 12 night periods",
  daytime.hours.filter(x => x.isDayHour).length === 12 && daytime.hours.filter(x => !x.isDayHour).length === 12);
assert("Exactly one planetary hour is marked for a daytime birth",
  daytime.hours.filter(x => x.isCurrentBirthHour).length === 1);
assert("Day and night hour durations sum to 24 hours",
  close(daytime.dayHourDurationMinutes * 12 + daytime.nightHourDurationMinutes * 12, 1440, 12));

// Before local sunrise belongs to the preceding astrological weekday/night.
const beforeSunrise = calc.calculate(2026, 3, 20, 4, 30, 0, 0, 0);
assert("Pre-sunrise birth is classified as nighttime", !beforeSunrise.isBirthInDaytime);
assert("Pre-sunrise birth uses the previous astrological weekday",
  beforeSunrise.dayRuler === "Jupiter"); // 2026-03-19 is Thursday.

// Longitude validation protects callers from silently nonsensical coordinates.
let invalidLongitudeRejected = false;
try { calc.calculateSunTimes(2026, 3, 20, 0, 181, 0); } catch { invalidLongitudeRejected = true; }
assert("Longitude outside ±180° is rejected", invalidLongitudeRejected);

// Polar day/night are explicitly flagged instead of fabricated sunrise/set times.
const polarDay = calc.calculateSunTimes(2026, 6, 21, 89, 0, 0);
const polarNight = calc.calculateSunTimes(2026, 12, 21, 89, 0, 0);
assert("High-latitude summer date flags polar day", polarDay.solarCondition === "polar-day");
assert("High-latitude winter date flags polar night", polarNight.solarCondition === "polar-night");

console.log(`Planetary hours results: ${passed}/${passed + failed} passed`);
if (failed) process.exit(1);

import { PlanetaryHoursCalculator } from "../lib/astronomy/planetaryHours";
import { AstrocartographyEngine } from "../lib/astronomy/specializedWesternEngines";
import { PlanetPosition, WesternChartData } from "../lib/astronomy/ephemeris";

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
const calc = new PlanetaryHoursCalculator();
const equinox = calc.calculateSunTimes(2026, 3, 20, 0, 0, 0);
assert("Equinox equator sunrise is near 06:00", close(equinox.sunrise, 6, 0.35), equinox.sunrise.toFixed(3));
assert("Equinox equator sunset is near 18:00", close(equinox.sunset, 18, 0.35), equinox.sunset.toFixed(3));
const east15 = calc.calculateSunTimes(2026, 3, 20, 0, 15, 0);
assert("15° east advances local sunrise by about one hour", close(circularHours(equinox.sunrise, east15.sunrise), 1, 0.02));
assert("15° east advances local sunset by about one hour", close(circularHours(equinox.sunset, east15.sunset), 1, 0.02));
const east15Plus1 = calc.calculateSunTimes(2026, 3, 20, 0, 15, 1);
assert("Longitude and UTC offset both affect local solar time", close(equinox.sunrise, east15Plus1.sunrise, 0.02));
const daytime = calc.calculate(2026, 3, 20, 10, 30, 0, 0, 0);
assert("There are 24 day/night periods", daytime.hours.length === 24);
assert("There are 12 daylight and 12 night periods",
  daytime.hours.filter(x => x.isDayHour).length === 12 && daytime.hours.filter(x => !x.isDayHour).length === 12);
assert("Exactly one planetary hour is marked for a daytime birth",
  daytime.hours.filter(x => x.isCurrentBirthHour).length === 1);
assert("Ordinary equinox returns both planetary-hour durations",
  daytime.dayHourDurationMinutes !== null && daytime.nightHourDurationMinutes !== null);
assert("Day and night hour durations sum to 24 hours",
  daytime.dayHourDurationMinutes !== null &&
  daytime.nightHourDurationMinutes !== null &&
  close(daytime.dayHourDurationMinutes * 12 + daytime.nightHourDurationMinutes * 12, 1440, 12));
const beforeSunrise = calc.calculate(2026, 3, 20, 4, 30, 0, 0, 0);
assert("Pre-sunrise birth is classed as nighttime", !beforeSunrise.isBirthInDaytime);
assert("Pre-sunrise birth uses preceding astrological weekday", beforeSunrise.dayRuler === "Jupiter");
let invalidLongitudeRejected = false;
try { calc.calculateSunTimes(2026, 3, 20, 0, 181, 0); } catch { invalidLongitudeRejected = true; }
assert("Invalid longitude is rejected", invalidLongitudeRejected);
const polarDay = calc.calculateSunTimes(2026, 6, 21, 89, 0, 0);
const polarNight = calc.calculateSunTimes(2026, 12, 21, 89, 0, 0);
assert("High-latitude summer is flagged as polar day", polarDay.solarCondition === "polar-day");
assert("High-latitude winter is flagged as polar night", polarNight.solarCondition === "polar-night");

console.log("Astrocartography line geometry regression suite");
const sun: PlanetPosition = {
  id: "Sun", name: "Sun", symbol: "☉", longitude: 0, latitude: 0, speed: 1,
  isRetrograde: false, sign: "Aries", signIndex: 0, signDegree: 0,
  signDegreeFormatted: "0°00' Aries", house: 1, element: "Fire", modality: "Cardinal",
};
const chart: WesternChartData = {
  planets: [sun], houses: [], aspects: [],
  ascendant: { ...sun, id: "Ascendant", name: "Ascendant", symbol: "AC" },
  midheaven: { ...sun, id: "Midheaven", name: "Midheaven", symbol: "MC" },
  descendant: 180, imumCoeli: 180, julianDay: 2451545,
  siderealTime: 100, obliquity: 23.43929111, birthLatitude: 20, birthLongitude: 20,
  houseSystem: "Placidus",
};
const report = new AstrocartographyEngine().calculatePowerLines(chart);
assert("One standard planet creates four angular lines", report.powerLines.length === 4);
const line = (name: string) => report.powerLines.find(x => x.lineType.startsWith(name));
const mc = line("MC");
const ic = line("IC");
const ac = line("AC");
const dc = line("DC");
assert("MC meridian is RA minus Greenwich sidereal angle (-80°)", Boolean(mc && close(mc.longitudeTarget, -80, 0.001)), String(mc?.longitudeTarget));
assert("IC meridian is 180° opposite MC (+100°)", Boolean(ic && close(ic.longitudeTarget, 100, 0.001)), String(ic?.longitudeTarget));
assert("Equatorial AC curve uses rising hour angle (-170°)", Boolean(ac && close(ac.coordinates.find(p => p.latitude === 0)?.longitude ?? 999, -170, 0.001)));
assert("Equatorial DC curve uses setting hour angle (+10°)", Boolean(dc && close(dc.coordinates.find(p => p.latitude === 0)?.longitude ?? 999, 10, 0.001)));
assert("AC/DC are represented as latitude-dependent coordinate curves",
  Boolean(ac && dc && ac.coordinates.length > 100 && dc.coordinates.length > 100));
assert("No unsupported nearest-city recommendations are fabricated", report.topDestinations.length === 0);
const missingLocation = new AstrocartographyEngine().calculatePowerLines({ ...chart, birthLongitude: undefined });
assert("Imported charts without birth longitude return no fabricated lines", missingLocation.powerLines.length === 0);

console.log(`Planetary hours and astrocartography: ${passed}/${passed + failed} passed`);
if (failed) process.exit(1);

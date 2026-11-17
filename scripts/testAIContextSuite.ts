import assert from "node:assert/strict";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { calculateVedicChart } from "../lib/astronomy/vedic";
import { calculateNumerologyProfile } from "../lib/astronomy/numerology";
import { calculateBaZiProfile } from "../lib/astronomy/chinese";
import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { buildCelestiaAIContext } from "../lib/ai/buildCelestiaAIContext";

const profile = {
  name: "Celestia AI Context Regression",
  year: 2000,
  month: 1,
  day: 15,
  hour: 12,
  minute: 0,
  latitude: 51.5074,
  longitude: -0.1278,
  timezoneOffsetHours: 0,
};

const western = calculateWesternChart(
  profile.year,
  profile.month,
  profile.day,
  profile.hour,
  profile.minute,
  profile.latitude,
  profile.longitude,
  profile.timezoneOffsetHours,
  "Placidus"
);
const birthInstant = swissEphemeris.createUTCDate(
  profile.year,
  profile.month,
  profile.day,
  profile.hour,
  profile.minute,
  0,
  profile.timezoneOffsetHours
);
const vedic = calculateVedicChart(western, birthInstant);
const numerology = calculateNumerologyProfile(
  profile.name,
  profile.year,
  profile.month,
  profile.day
);
const bazi = calculateBaZiProfile(
  profile.year,
  profile.month,
  profile.day,
  profile.hour
);

const context = buildCelestiaAIContext({
  western,
  vedic,
  numerology,
  bazi,
  birthDate: `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`,
  birthTime: `${String(profile.hour).padStart(2, "0")}:${String(profile.minute).padStart(2, "0")}`,
  latitude: profile.latitude,
  longitude: profile.longitude,
  timezoneOffsetHours: profile.timezoneOffsetHours,
});

const systems = context.systems as Record<string, any>;
const transitSystems = systems.transits.systems as Record<string, unknown>;

assert.equal(context.schemaVersion, 1, "Context schema version should be stable");
assert.equal(
  context.calculationReference.birthInstantUtc,
  "2000-01-15T12:00:00.000Z",
  "Birth instant must use the entered timezone offset"
);
assert.equal(systems.western.chart, western, "Full calculated Western chart should be retained");
assert.equal(systems.vedic.chart, vedic, "Full calculated Vedic chart should be retained");
assert.equal(systems.bazi.profile, bazi, "Full calculated BaZi profile should be retained");
assert.equal(systems.numerology.branchCount, 6, "Current numerology adapter should expose its six real branches");
assert.equal(systems.numerology.completeReport, numerology.completeReport, "Complete numerology report should be passed");

assert.ok(systems.kp, "KP context should be calculated for a valid profile");
assert.equal(systems.kp.predictions.length, 12, "KP context should include all twelve standard house-event evaluations");
assert.equal(systems.kp.fourStepByPlanet.length, 9, "KP context should include the nine classical planet four-step results");
assert.equal(systems.kp.cuspalInterlinks.length, 12, "KP context should include twelve cuspal interlinks");
assert.match(
  systems.kp.confidenceInterpretation,
  /not a statistically calibrated probability/i,
  "KP heuristic scores must be clearly labelled"
);

for (const id of ["western", "vedic", "hellenistic", "westernSidereal"]) {
  assert.ok(transitSystems[id], `Transit context should include ${id}`);
}
assert.ok(systems.transits.comparison, "Western/Vedic transit comparison should be included");
assert.ok(systems.dasha, "Extended dasha context should be calculated for a valid natal Moon");
assert.ok(
  context.coverage.notIncludedWithoutAdditionalUserInputOrFeatureData.some((item) => item.includes("Partner")),
  "Partner data must be marked unavailable until supplied"
);
assert.ok(
  context.coverage.notIncludedWithoutAdditionalUserInputOrFeatureData.some((item) => item.includes("KP Horary")),
  "KP Horary must be marked unavailable until user-selected inputs exist"
);

const serialized = JSON.stringify(context);
assert.ok(serialized.length > 0, "The full context must be JSON serializable");
console.log(`PASS: Celestia AI context regression checks (${serialized.length} serialized characters)`);

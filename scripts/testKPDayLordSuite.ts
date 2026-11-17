import assert from "node:assert/strict";
import * as Astronomy from "astronomy-engine";
import { resolveKPReaderVIDayLord } from "../lib/kp/kpDayLord";

const observerAtGreenwichEquator = new Astronomy.Observer(0, 0, 0);
const referenceInstant = new Date("2000-01-02T12:00:00.000Z");
const referenceSunrise = Astronomy.SearchRiseSet(
  Astronomy.Body.Sun,
  observerAtGreenwichEquator,
  +1,
  referenceInstant,
  -2
);
assert.ok(referenceSunrise, "Astronomy Engine should resolve the preceding equatorial sunrise.");
const sunriseUtc = referenceSunrise.date;

const beforeSunrise = resolveKPReaderVIDayLord({
  birthInstant: new Date(sunriseUtc.getTime() - 60_000),
  latitude: 0,
  longitude: 0,
  birthTimeKnown: true,
});
const afterSunrise = resolveKPReaderVIDayLord({
  birthInstant: new Date(sunriseUtc.getTime() + 60_000),
  latitude: 0,
  longitude: 0,
  birthTimeKnown: true,
});

assert.equal(beforeSunrise.status, "resolved");
assert.equal(afterSunrise.status, "resolved");
assert.equal(beforeSunrise.dayLord, "Saturn", "A birth just before Sunday sunrise remains in Saturday's sunrise day.");
assert.equal(afterSunrise.dayLord, "Sun", "A birth after Sunday sunrise belongs to Sunday's sunrise day.");
assert.notEqual(
  beforeSunrise.sunriseUtc,
  afterSunrise.sunriseUtc,
  "Crossing sunrise must switch to the new sunrise-to-sunrise interval."
);

// Near 170°E, the LMT date is Sunday while UTC civil time is still Saturday.
const eastwardBirth = resolveKPReaderVIDayLord({
  birthInstant: new Date("2000-01-01T22:40:00.000Z"),
  latitude: 0,
  longitude: 170,
  birthTimeKnown: true,
});
assert.equal(eastwardBirth.status, "resolved");
assert.equal(eastwardBirth.localMeanSolarDate, "2000-01-02");
assert.equal(eastwardBirth.dayLord, "Sun");
assert.equal(new Date("2000-01-01T22:40:00.000Z").getUTCDay(), 6);

// Near 170°W, the LMT date is Saturday while UTC civil time is Sunday.
const westwardBirth = resolveKPReaderVIDayLord({
  birthInstant: new Date("2000-01-02T03:00:00.000Z"),
  latitude: 0,
  longitude: -170,
  birthTimeKnown: true,
});
assert.equal(westwardBirth.status, "resolved");
assert.equal(westwardBirth.localMeanSolarDate, "2000-01-01");
assert.equal(westwardBirth.dayLord, "Saturn");
assert.equal(new Date("2000-01-02T03:00:00.000Z").getUTCDay(), 0);

// Unknown birth time must never borrow the noon placeholder's weekday.
const unknownTime = resolveKPReaderVIDayLord({
  birthInstant: new Date("2000-01-02T12:00:00.000Z"),
  latitude: 0,
  longitude: 0,
  birthTimeKnown: false,
});
assert.equal(unknownTime.status, "birth-time-unknown");
assert.equal(unknownTime.dayLord, null);
assert.equal(unknownTime.sunriseUtc, null);

// Missing or invalid place data must not silently fall back to UTC.
assert.equal(resolveKPReaderVIDayLord(undefined).status, "missing-context");
assert.equal(resolveKPReaderVIDayLord({
  birthInstant: new Date("2000-01-02T12:00:00.000Z"),
  latitude: 91,
  longitude: 0,
  birthTimeKnown: true,
}).status, "invalid-context");

// Longyearbyen enters polar night in winter. The previous actual sunrise may
// be weeks earlier; the 370-day backward search must retain that last sunrise
// rather than rejecting the location after an arbitrary 24/48-hour window.
const polarNight = resolveKPReaderVIDayLord({
  birthInstant: new Date("2024-12-21T12:00:00.000Z"),
  latitude: 78.223,
  longitude: 15.646,
  birthTimeKnown: true,
});
assert.equal(polarNight.status, "resolved");
assert.ok(
  (polarNight.sunriseAgeHours ?? 0) > 48,
  "The last sunrise in polar night may be more than 48 hours before birth."
);

console.log("KP Reader VI sunrise day-lord suite passed: sunrise boundary, both longitude date-line shifts, unknown time, and invalid context.");

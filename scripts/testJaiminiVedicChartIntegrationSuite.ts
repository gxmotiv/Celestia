import assert from "node:assert/strict";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { calculateVedicChart } from "../lib/astronomy/vedic";
import { JaiminiKarakasEngine } from "../lib/vedic/jaiminiKarakas";

const western = calculateWesternChart(
  2000,
  1,
  1,
  12,
  0,
  40.7128,
  -74.006,
  -5,
  "Placidus"
);
const vedic = calculateVedicChart(western, new Date("2000-01-01T17:00:00.000Z"));

assert.ok(vedic.jaiminiKarakas, "A complete Vedic chart must include its Jaimini Chara Karakas");
const result = vedic.jaiminiKarakas!;
const atmakaraka = result.atmakaraka;

assert.equal(result.scheme, "7-Karaka");
assert.ok(
  Number.isFinite(vedic.lagna.siderealLongitude),
  "The Vedic chart must have a finite sidereal Lagna"
);
const atmakarakaPosition = vedic.planets.find(
  (planet) => planet.name === atmakaraka.planet
);
assert.ok(atmakarakaPosition, "Atmakaraka must resolve to a natal graha position");
const normalizedAtmakarakaLongitude =
  ((atmakarakaPosition!.siderealLongitude % 360) + 360) % 360;
const expectedKarakamsaSign =
  Math.floor(normalizedAtmakarakaLongitude / (30 / 9)) % 12;
assert.equal(
  result.karakamsaSignIndex,
  expectedKarakamsaSign,
  "Karakamsa D9 sign is derived from the Atmakaraka's sidereal longitude"
);
const expectedHouseFromLagna =
  ((result.karakamsaSignIndex - vedic.lagna.rasiIndex + 12) % 12) + 1;
assert.equal(
  result.karakamsaHouseFromLagna,
  expectedHouseFromLagna,
  "Karakamsa house is calculated relative to the sidereal Lagna"
);

// Keep the engine's fail-closed rule: callers using it directly must provide
// an explicit Ascendant or include a Lagna position in the positions array.
const engine = new JaiminiKarakasEngine();
const grahaPositions = vedic.planets.map((planet) => ({
  name: planet.name,
  siderealLongitude: planet.siderealLongitude,
  house: planet.house,
  rasiName: planet.rasiName,
}));
assert.throws(
  () => engine.calculate7Karakas(grahaPositions),
  /requires the sidereal Ascendant longitude/,
  "The direct Jaimini API must still reject missing Lagna data"
);
assert.doesNotThrow(
  () => engine.calculate7Karakas(grahaPositions, vedic.lagna.siderealLongitude),
  "The direct Jaimini API accepts the explicit sidereal Lagna"
);

console.log(
  "Jaimini/Vedic integration suite passed: main Vedic pipeline supplies sidereal Lagna and the direct API remains fail-closed."
);

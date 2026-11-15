import assert from "node:assert/strict";
import {
  calculateDivisionalChart,
  calculateDivisionalDegreeInSign,
  calculateDivisionalSignIndex,
  DIVISIONAL_CHARTS_CONFIG,
} from "../lib/vedic/divisionalCalc";

const lon = (sign: number, degree: number) => sign * 30 + degree;
const cases: { name: string; code: string; longitude: number; expectedSign: number }[] = [
  // D1 Rasi
  { name: "D1 retains the natal sign", code: "D1", longitude: lon(2, 29.999), expectedSign: 2 },

  // D2 Hora: odd/even signs reverse Sun (Leo) and Moon (Cancer) halves.
  { name: "D2 odd sign first half", code: "D2", longitude: lon(0, 14.999), expectedSign: 4 },
  { name: "D2 odd sign exact 15° boundary", code: "D2", longitude: lon(0, 15), expectedSign: 3 },
  { name: "D2 even sign first half", code: "D2", longitude: lon(1, 14.999), expectedSign: 3 },
  { name: "D2 even sign exact 15° boundary", code: "D2", longitude: lon(1, 15), expectedSign: 4 },

  // D3 Drekkana: sign, 5th, 9th.
  { name: "D3 first decan", code: "D3", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D3 second decan boundary", code: "D3", longitude: lon(0, 10), expectedSign: 4 },
  { name: "D3 third decan boundary", code: "D3", longitude: lon(0, 20), expectedSign: 8 },

  // D4 Chaturthamsa: 1st, 4th, 7th, 10th from source sign.
  { name: "D4 first quarter", code: "D4", longitude: lon(1, 0), expectedSign: 1 },
  { name: "D4 second quarter boundary", code: "D4", longitude: lon(1, 7.5), expectedSign: 4 },
  { name: "D4 third quarter boundary", code: "D4", longitude: lon(1, 15), expectedSign: 7 },
  { name: "D4 fourth quarter boundary", code: "D4", longitude: lon(1, 22.5), expectedSign: 10 },

  // D7 Saptamsa: odd signs start from themselves; even signs from the 7th.
  { name: "D7 odd-sign start", code: "D7", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D7 odd-sign first boundary", code: "D7", longitude: lon(0, 30 / 7), expectedSign: 1 },
  { name: "D7 even-sign start from 7th", code: "D7", longitude: lon(1, 0), expectedSign: 7 },
  { name: "D7 even-sign first boundary", code: "D7", longitude: lon(1, 30 / 7), expectedSign: 8 },

  // D9 Navamsa: movable from itself, fixed from 9th, dual from 5th.
  { name: "D9 movable sign start", code: "D9", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D9 movable next navamsa", code: "D9", longitude: lon(0, 30 / 9), expectedSign: 1 },
  { name: "D9 fixed sign starts from 9th", code: "D9", longitude: lon(1, 0), expectedSign: 9 },
  { name: "D9 dual sign starts from 5th", code: "D9", longitude: lon(2, 0), expectedSign: 6 },

  // D10 Dasamsa: odd from source sign, even from the 9th.
  { name: "D10 odd-sign start", code: "D10", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D10 odd-sign boundary", code: "D10", longitude: lon(0, 3), expectedSign: 1 },
  { name: "D10 even-sign start from 9th", code: "D10", longitude: lon(1, 0), expectedSign: 9 },

  // D12 Dwadasamsa: count from source sign.
  { name: "D12 first dwadasamsa", code: "D12", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D12 second dwadasamsa boundary", code: "D12", longitude: lon(0, 2.5), expectedSign: 1 },

  // D16 Shodashamsa: movable Aries, fixed Leo, dual Sagittarius.
  { name: "D16 movable starts Aries", code: "D16", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D16 fixed starts Leo", code: "D16", longitude: lon(1, 0), expectedSign: 4 },
  { name: "D16 dual starts Sagittarius", code: "D16", longitude: lon(2, 0), expectedSign: 8 },

  // D20 Vimsamsa: movable Aries, fixed Sagittarius, dual Leo.
  { name: "D20 movable starts Aries", code: "D20", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D20 fixed starts Sagittarius", code: "D20", longitude: lon(1, 0), expectedSign: 8 },
  { name: "D20 dual starts Leo", code: "D20", longitude: lon(2, 0), expectedSign: 4 },

  // D24 Chaturvimsamsa: odd from Leo, even from Cancer.
  { name: "D24 odd sign starts Leo", code: "D24", longitude: lon(0, 0), expectedSign: 4 },
  { name: "D24 even sign starts Cancer", code: "D24", longitude: lon(1, 0), expectedSign: 3 },
  { name: "D24 odd sign next segment", code: "D24", longitude: lon(0, 1.25), expectedSign: 5 },

  // D27 Nakshatramsa: fire/earth/air/water start signs.
  { name: "D27 fire starts Aries", code: "D27", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D27 earth starts Cancer", code: "D27", longitude: lon(1, 0), expectedSign: 3 },
  { name: "D27 air starts Libra", code: "D27", longitude: lon(2, 0), expectedSign: 6 },
  { name: "D27 water starts Capricorn", code: "D27", longitude: lon(3, 0), expectedSign: 9 },

  // D30 Trimsamsa: unequal five-part tables for odd/even signs.
  { name: "D30 odd 0–5°", code: "D30", longitude: lon(0, 4.999), expectedSign: 0 },
  { name: "D30 odd 5° boundary", code: "D30", longitude: lon(0, 5), expectedSign: 10 },
  { name: "D30 odd 10° boundary", code: "D30", longitude: lon(0, 10), expectedSign: 8 },
  { name: "D30 odd 18° boundary", code: "D30", longitude: lon(0, 18), expectedSign: 2 },
  { name: "D30 odd 25° boundary", code: "D30", longitude: lon(0, 25), expectedSign: 1 },
  { name: "D30 even 0–5°", code: "D30", longitude: lon(1, 4.999), expectedSign: 1 },
  { name: "D30 even 5° boundary", code: "D30", longitude: lon(1, 5), expectedSign: 5 },
  { name: "D30 even 12° boundary", code: "D30", longitude: lon(1, 12), expectedSign: 11 },
  { name: "D30 even 20° boundary", code: "D30", longitude: lon(1, 20), expectedSign: 9 },
  { name: "D30 even 25° boundary", code: "D30", longitude: lon(1, 25), expectedSign: 7 },

  // D40 Khavedamsa: odd from Aries, even from Libra.
  { name: "D40 odd sign starts Aries", code: "D40", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D40 even sign starts Libra", code: "D40", longitude: lon(1, 0), expectedSign: 6 },
  { name: "D40 odd next segment", code: "D40", longitude: lon(0, 0.75), expectedSign: 1 },

  // D45 Akshavedamsa: movable Aries, fixed Leo, dual Sagittarius.
  { name: "D45 movable starts Aries", code: "D45", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D45 fixed starts Leo", code: "D45", longitude: lon(1, 0), expectedSign: 4 },
  { name: "D45 dual starts Sagittarius", code: "D45", longitude: lon(2, 0), expectedSign: 8 },

  // D60 Shashtiamsa: odd signs from themselves, even signs from 7th.
  { name: "D60 odd sign starts itself", code: "D60", longitude: lon(0, 0), expectedSign: 0 },
  { name: "D60 odd next half-degree", code: "D60", longitude: lon(0, 0.5), expectedSign: 1 },
  { name: "D60 even sign starts 7th", code: "D60", longitude: lon(1, 0), expectedSign: 7 },
];

assert.equal(Object.keys(DIVISIONAL_CHARTS_CONFIG).length, 16,
  "The configured Shodashavarga set must contain exactly 16 named charts.");

for (const item of cases) {
  assert.equal(
    calculateDivisionalSignIndex(item.longitude, item.code),
    item.expectedSign,
    item.name
  );
}

// Equal-width vargas map each slice linearly into 0°–30° of the destination sign.
assert.ok(
  Math.abs(calculateDivisionalDegreeInSign(lon(0, 15), "D2")) < 1e-10,
  "D2's second hora begins at 0° of its destination sign"
);
assert.ok(
  Math.abs(calculateDivisionalDegreeInSign(lon(0, 30 / 7), "D7")) < 1e-8,
  "D7's second subdivision begins at 0° of its destination sign"
);
assert.ok(
  Math.abs(calculateDivisionalDegreeInSign(lon(0, 5), "D30") - 0) < 1e-10,
  "D30's 5° unequal boundary begins at 0° of the destination sign"
);

assert.throws(() => calculateDivisionalSignIndex(Number.NaN, "D9"), RangeError);
assert.throws(() => calculateDivisionalSignIndex(10, "D99"), RangeError);
assert.throws(() => calculateDivisionalDegreeInSign(Number.POSITIVE_INFINITY, "D9"), RangeError);
assert.throws(() => calculateDivisionalDegreeInSign(10, "unknown"), RangeError);
assert.throws(() => calculateDivisionalChart([], 10, "D99"), RangeError);

console.log(
  "Parashari Shodashavarga validation passed: " +
  cases.length +
  " source-rule sign-boundary cases plus degree mapping and invalid-input rejection."
);

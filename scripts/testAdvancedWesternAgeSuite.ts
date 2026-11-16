import { calculateCompletedAge } from "../lib/astronomy/predictiveHellenisticEngine";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

const ordinaryBirth = new Date("2001-01-01T12:00:00.000Z");
assert(calculateCompletedAge(ordinaryBirth, new Date("2002-01-01T11:59:59.999Z")) === 0, "Age remains unchanged immediately before the anniversary instant");
assert(calculateCompletedAge(ordinaryBirth, new Date("2002-01-01T12:00:00.000Z")) === 1, "Age increments exactly at the completed annual anniversary");
assert(calculateCompletedAge(ordinaryBirth, new Date("2003-01-01T12:00:00.000Z")) === 2, "Age counts multiple completed anniversaries");

const leapBirth = new Date("2000-02-29T08:30:00.000Z");
assert(calculateCompletedAge(leapBirth, new Date("2001-02-28T08:30:00.000Z")) === 0, "Leap-day birth does not increment before its March 1 non-leap-year anniversary");
assert(calculateCompletedAge(leapBirth, new Date("2001-03-01T08:30:00.000Z")) === 1, "Leap-day birth increments on the normalized March 1 anniversary");
assert(calculateCompletedAge(new Date("2030-01-01T00:00:00.000Z"), new Date("2026-11-16T00:00:00.000Z")) === 0, "Future birth inputs never produce a negative completed age");

console.log("\nAdvanced Western completed-age regression suite completed.");

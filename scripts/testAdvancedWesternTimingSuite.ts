import { ZodiacalReleasingEngine } from "../lib/astronomy/predictiveHellenisticEngine";

const engine = new ZodiacalReleasingEngine();
const birthDate = new Date("2000-01-01T00:00:00.000Z");
const dayMs = 86400000;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

// L1 Aries is 15 ideal years of 360 days, not 15 Gregorian calendar years.
const l1Check = engine.calculateReleasing(
  birthDate,
  0,
  "Spirit (Career & Purpose)",
  30,
  new Date(birthDate.getTime() + 5401 * dayMs)
);
assert(l1Check.releasingStartSign === "Aries", "Different Spirit/Fortune signs preserve the Spirit start sign");
assert(l1Check.allL1Periods[0].durationDays === 15 * 360, "L1 duration uses the 360-day ideal year");
assert(l1Check.currentL1Period.sign === "Taurus", "Current L1 advances past the completed Aries period");
assert(l1Check.currentL2Periods.some((period) => period.sign === l1Check.currentL2Period.sign), "Active L2 belongs to the generated L2 sequence");
assert(l1Check.currentL3Periods.some((period) => period.sign === l1Check.currentL3Period.sign), "Active L3 belongs to the generated L3 sequence");
assert(l1Check.currentL4Periods.some((period) => period.sign === l1Check.currentL4Period.sign), "Active L4 belongs to the generated L4 sequence");

const sameSignCheck = engine.calculateReleasing(
  birthDate,
  0,
  "Spirit (Career & Purpose)",
  0,
  birthDate
);
assert(sameSignCheck.releasingStartSign === "Taurus", "Same-sign Spirit/Fortune rule advances the releasing start sign");

// Aquarius L1 lasts 30 x 360 = 10,800 days. Its L2 cycle has room for a
// complete 12-sign circuit; the sequence then resumes from the opposite sign.
const loosingBondCheck = engine.calculateReleasing(
  birthDate,
  300,
  "Fortune (Physical Health & Material Fortune)",
  0,
  new Date(birthDate.getTime() + 6600 * dayMs)
);
assert(loosingBondCheck.currentL1Period.sign === "Aquarius", "Aquarius L1 remains active inside its 30-year period");
assert(loosingBondCheck.currentL2Period.sign === "Leo", "L2 resumes at the sign opposite Aquarius after the 12-sign circuit");
assert(loosingBondCheck.currentL2Period.isLoosingBond, "The post-circuit L2 period is flagged as Loosing of the Bond");
assert(loosingBondCheck.currentL2Periods.some((period) => period.sign === "Capricorn" && period.isPeak), "10th-from-Fortune peak is measured from Fortune, not the releasing Lot");

console.log("\nAdvanced Western timing regression suite completed.");

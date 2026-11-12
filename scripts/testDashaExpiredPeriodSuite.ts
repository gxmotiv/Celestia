import { CompleteDashaOrchestrator } from "../lib/vedic/completeDashaSystems";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean) {
  if (condition) {
    passed++;
    console.log("PASS: " + name);
  } else {
    failed++;
    console.error("FAIL: " + name);
  }
}

const orchestrator = new CompleteDashaOrchestrator();
const report = orchestrator.generateAllDashas({
  moonLongitude: 120,
  moonNakshatra1Indexed: 10,
  moonDegreeInNakshatra: 3,
  ascendantSign: "Aries",
  planetsInSigns: {},
  birthDate: new Date("1900-01-01T00:00:00.000Z"),
  referenceDate: new Date("2500-01-01T00:00:00.000Z"),
});

console.log("Expired dasha period regression suite");
assert("Expired Yogini timeline has no fabricated current period", report.currentYogini === null);
assert("Expired Chara timeline has no fabricated current period", report.currentChara === null);
assert("Expired Kalachakra timeline has no fabricated current period", report.currentKalachakra === null);
assert("Expired Ashtottari timeline has no fabricated current period", report.currentAshtottari === null);
assert("No Vimshottari Prana is reported without a current sub-period context", report.currentPrana === null);
assert("Convergence omits an invented default-active Vimshottari entry",
  !report.convergence.some(item => item.system === "Vimshottari"));

console.log(`Expired dasha results: ${passed}/${passed + failed} passed`);
if (failed) process.exit(1);

import { CompleteBaZiEngine, SolarTermCalculator } from "../lib/astronomy/baziEngine";

function cycleIndex(stemIndex: number, branchIndex: number): number {
  for (let index = 0; index < 60; index++) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) return index;
  }
  return -1;
}
const results: { name: string; passed: boolean; expected: string; actual: string }[] = [];
function test(name: string, passed: boolean, expected: string, actual: string) {
  results.push({ name, passed, expected, actual });
}

const calculator = new SolarTermCalculator();
const jan1Late = new Date("2000-01-01T23:30:00.000Z");
const pureZiDay = calculator.calculateDayPillar(jan1Late, "pure-zi");
const earlyLateDay = calculator.calculateDayPillar(jan1Late, "early-late-zi");
test("Pure Zi rolls the day pillar at 23:00", cycleIndex(pureZiDay.heavenlyStem.index, pureZiDay.earthlyBranch.index) === 55, "cycle index 55", String(cycleIndex(pureZiDay.heavenlyStem.index, pureZiDay.earthlyBranch.index)));
test("Early/Late Zi keeps the current day pillar at 23:30", cycleIndex(earlyLateDay.heavenlyStem.index, earlyLateDay.earthlyBranch.index) === 54, "cycle index 54", String(cycleIndex(earlyLateDay.heavenlyStem.index, earlyLateDay.earthlyBranch.index)));

const jan2Midnight = new Date("2000-01-02T00:00:00.000Z");
for (const policy of ["pure-zi", "early-late-zi"] as const) {
  const day = calculator.calculateDayPillar(jan2Midnight, policy);
  const actual = cycleIndex(day.heavenlyStem.index, day.earthlyBranch.index);
  test("Both policies use the new date at 00:00 (" + policy + ")", actual === 55, "cycle index 55", String(actual));
}

const ratHour = calculator.calculateHourPillar(new Date("2000-01-01T23:59:59.999Z"), 4);
test("23:59:59.999 is Rat hour", ratHour.earthlyBranch.index === 0, "branch 0", String(ratHour.earthlyBranch.index));
const oxHour = calculator.calculateHourPillar(new Date("2000-01-02T01:00:00.000Z"), 4);
test("01:00:00 begins Ox hour", oxHour.earthlyBranch.index === 1, "branch 1", String(oxHour.earthlyBranch.index));
const lastRatInstant = calculator.calculateHourPillar(new Date("2000-01-02T00:59:59.999Z"), 4);
test("00:59:59.999 remains Rat hour", lastRatInstant.earthlyBranch.index === 0, "branch 0", String(lastRatInstant.earthlyBranch.index));

const engine = new CompleteBaZiEngine();
const chart = engine.generateBaZiChart(
  new Date("2000-01-01T18:30:00.000Z"),
  "Male",
  new Date("2024-01-01T00:00:00.000Z"),
  {
    clock: {
      timeBasis: "local-mean-solar",
      longitudeDegrees: 77.209,
    },
    dayBoundaryPolicy: "early-late-zi",
  }
);
test("Complete chart reports its selected solar-time policy", chart.calculationContext?.timeBasis === "local-mean-solar" && chart.calculationContext?.dayBoundaryPolicy === "early-late-zi", "local-mean-solar / early-late-zi", String(chart.calculationContext?.timeBasis) + " / " + String(chart.calculationContext?.dayBoundaryPolicy));
test("Complete chart retains the original UTC birth instant", chart.birthDate.toISOString() === "2000-01-01T18:30:00.000Z", "2000-01-01T18:30:00.000Z", chart.birthDate.toISOString());

let passed=0,failed=0;
for(const result of results){if(result.passed)passed++;else failed++;console.log("["+(result.passed?"PASS":"FAIL")+"] "+result.name);if(!result.passed)console.log("  Expected: "+result.expected+"\n  Actual:   "+result.actual);}
console.log("TOTAL TESTS: "+results.length);
console.log("PASSED: "+passed);
console.log("FAILED: "+failed);
if(failed>0)process.exit(1);

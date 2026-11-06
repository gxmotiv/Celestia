import { calculateBaZiProfileFromInstant } from "../lib/astronomy/baziProfileAdapter";

const profile = calculateBaZiProfileFromInstant(
  new Date("2000-01-01T18:30:00.000Z"),
  {
    clock: { timeBasis: "local-mean-solar", longitudeDegrees: 77.209 },
    dayBoundaryPolicy: "early-late-zi",
  }
);
const results: { name: string; passed: boolean; actual: string }[] = [];
function test(name: string, passed: boolean, actual: string) {
  results.push({ name, passed, actual });
}
test("All four pillars are adapted from the unified engine", !!profile.yearPillar && !!profile.monthPillar && !!profile.dayPillar && !!profile.hourPillar, [profile.yearPillar.combinedName, profile.monthPillar.combinedName, profile.dayPillar.combinedName, profile.hourPillar.combinedName].join(" | "));
test("Five-element display percentages sum to 100", Object.values(profile.elementsBalance).reduce((sum, value) => sum + value, 0) === 100, JSON.stringify(profile.elementsBalance));
test("Yin/Yang display percentages sum to 100", profile.yinYangRatio.yang + profile.yinYangRatio.yin === 100, JSON.stringify(profile.yinYangRatio));
test("Display profile exposes the selected calculation convention", profile.calculationContext?.timeBasis === "local-mean-solar" && profile.calculationContext?.dayBoundaryPolicy === "early-late-zi", JSON.stringify(profile.calculationContext));
test("Day Master uses the unified engine's stem", profile.dayMaster.stem.name === profile.dayPillar.stem.name, profile.dayMaster.stem.name + " / " + profile.dayPillar.stem.name);
test("Compatibility is clearly labelled as traditional, not empirical", profile.compatibilities.description.includes("not empirical"), profile.compatibilities.description);

let passed=0,failed=0;
for(const result of results){if(result.passed)passed++;else failed++;console.log("["+(result.passed?"PASS":"FAIL")+"] "+result.name);if(!result.passed)console.log("  Actual: "+result.actual);}
console.log("TOTAL TESTS: "+results.length);
console.log("PASSED: "+passed);
console.log("FAILED: "+failed);
if(failed>0)process.exit(1);

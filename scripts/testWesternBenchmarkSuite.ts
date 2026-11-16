import { WesternBenchmarkRunner } from "../lib/astronomy/westernBenchmarkTests";

const report = new WesternBenchmarkRunner().runFullSuite();
console.log("\nWestern Astrology benchmark suite");
console.log(`Total: ${report.totalTests} | Passed: ${report.passedCount} | Failed: ${report.failedCount} | Pass rate: ${report.passRatePercent}%`);
for (const result of report.results.filter((item) => !item.passed)) {
  console.error(`[FAIL] ${result.id} ${result.name}`);
  console.error(`  Expected: ${result.expected}`);
  console.error(`  Actual:   ${result.actual}`);
  if (result.details) console.error(`  Details:  ${result.details}`);
}

if (report.failedCount > 0) {
  throw new Error(`${report.failedCount} Western Astrology benchmark assertion(s) failed.`);
}

console.log("All Western Astrology benchmark assertions passed.");

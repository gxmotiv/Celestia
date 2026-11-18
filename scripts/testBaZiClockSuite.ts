import {
  createBaZiClock,
  equationOfTimeMinutes,
} from "../lib/astronomy/timeEngine";
import { SolarTermCalculator } from "../lib/astronomy/baziEngine";

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail: string): void {
  if (condition) {
    passed++;
    console.log("PASS", name, detail);
  } else {
    failed++;
    console.error("FAIL", name, detail);
  }
}

function close(a: number, b: number, tolerance = 1e-8): boolean {
  return Math.abs(a - b) <= tolerance;
}

const instant = new Date("2024-06-01T12:34:56.789Z");
const eot = equationOfTimeMinutes(instant);
const civil = createBaZiClock(instant, {
  timeBasis: "civil-clock",
  longitudeDegrees: 77.6,
  civilUtcOffsetSeconds: 19_800,
});
test(
  "Civil clock applies exact explicit UTC+05:30 offset",
  civil.clockDate.toISOString() === "2024-06-01T18:04:56.789Z",
  civil.clockDate.toISOString()
);
test(
  "Civil clock preserves birth seconds and milliseconds",
  civil.clockDate.getUTCSeconds() === 56 && civil.clockDate.getUTCMilliseconds() === 789,
  civil.clockDate.toISOString()
);

const lmst = createBaZiClock(instant, {
  timeBasis: "local-mean-solar",
  longitudeDegrees: 77.6,
});
test(
  "LMST uses east-positive longitude × 4 minutes per degree",
  close(lmst.longitudeCorrectionSeconds, 18_624),
  String(lmst.longitudeCorrectionSeconds)
);
test(
  "LMST shifts instant by longitude correction",
  lmst.clockDate.getTime() - instant.getTime() === 18_624_000,
  lmst.clockDate.toISOString()
);

const last = createBaZiClock(instant, {
  timeBasis: "local-apparent-solar",
  longitudeDegrees: 77.6,
});
test(
  "LAST equals LMST plus Equation of Time",
  close(
    last.clockDate.getTime() - lmst.clockDate.getTime(),
    eot * 60_000,
    1
  ),
  `EoT=${eot.toFixed(6)} min; delta=${(last.clockDate.getTime() - lmst.clockDate.getTime()) / 60_000} min`
);
test(
  "Equation of Time is finite and bounded for this date",
  Number.isFinite(eot) && Math.abs(eot) < 20,
  `${eot.toFixed(6)} minutes`
);

const calc = new SolarTermCalculator();
const dayBeforeZi = new Date("2024-02-10T22:59:59.999Z");
const atZi = new Date("2024-02-10T23:00:00.000Z");
const nextMidnight = new Date("2024-02-11T00:00:00.000Z");
const earlyBefore = calc.calculateDayPillar(dayBeforeZi, "pure-zi");
const pureAt = calc.calculateDayPillar(atZi, "pure-zi");
const earlyAt = calc.calculateDayPillar(atZi, "early-late-zi");
const earlyMidnight = calc.calculateDayPillar(nextMidnight, "early-late-zi");
test(
  "Pure-Zi day changes at 23:00",
  pureAt.combinedChinese !== earlyBefore.combinedChinese,
  `${earlyBefore.combinedChinese} -> ${pureAt.combinedChinese}`
);
test(
  "Early/Late-Zi keeps civil day at 23:00",
  earlyAt.combinedChinese === earlyBefore.combinedChinese,
  `${earlyBefore.combinedChinese} / ${earlyAt.combinedChinese}`
);
test(
  "Early/Late-Zi changes at local midnight",
  earlyMidnight.combinedChinese !== earlyAt.combinedChinese,
  `${earlyAt.combinedChinese} -> ${earlyMidnight.combinedChinese}`
);

const hourCalc = new SolarTermCalculator();
const hour23 = hourCalc.calculateHourPillar(new Date("2024-02-10T22:59:59.999Z"), 0);
const hour2300 = hourCalc.calculateHourPillar(new Date("2024-02-10T23:00:00.000Z"), 0);
const hour0100 = hourCalc.calculateHourPillar(new Date("2024-02-11T01:00:00.000Z"), 0);
test(
  "Hour branch changes at 23:00 into Zi",
  hour23.earthlyBranch.index === 11 && hour2300.earthlyBranch.index === 0,
  `${hour23.earthlyBranch.name} -> ${hour2300.earthlyBranch.name}`
);
test(
  "Hour branch changes at 01:00 into Chou",
  hour0100.earthlyBranch.index === 1,
  hour0100.earthlyBranch.name
);

let invalidRejected = false;
try {
  createBaZiClock(instant, {
    timeBasis: "civil-clock",
    longitudeDegrees: 77.6,
  });
} catch {
  invalidRejected = true;
}
test(
  "Civil clock rejects a missing UTC offset",
  invalidRejected,
  invalidRejected ? "RangeError thrown" : "No error"
);

console.log(`BAZI TIME ENGINE: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;

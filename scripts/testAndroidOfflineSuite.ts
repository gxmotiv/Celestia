import { calculateOfflineAstrology, type OfflineBirthInput } from "../lib/android/offlineCalculation";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { readFileSync } from "node:fs";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail: string): void {
  if (condition) {
    passed++;
    console.log("[PASS] " + name);
  } else {
    failed++;
    console.error("[FAIL] " + name + " — " + detail);
  }
}

const sample: OfflineBirthInput = {
  fullName: "Offline Verification Sample",
  birthDate: "1990-05-15",
  birthTime: "06:30",
  isTimeUnknown: false,
  cityName: "New Delhi",
  country: "India",
  latitude: 28.6139,
  longitude: 77.209,
  timezoneOffsetHours: 5.5,
  houseSystem: "WholeSign",
  baziTimeBasis: "local-mean-solar",
  baziDayBoundaryPolicy: "pure-zi",
};

const result = calculateOfflineAstrology(sample);
const directWestern = calculateWesternChart(
  1990, 5, 15, 6, 30, 28.6139, 77.209, 5.5, "WholeSign"
);

assert(
  "Offline helper returns the complete Western planet set",
  result.westernData.planets.length >= 10,
  "planet count=" + result.westernData.planets.length
);
assert(
  "Offline Western Sun longitude matches the shared website engine",
  result.westernData.planets.find((p) => p.name === "Sun")?.longitude ===
    directWestern.planets.find((p) => p.name === "Sun")?.longitude,
  "The offline wrapper must not change the calculation inputs or result."
);
assert(
  "Offline Vedic output includes the Moon nakshatra",
  Boolean(result.vedicData.planets.find((p) => p.name === "Moon")?.nakshatraName),
  "Moon nakshatra is missing."
);
assert(
  "Offline Vedic output includes the Dasha timeline",
  result.vedicData.vimshottariDashas.length > 0,
  "No Vimshottari periods were returned."
);
assert(
  "Offline numerology produces a Life Path number",
  Number.isFinite(result.numerologyData.lifePathNumber),
  "Life Path number is not finite."
);
assert(
  "Offline BaZi output contains all four pillars",
  Boolean(
    result.baziData.yearPillar?.combinedName &&
    result.baziData.monthPillar?.combinedName &&
    result.baziData.dayPillar?.combinedName &&
    result.baziData.hourPillar?.combinedName
  ),
  "One or more BaZi pillars are missing."
);
assert(
  "Birth instant is normalized to UTC",
  result.birthTimeContext.utcInstant === "1990-05-15T01:00:00.000Z",
  "UTC instant=" + result.birthTimeContext.utcInstant
);
assert(
  "Manual offset limitation is disclosed",
  result.birthTimeContext.warning.includes("manually supplied"),
  "Timezone provenance warning is missing."
);

let invalidDateRejected = false;
try {
  calculateOfflineAstrology({ ...sample, birthDate: "1990-02-30" });
} catch {
  invalidDateRejected = true;
}
assert("Invalid calendar date is rejected", invalidDateRejected, "Invalid date was accepted.");

let invalidOffsetRejected = false;
try {
  calculateOfflineAstrology({ ...sample, timezoneOffsetHours: 15 });
} catch {
  invalidOffsetRejected = true;
}
assert("Out-of-range UTC offset is rejected", invalidOffsetRejected, "Invalid UTC offset was accepted.");

let invalidTimeRejected = false;
try {
  calculateOfflineAstrology({ ...sample, birthTime: "25:90" });
} catch {
  invalidTimeRejected = true;
}
assert("Invalid birth clock time is rejected", invalidTimeRejected, "Invalid birth time was accepted.");



const offlineHtml = readFileSync("android/app/src/main/assets/offline/index.html", "utf8");
assert(
  "Offline page references the bundled calculation engine",
  offlineHtml.includes('<script src="./celestia-offline.js"></script>'),
  "The local calculation bundle is not referenced."
);
assert(
  "Offline page blocks network connections through CSP",
  offlineHtml.includes("connect-src 'none'"),
  "Offline Content Security Policy does not block connections."
);
assert(
  "Offline page stores profiles in local browser storage",
  offlineHtml.includes("localStorage") && offlineHtml.includes("celestia_android_offline_profiles_v1"),
  "Local profile storage key or API is missing."
);
assert(
  "Offline page does not use fetch requests",
  !offlineHtml.includes("fetch("),
  "A fetch() call was found in the bundled offline page."
);

console.log("ANDROID OFFLINE CALCULATION TESTS: " + passed + " passed, " + failed + " failed");
if (failed > 0) process.exitCode = 1;

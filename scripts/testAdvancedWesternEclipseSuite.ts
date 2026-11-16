import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { EclipseAnalyzer } from "../lib/astronomy/specializedWesternEngines";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

const chart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, -74.006, -5, "Placidus");
const analyzer = new EclipseAnalyzer();
const asOf = new Date("2026-11-16T00:00:00.000Z");
const events = analyzer.analyzeEclipses(chart, asOf);

assert(events.length === 20, "Future catalogue contains all 20 NASA-listed 2027-2030 eclipse events");
assert(events.every((event) => event.date >= "2026-11-16"), "Past eclipse entries are excluded from the upcoming list");
assert(events.every((event) => event.degree >= 0 && event.degree < 360), "Every eclipse has a normalized calculated tropical longitude");
assert(events.every((event) => event.affectedHouse >= 1 && event.affectedHouse <= 12), "Every eclipse is assigned to a valid natal house");
assert(events.some((event) => event.type === "Penumbral Lunar" && event.intensity === "Moderate"), "Penumbral lunar eclipses are represented with a distinct type and intensity");
assert(events[0].date.startsWith("2027-02-06"), "The first upcoming event is the 2027-02-06 annular solar eclipse");
assert(events.every((event, index) => index === 0 || events[index - 1].date <= event.date), "Upcoming eclipse events are ordered chronologically");

const afterCatalogue = analyzer.analyzeEclipses(chart, new Date("2031-01-01T00:00:00.000Z"));
assert(afterCatalogue.length === 0, "Events outside the published 2027-2030 catalogue are not fabricated");

console.log("\nAdvanced Western eclipse regression suite completed.");

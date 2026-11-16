import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { FirdariaEngine } from "../lib/astronomy/predictiveHellenisticEngine";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

const baseChart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, -74.006, -5, "Placidus");
const diurnalChart = {
  ...baseChart,
  planets: baseChart.planets.map((planet) =>
    planet.name === "Sun" ? { ...planet, house: 10 } : planet
  ),
};
const nocturnalChart = {
  ...baseChart,
  planets: baseChart.planets.map((planet) =>
    planet.name === "Sun" ? { ...planet, house: 1 } : planet
  ),
};

const engine = new FirdariaEngine();
const diurnal = engine.calculateFirdaria(diurnalChart, 76);
assert(diurnal.isDiurnal, "Sun above horizon selects the diurnal sequence");
assert(diurnal.allPeriods.length === 9, "One complete 75-year cycle contains nine major periods");
assert(diurnal.allPeriods[0].planet === "Sun" && diurnal.allPeriods[1].planet === "Venus", "Diurnal sequence starts Sun then Venus");
assert(diurnal.allPeriods[0].subPeriods.map((period) => period.subLord).join(",") === "Sun,Venus,Mercury,Moon,Saturn,Jupiter,Mars", "Sun major sub-periods start with Sun and follow the diurnal order");
assert(diurnal.allPeriods[1].subPeriods.map((period) => period.subLord).join(",") === "Venus,Mercury,Moon,Saturn,Jupiter,Mars,Sun", "Venus major rotates the sub-period order to begin with Venus");
assert(diurnal.allPeriods[7].subPeriods.length === 0 && diurnal.allPeriods[8].subPeriods.length === 0, "North and South Node major periods have no planetary sub-periods");
assert(diurnal.activeMajorLord === "Sun" && diurnal.activeYearsRange.startsWith("Age 75"), "The 75-year sequence repeats after the first cycle");
assert(diurnal.activeSubLord === "Sun", "The repeated Sun major restarts its own sub-period sequence");

const nodePeriod = engine.calculateFirdaria(diurnalChart, 71);
assert(nodePeriod.activeMajorLord === "NorthNode", "North Node major period is active from age 70 to 73");
assert(nodePeriod.activeSubLord.startsWith("No traditional sub-period"), "Node major period does not fabricate a planetary sub-ruler");

const nocturnal = engine.calculateFirdaria(nocturnalChart, 32);
assert(!nocturnal.isDiurnal, "Sun below horizon selects the nocturnal sequence");
assert(nocturnal.allPeriods[0].planet === "Moon" && nocturnal.allPeriods[1].planet === "Saturn", "Nocturnal sequence starts Moon then Saturn");
assert(nocturnal.allPeriods[3].planet === "Mars", "Nocturnal major order reaches Mars at age 32");
assert(nocturnal.activeMajorLord === "Mars", "Major-period boundary uses a half-open interval at age 32");
assert(nocturnal.activeSubLord === "Mars", "Nocturnal Mars major begins with its Mars sub-period");

console.log("\nAdvanced Western Firdaria regression suite completed.");

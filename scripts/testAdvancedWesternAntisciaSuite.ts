import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { AntisciaCalculator } from "../lib/astronomy/advancedWesternCalculators";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

const calculator = new AntisciaCalculator();
assert(calculator.calculateAntiscion(75) === 105, "15° Gemini antiscion is 15° Cancer");
assert(calculator.calculateContraAntiscion(75) === 285, "15° Gemini contra-antiscion is 15° Capricorn");
assert(calculator.calculateAntiscion(90) === 90, "0° Cancer is fixed on the solstitial mirror axis");
assert(calculator.calculateAntiscion(270) === 270, "0° Capricorn is fixed on the solstitial mirror axis");
assert(calculator.calculateContraAntiscion(0) === 0, "0° Aries is fixed on the equinoctial mirror axis");
assert(calculator.calculateContraAntiscion(180) === 180, "0° Libra is fixed on the equinoctial mirror axis");

const chart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, -74.006, -5, "Placidus");
const sun = chart.planets.find((planet) => planet.name === "Sun");
const moon = chart.planets.find((planet) => planet.name === "Moon");
const mercury = chart.planets.find((planet) => planet.name === "Mercury");
if (!sun || !moon || !mercury) throw new Error("Natal planetary fixture missing.");

const synthetic = calculator.calculate([
  { ...sun, longitude: 75, name: "Sun" },
  { ...moon, longitude: 105, name: "Moon" },
  { ...mercury, longitude: 285, name: "Mercury" },
], 0.01);
assert(
  synthetic.antiscionContacts.some((contact) => contact.point1 === "Sun" && contact.point2 === "Moon"),
  "Sun at 15° Gemini forms an antiscion contact with Moon at 15° Cancer"
);
assert(
  synthetic.contraAntiscionContacts.some((contact) => contact.point1 === "Sun" && contact.point2 === "Mercury"),
  "Sun at 15° Gemini forms a contra-antiscion contact with Mercury at 15° Capricorn"
);
assert(synthetic.antiscionContacts.every((contact) => contact.orb <= 0.01), "Antiscion contacts respect the configured orb");
assert(synthetic.contraAntiscionContacts.every((contact) => contact.orb <= 0.01), "Contra-antiscion contacts respect the configured orb");

const natalPoints = calculator.calculate([
  ...chart.planets,
  { ...chart.ascendant, name: "ASC" },
  { ...chart.midheaven, name: "MC" },
]);
assert(natalPoints.points.length === chart.planets.length + 2, "The report includes all natal planets plus ASC and MC");
assert(natalPoints.points.some((point) => point.point === "ASC"), "Ascendant mirror points are included");
assert(natalPoints.points.some((point) => point.point === "MC"), "Midheaven mirror points are included");

console.log("\nAdvanced Western antiscia regression suite completed.");

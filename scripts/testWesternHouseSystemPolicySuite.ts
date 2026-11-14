import assert from "node:assert/strict";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import {
  isWesternHouseSystemImplemented,
  recommendWesternHouseSystem,
} from "../lib/astronomy/westernHouseSystemPolicy";

let assertions = 0;
function check(value: unknown, message: string): void {
  assert.ok(value, message);
  assertions += 1;
}

const modern = recommendWesternHouseSystem("modern-natal", 40.7);
check(modern.status === "supported" && modern.preferredSystem === "Placidus" &&
  modern.resolvedSystem === "Placidus",
  "Modern Western natal Auto recommends the currently supported Placidus method");

const polarModern = recommendWesternHouseSystem("modern-natal", 70);
check(polarModern.status === "supported" && polarModern.preferredSystem === "Placidus" &&
  polarModern.resolvedSystem === "Porphyry" && polarModern.usedPolarFallback,
  "Modern natal Auto discloses the conservative Porphyry high-latitude fallback");

const hellenistic = recommendWesternHouseSystem("hellenistic-natal", 35);
check(hellenistic.resolvedSystem === "WholeSign" && hellenistic.status === "supported",
  "Hellenistic natal Auto selects the implemented Whole Sign framework");

const timeLord = recommendWesternHouseSystem("hellenistic-time-lord", 35);
check(timeLord.resolvedSystem === "WholeSign",
  "Hellenistic time-lord workflows explicitly retain the Whole Sign framework");

const transit = recommendWesternHouseSystem("western-transits");
check(transit.mode === "inherit-natal" && transit.resolvedSystem === undefined,
  "Transit Auto inherits the natal system rather than silently choosing another one");

const returns = recommendWesternHouseSystem("solar-lunar-returns");
check(returns.mode === "inherit-natal",
  "Solar and lunar return charts inherit the user's explicitly selected system");

const synastry = recommendWesternHouseSystem("synastry");
check(synastry.mode === "per-chart" && synastry.status === "requires-inherited-system",
  "Synastry preserves each person's house system independently");

const horary = recommendWesternHouseSystem("lilly-horary");
check(horary.preferredSystem === "Regiomontanus" && horary.status === "unsupported" &&
  horary.resolvedSystem === undefined,
  "Lilly-style horary reports Regiomontanus as not yet calculated instead of silently substituting Placidus");

const electional = recommendWesternHouseSystem("lilly-electional");
check(electional.preferredSystem === "Regiomontanus" && electional.status === "unsupported",
  "The named Lilly-derived electional preset does not claim unavailable Regiomontanus calculations");

const directions = recommendWesternHouseSystem("primary-directions");
check(directions.mode === "method-specific" && directions.resolvedSystem === undefined,
  "Primary directions require an explicit direction/domification method instead of a generic house default");

const uranian = recommendWesternHouseSystem("uranian-hamburg");
check(uranian.mode === "method-specific",
  "Uranian house conventions remain source/configuration-specific");

const cosmobiology = recommendWesternHouseSystem("cosmobiology");
check(cosmobiology.mode === "method-specific",
  "Cosmobiology does not inherit an invented universal house-system recommendation");

const astrocartography = recommendWesternHouseSystem("astrocartography");
check(astrocartography.mode === "not-applicable",
  "Astrocartography line calculations are not forced into an ordinary house system");

check(isWesternHouseSystemImplemented("Placidus") &&
  isWesternHouseSystemImplemented("Equal") &&
  isWesternHouseSystemImplemented("WholeSign") &&
  isWesternHouseSystemImplemented("Porphyry"),
  "The implementation registry recognizes the four currently calculated Western house systems");

check(!isWesternHouseSystemImplemented("Regiomontanus") &&
  !isWesternHouseSystemImplemented("Koch") &&
  !isWesternHouseSystemImplemented("Campanus"),
  "House-system labels without calculation engines are not treated as implemented");

const natal = calculateWesternChart(2000, 1, 1, 12, 0, 40.7, -74, -5, "Auto");
check(natal.requestedHouseSystem === "Auto" && natal.houseSystem === "Placidus",
  "The natal chart calculator uses the central technique policy for ordinary-latitude Auto selection");

const polarNatal = calculateWesternChart(2000, 1, 1, 12, 0, 70, 20, 1, "Auto");
check(polarNatal.requestedHouseSystem === "Auto" && polarNatal.houseSystem === "Porphyry" &&
  Boolean(polarNatal.houseSystemNote?.includes("high-latitude")),
  "The natal chart calculator exposes the central policy's polar fallback in chart metadata");

let invalidLatitudeRejected = false;
try {
  recommendWesternHouseSystem("modern-natal", 91);
} catch (error) {
  invalidLatitudeRejected = error instanceof RangeError;
}
check(invalidLatitudeRejected,
  "House-system policy rejects invalid latitude rather than making an automatic selection");

console.log(`Western house-system policy suite passed: ${assertions} assertions.`);

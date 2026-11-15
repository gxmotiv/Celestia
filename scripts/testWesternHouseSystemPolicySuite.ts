import assert from "node:assert/strict";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import {
  isWesternHouseSystemImplemented,
  recommendWesternHouseSystem,
  toWesternTransitHouseSystem,
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
check(horary.preferredSystem === "Regiomontanus" && horary.status === "supported" &&
  horary.resolvedSystem === "Regiomontanus" &&
  horary.rationale.includes("does not mean the complete Lilly horary judgement engine is implemented"),
  "Lilly-style horary can use the supported Regiomontanus house method while keeping full judgement scope distinct");

const electional = recommendWesternHouseSystem("lilly-electional");
check(electional.preferredSystem === "Regiomontanus" && electional.status === "supported" &&
  electional.resolvedSystem === "Regiomontanus" &&
  electional.rationale.includes("complete election search") ,
  "The Lilly-derived electional preset distinguishes supported house math from the missing full electional workflow");

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
  isWesternHouseSystemImplemented("Porphyry") &&
  isWesternHouseSystemImplemented("Regiomontanus") &&
  isWesternHouseSystemImplemented("Koch") &&
  isWesternHouseSystemImplemented("Campanus") &&
  isWesternHouseSystemImplemented("Alcabitius"),
  "The implementation registry recognizes the eight currently calculated Western house systems");

check(toWesternTransitHouseSystem("Koch") === "koch" &&
  toWesternTransitHouseSystem("Regiomontanus") === "regiomontanus" &&
  toWesternTransitHouseSystem("Porphyry") === "porphyry" &&
  toWesternTransitHouseSystem("Placidus") === "placidus" &&
  toWesternTransitHouseSystem("Equal") === "equal" &&
  toWesternTransitHouseSystem("WholeSign") === "whole-sign" &&
  toWesternTransitHouseSystem("Campanus") === "campanus" &&
  toWesternTransitHouseSystem("Alcabitius") === "alcabitius",
  "Transit Auto mapping preserves every implemented natal house method, including Koch, Campanus and Alcabitius");

const kochSchool = recommendWesternHouseSystem("koch-school-natal", 52.2);
check(kochSchool.status === "supported" && kochSchool.preferredSystem === "Koch" &&
  kochSchool.resolvedSystem === "Koch",
  "A named Koch-school natal profile selects Koch without altering the modern Western Auto default");
const polarKochSchool = recommendWesternHouseSystem("koch-school-natal", 70);
check(polarKochSchool.preferredSystem === "Koch" &&
  polarKochSchool.resolvedSystem === "Porphyry" && polarKochSchool.usedPolarFallback,
  "A Koch-school profile discloses Porphyry as the actual polar-latitude fallback");

const campanusSchool = recommendWesternHouseSystem("campanus-school-natal", 45);
check(campanusSchool.status === "supported" &&
  campanusSchool.preferredSystem === "Campanus" &&
  campanusSchool.resolvedSystem === "Campanus",
  "A named Campanus-school profile selects Campanus without altering the modern Western Auto default");
const campanusPole = recommendWesternHouseSystem("campanus-school-natal", 90);
check(campanusPole.preferredSystem === "Campanus" &&
  campanusPole.resolvedSystem === "Porphyry" && campanusPole.usedPolarFallback,
  "A Campanus request at the exact geographic pole reports Porphyry as the actual fallback");

const campanusNatal = calculateWesternChart(2000, 1, 1, 12, 0, 45, 0, 0, "Campanus");
check(campanusNatal.requestedHouseSystem === "Campanus" &&
  campanusNatal.houseSystem === "Campanus" && campanusNatal.houses.length === 12,
  "The Western natal chart resolves and exposes twelve Campanus houses");

const alcabitiusSchool = recommendWesternHouseSystem("alcabitius-school-natal", 45);
check(alcabitiusSchool.status === "supported" &&
  alcabitiusSchool.preferredSystem === "Alcabitius" &&
  alcabitiusSchool.resolvedSystem === "Alcabitius",
  "A named Alcabitius-school profile selects Alcabitius without changing the modern Western Auto default");
const alcabitiusPole = recommendWesternHouseSystem("alcabitius-school-natal", 90);
check(alcabitiusPole.preferredSystem === "Alcabitius" &&
  alcabitiusPole.resolvedSystem === "Porphyry" && alcabitiusPole.usedPolarFallback,
  "An exact-pole Alcabitius request discloses Porphyry as the actual fallback");
const alcabitiusNatal = calculateWesternChart(2000, 1, 1, 12, 0, 45, 0, 0, "Alcabitius");
check(alcabitiusNatal.requestedHouseSystem === "Alcabitius" &&
  alcabitiusNatal.houseSystem === "Alcabitius" && alcabitiusNatal.houses.length === 12,
  "The Western natal calculator resolves and exposes twelve Alcabitius houses");

const natal = calculateWesternChart(2000, 1, 1, 12, 0, 40.7, -74, -5, "Auto");
check(natal.requestedHouseSystem === "Auto" && natal.houseSystem === "Placidus",
  "The natal chart calculator uses the central technique policy for ordinary-latitude Auto selection");

const polarNatal = calculateWesternChart(2000, 1, 1, 12, 0, 70, 20, 1, "Auto");
check(polarNatal.requestedHouseSystem === "Auto" && polarNatal.houseSystem === "Porphyry" &&
  Boolean(polarNatal.houseSystemNote?.includes("high-latitude")),
  "The natal chart calculator exposes the central policy's polar fallback in chart metadata");

const regioNatal = calculateWesternChart(2000, 1, 1, 12, 0, 40.7, -74, -5, "Regiomontanus");
check(regioNatal.requestedHouseSystem === "Regiomontanus" &&
  regioNatal.houseSystem === "Regiomontanus" && regioNatal.houses.length === 12,
  "The Western natal chart resolves and exposes the Regiomontanus house system");

let invalidLatitudeRejected = false;
try {
  recommendWesternHouseSystem("modern-natal", 91);
} catch (error) {
  invalidLatitudeRejected = error instanceof RangeError;
}
check(invalidLatitudeRejected,
  "House-system policy rejects invalid latitude rather than making an automatic selection");

console.log(`Western house-system policy suite passed: ${assertions} assertions.`);

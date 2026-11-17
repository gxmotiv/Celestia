import assert from "node:assert/strict";
import {
  ShadbalaEngine,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

const bphs = {
  Sun: 390,
  Moon: 360,
  Mars: 300,
  Mercury: 420,
  Jupiter: 390,
  Venus: 330,
  Saturn: 300,
} as const;

const raman = {
  Sun: 300,
  Moon: 360,
  Mars: 300,
  Mercury: 420,
  Jupiter: 390,
  Venus: 330,
  Saturn: 300,
} as const;

assert.deepEqual(
  ShadbalaEngine.REQUIRED_RUPAS,
  Object.fromEntries(Object.entries(bphs).map(([planet, virupas]) => [planet, virupas / 60]))
);
assert.deepEqual(
  ShadbalaEngine.RAMAN_REQUIRED_RUPAS,
  Object.fromEntries(Object.entries(raman).map(([planet, virupas]) => [planet, virupas / 60]))
);

const engine = new ShadbalaEngine();

for (const planet of Object.keys(bphs) as (keyof typeof bphs)[]) {
  const input: ShadbalaChartInput = {
    ascendant: 0,
    birthTimeKnown: false,
    planets: {
      [planet]: { longitude: 125 },
    },
  };

  const defaultResult = engine.calculateShadbala(planet, input);
  assert.equal(defaultResult.requirementMethod, "bphs-27-32-33");
  assert.equal(defaultResult.requiredVirupas, bphs[planet],
    `BPHS 27.32–33 ${planet} minimum must match the published Virupa table`);
  assert.equal(defaultResult.requiredRupas, bphs[planet] / 60);

  const ramanResult = engine.calculateShadbala(planet, {
    ...input,
    shadbalaRequirementMethod: "raman-article-122",
  });
  assert.equal(ramanResult.requirementMethod, "raman-article-122");
  assert.equal(ramanResult.requiredVirupas, raman[planet],
    `Raman Article 122 ${planet} minimum must match the printed Rupa table`);
  assert.equal(ramanResult.requiredRupas, raman[planet] / 60);
  assert.equal(ramanResult.totalVirupas, defaultResult.totalVirupas,
    "Changing the threshold lineage must not change any component score or available subtotal");
  assert.equal(ramanResult.totalRupas, defaultResult.totalRupas);
  assert.equal(ramanResult.isComplete, false,
    "Changing the minimum must not make a partial Shadbala complete");
  assert.equal(ramanResult.isStrong, false,
    "A source-specific minimum cannot override missing component validation");
  assert.equal(ramanResult.rank, 0);
}

// Sun is the intentional difference between the two primary-source methods.
const sunInput: ShadbalaChartInput = {
  ascendant: 0,
  birthTimeKnown: false,
  planets: { Sun: { longitude: 125 } },
};
assert.equal(engine.calculateShadbala("Sun", sunInput).requiredVirupas, 390);
assert.equal(engine.calculateShadbala("Sun", {
  ...sunInput,
  shadbalaRequirementMethod: "raman-article-122",
}).requiredVirupas, 300);

assert.throws(
  () => engine.calculateShadbala("Sun", {
    ...sunInput,
    shadbalaRequirementMethod: "unknown" as "bphs-27-32-33",
  }),
  /Unknown Shadbala requirement method/,
  "Unknown threshold lineage must be rejected instead of falling back to another table"
);

console.log(
  "Shadbala requirement-source suite passed: BPHS 27.32–33 and Raman Article 122 thresholds for all seven planets, unchanged scores, and fail-closed unknown profiles."
);

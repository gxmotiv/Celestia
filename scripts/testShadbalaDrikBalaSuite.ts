import assert from "node:assert/strict";
import {
  ShadbalaEngine,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

const engine = new ShadbalaEngine();

const names = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
type PlanetName = typeof names[number];

function chart(overrides: Partial<Record<PlanetName, number>> = {}): ShadbalaChartInput {
  const planets: ShadbalaChartInput["planets"] = {};
  names.forEach((name) => {
    planets[name] = { longitude: overrides[name] ?? 0 };
  });
  return { ascendant: 0, planets };
}

function aspect(result: ReturnType<typeof engine.calculateDrikBala>, name: string) {
  const found = result.aspects.find((item) => item.aspectingPlanet === name);
  assert.ok(found, `Expected aspect from ${name}`);
  return found;
}

// 1. BPHS 26.6-8 directed angle: target minus aspector, not absolute distance.
// Saturn is at 0°, Mars at 100°. The aspected-minus-aspecting angle is 260°,
// whose generic curve is 20v. Using abs(100°) would incorrectly use Mars's
// 4th-sign special formula and give a very different number.
{
  const input = chart({ Saturn: 0, Mars: 100 });
  input.drishtiVirupaVariant = "bphs-base-longitude-curve";
  input.drikFullAspectReading = "quarter-only";
  const result = engine.calculateDrikBala("Saturn", input);
  assert.equal(result.available, true);
  const mars = aspect(result, "Mars");
  assert.equal(mars.angle, 260);
  assert.equal(mars.rawVirupas, 20);
  assert.equal(mars.quarterVirupas, -5);
  assert.equal(mars.virupas, -5);
  assert.equal(result.drishtiPinda, -20);
  assert.equal(result.points, -5);
}

// 2. BPHS 26.11 per-sign special formula is separate from the generic curve.
{
  const input = chart({ Saturn: 0, Mars: 255 });
  input.drikFullAspectReading = "quarter-only";
  const result = engine.calculateDrikBala("Saturn", input);
  const mars = aspect(result, "Mars");
  assert.equal(mars.angle, 105);
  assert.equal(mars.rawVirupas, 45, "Mars c=3 uses 60 minus degrees past the third sign");
  assert.equal(mars.quarterVirupas, -11.25);
}

// 3. BPHS 27.19 Mercury/Jupiter reading is explicit and independently testable.
{
  const input = chart({ Saturn: 0, Jupiter: 180 });
  const added = engine.calculateDrikBala("Saturn", {
    ...input,
    drikFullAspectReading: "added-to-quarter",
  });
  const replaced = engine.calculateDrikBala("Saturn", {
    ...input,
    drikFullAspectReading: "in-place-of-quarter",
  });
  const raman = engine.calculateDrikBala("Saturn", {
    ...input,
    drikFullAspectReading: "quarter-only",
  });

  assert.equal(aspect(added, "Jupiter").rawVirupas, 60);
  assert.equal(aspect(added, "Jupiter").quarterVirupas, 15);
  assert.equal(aspect(added, "Jupiter").fullAspectVirupas, 60);
  assert.equal(aspect(added, "Jupiter").virupas, 75);
  assert.equal(added.points, 75, "Literal add-after-quarter reading is 1.25 times Jupiter's full aspect");

  assert.equal(aspect(replaced, "Jupiter").quarterVirupas, 0);
  assert.equal(aspect(replaced, "Jupiter").fullAspectVirupas, 60);
  assert.equal(replaced.points, 60);

  assert.equal(aspect(raman, "Jupiter").quarterVirupas, 15);
  assert.equal(aspect(raman, "Jupiter").fullAspectVirupas, 0);
  assert.equal(raman.points, 15);
}

// 4. Malefic aspect contributes negatively; benefic/malefic Pinda totals stay
// separately visible and the returned Shadbala term is one quarter by default.
{
  const input = chart({ Saturn: 0, Sun: 180 });
  const result = engine.calculateDrikBala("Saturn", input);
  assert.equal(aspect(result, "Sun").nature, "Malefic");
  assert.equal(aspect(result, "Sun").rawVirupas, 60);
  assert.equal(aspect(result, "Sun").virupas, -15);
  assert.equal(result.beneficDrishtiPinda, 0);
  assert.equal(result.maleficDrishtiPinda, 60);
  assert.equal(result.drishtiPinda, -60);
  assert.equal(result.points, -15);
}

// 5. Moon nature follows the selected BPHS waxing/waning convention from
// directed Sun-Moon elongation. Full Moon (180°) is waxing; waning Moon is
// malefic, including elongation greater than 180°.
{
  const waxing = engine.calculateDrikBala("Saturn", chart({
    Saturn: 0, Sun: 0, Moon: 180,
  }));
  assert.equal(aspect(waxing, "Moon").nature, "Benefic");
  assert.equal(aspect(waxing, "Moon").virupas, 15);

  const waning = engine.calculateDrikBala("Saturn", chart({
    Saturn: 0, Sun: 200, Moon: 180,
  }));
  assert.equal(aspect(waning, "Moon").nature, "Malefic");
  assert.equal(aspect(waning, "Moon").virupas, -15);
}

// 6. Mercury's malefic status is not hard-coded: same-sign association is the
// default, and an explicitly supplied degree orb is a separate method option.
{
  const input = chart({ Saturn: 209, Mercury: 29, Mars: 31, Sun: 120 });
  const sameSign = engine.calculateDrikBala("Saturn", input);
  const mercurySameSign = aspect(sameSign, "Mercury");
  assert.equal(mercurySameSign.nature, "Benefic");

  const degreeOrb = engine.calculateDrikBala("Saturn", {
    ...input,
    drikMercuryAssociationRule: "degree-orb",
    drikMercuryAssociationOrbDeg: 2,
  });
  const mercuryDegreeOrb = aspect(degreeOrb, "Mercury");
  assert.equal(mercuryDegreeOrb.nature, "Malefic", "Two-degree association is included at the chosen orb boundary");
  assert.equal(mercuryDegreeOrb.virupas, -15);
  assert.throws(
    () => engine.calculateDrikBala("Saturn", {
      ...input,
      drikMercuryAssociationRule: "degree-orb",
      drikMercuryAssociationOrbDeg: 31,
    }),
    /orb from 0° through 30°/
  );
}

// 7. Rahu/Ketu are not Shadbala grahas or Drik aspectors; they can only count
// as malefic Mercury companions when the chart supplies their positions.
{
  const input = chart({ Saturn: 180, Mercury: 0 });
  input.planets.Rahu = { longitude: 1 };
  input.planets.Ketu = { longitude: 181 };
  input.drikFullAspectReading = "quarter-only";
  const result = engine.calculateDrikBala("Saturn", input);
  assert.ok(!result.aspects.some((item) => item.aspectingPlanet === "Rahu" || item.aspectingPlanet === "Ketu"));
}

// 8. Missing/invalid inputs fail closed instead of turning absent grahas into
// zero-strength aspects.
{
  const incomplete = chart({ Saturn: 0, Jupiter: 180 });
  delete incomplete.planets.Venus;
  const result = engine.calculateDrikBala("Saturn", incomplete);
  assert.equal(result.available, false);
  assert.deepEqual(result.missingPlanetInputs, ["Venus"]);
  assert.equal(result.points, 0);
  assert.match(result.description, /no partial aspect total is substituted/);

  assert.throws(
    () => engine.calculateDrikBala("Saturn", chart({ Saturn: 360 })),
    /normalized \[0°, 360°\) longitude/
  );
  assert.throws(
    () => engine.calculateDrikBala("Rahu", chart()),
    /only for the seven classical planets/
  );
}

console.log(
  "Shadbala Drik Bala suite passed: directed angular curve, BPHS special formula, 27.19 readings, signed Pinda, Moon nature, Mercury association, nodal exclusion and fail-closed inputs."
);

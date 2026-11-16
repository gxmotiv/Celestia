import assert from "node:assert/strict";
import {
  calculatePakshaBala,
  calculatePakshaPoolVirupas,
  isPakshaMoonBenefic,
  ShadbalaEngine,
  type ShadbalaChartInput,
} from "../lib/vedic/shadbalaEngine";

const close = (actual: number, expected: number, label: string, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected}, received ${actual}`);
};

const engine = new ShadbalaEngine();

const standardPositions: ShadbalaChartInput["planets"] = {
  Sun: { longitude: 179 + 8 / 60 },       // Raman Standard Horoscope: Virgo 29°08′
  Moon: { longitude: 311 + 40 / 60 },     // Aquarius 11°40′
  Mars: { longitude: 229 + 30 / 60 },
  Mercury: { longitude: 180 + 33 / 60 },  // Libra 00°33′, no same-sign malefic
  Jupiter: { longitude: 84 + 0 / 60 },
  Venus: { longitude: 171 + 9 / 60 },
  Saturn: { longitude: 124 + 22 / 60 },
};

const standard: ShadbalaChartInput = {
  ascendant: 298 + 27 / 60,
  planets: standardPositions,
};

// 1. BPHS 27.10 pool and complement, including exact New/Full Moon boundaries.
{
  const newMoon = calculatePakshaPoolVirupas(120, 120);
  assert.equal(newMoon.elongationDegrees, 0);
  assert.equal(newMoon.foldedArcDegrees, 0);
  assert.equal(newMoon.beneficShareVirupas, 0);
  assert.equal(newMoon.maleficShareVirupas, 60);

  const fullMoon = calculatePakshaPoolVirupas(0, 180);
  assert.equal(fullMoon.elongationDegrees, 180);
  assert.equal(fullMoon.foldedArcDegrees, 180);
  assert.equal(fullMoon.beneficShareVirupas, 60);
  assert.equal(fullMoon.maleficShareVirupas, 0);

  const waningMirror = calculatePakshaPoolVirupas(0, 200);
  assert.equal(waningMirror.elongationDegrees, 200);
  assert.equal(waningMirror.foldedArcDegrees, 160);
  close(waningMirror.beneficShareVirupas, 160 / 3, "Waning folded benefic share");
  close(waningMirror.maleficShareVirupas, 20 / 3, "Waning malefic share");
  assert.throws(() => calculatePakshaPoolVirupas(360, 0), /normalized/);
  assert.throws(() => calculatePakshaPoolVirupas(0, Number.NaN), /normalized/);
}

// 2. BPHS Ch.3 v.11 nature: waxing Moon benefic, waning Moon malefic;
// exact New Moon is placed on the waning side, exact Full Moon on waxing.
assert.equal(isPakshaMoonBenefic(0, "bphs-waxing-waning"), false);
assert.equal(isPakshaMoonBenefic(0.0001, "bphs-waxing-waning"), true);
assert.equal(isPakshaMoonBenefic(179.9999, "bphs-waxing-waning"), true);
assert.equal(isPakshaMoonBenefic(180, "bphs-waxing-waning"), true);
assert.equal(isPakshaMoonBenefic(180.0001, "bphs-waxing-waning"), false);
assert.equal(isPakshaMoonBenefic(359.9999, "bphs-waxing-waning"), false);

// 3. Raman Ch. V, Art. 53 wider Ashtami window. The two textual readings of
// Krishna Ashtami's inclusion remain separate and explicit.
assert.equal(isPakshaMoonBenefic(83.999, "raman-ashtami-window-through-krishna-ashtami"), false);
assert.equal(isPakshaMoonBenefic(84, "raman-ashtami-window-through-krishna-ashtami"), true);
assert.equal(isPakshaMoonBenefic(275.999, "raman-ashtami-window-through-krishna-ashtami"), true);
assert.equal(isPakshaMoonBenefic(276, "raman-ashtami-window-through-krishna-ashtami"), false);
assert.equal(isPakshaMoonBenefic(263.999, "raman-ashtami-window-through-krishna-saptami"), true);
assert.equal(isPakshaMoonBenefic(264, "raman-ashtami-window-through-krishna-saptami"), false);
assert.equal(isPakshaMoonBenefic(276, "raman-ashtami-window-through-krishna-saptami"), false);
assert.throws(() => isPakshaMoonBenefic(360, "bphs-waxing-waning"), /normalized/);

// 4. Raman Example 18: elongation 132°32′, Shubha pool 44.1778,
// Papa complement 15.8222, doubled Moon 88.3556 (Raman prints truncated
// 44.17 / 15.83 / 88.34).
{
  const resultMercury = calculatePakshaBala("Mercury", standard);
  const resultSun = calculatePakshaBala("Sun", standard);
  const resultMoonBphs = calculatePakshaBala("Moon", standard);
  const resultMoonRaman = calculatePakshaBala("Moon", {
    ...standard,
    pakshaMoonAccountingRule: "raman-double-in-kala",
  });

  assert.equal(resultMercury.points, 44.18, "Raman Example 18 Mercury Shubha rounded to two decimals");
  assert.equal(resultSun.points, 15.82, "Raman Example 18 Sun Papa rounded to two decimals");
  assert.equal(resultMoonBphs.points, 44.18, "BPHS Moon Kala component remains undoubled and rounded");
  assert.equal(resultMoonRaman.points, 88.36, "Raman Example 18 doubles Moon Paksha within Kala and rounds to two decimals");
  assert.equal(resultMoonBphs.details?.moonNature, "Benefic");
  assert.equal(resultMoonRaman.details?.moonAccountingRule, "raman-double-in-kala");
  assert.equal(resultSun.nature, "Malefic");
  assert.equal(resultMercury.nature, "Benefic", "Mercury is not co-sign with a malefic in the worked example fixture");
}

// 5. Mercury's temporary nature is selectable and does not assume an
// undocumented universal conjunction orb.
{
  const sameSign = calculatePakshaBala("Mercury", {
    ...standard,
    planets: {
      ...standardPositions,
      Sun: { longitude: 179.5 },
      Mercury: { longitude: 179.8 },
    },
  });
  assert.equal(sameSign.nature, "Malefic");
  close(sameSign.points, sameSign.details!.maleficShareVirupas, "Same-sign afflicted Mercury");

  const justOutsideSign = calculatePakshaBala("Mercury", {
    ...standard,
    planets: {
      ...standardPositions,
      Sun: { longitude: 179.5 },
      Mercury: { longitude: 180.5 },
    },
  });
  assert.equal(justOutsideSign.nature, "Benefic", "Same-sign rule does not silently become a degree orb");

  const explicitOrb = calculatePakshaBala("Mercury", {
    ...standard,
    planets: {
      ...standardPositions,
      Sun: { longitude: 179.5 },
      Mercury: { longitude: 180.5 },
    },
    pakshaMercuryAssociationRule: "degree-orb",
    pakshaMercuryAssociationOrbDeg: 1.1,
  });
  assert.equal(explicitOrb.nature, "Malefic");
  assert.throws(() => calculatePakshaBala("Mercury", {
    ...standard,
    pakshaMercuryAssociationRule: "degree-orb",
    pakshaMercuryAssociationOrbDeg: 31,
  }), /orb from 0° through 30°/);
}

// 6. Nodes may condition Mercury's company but do not receive Paksha Bala.
{
  const input: ShadbalaChartInput = {
    ...standard,
    planets: {
      ...standardPositions,
      Mercury: { longitude: 10 },
      Rahu: { longitude: 15 },
      Ketu: { longitude: 195 },
    },
  };
  const mercury = calculatePakshaBala("Mercury", input);
  assert.equal(mercury.nature, "Malefic");
  assert.throws(() => calculatePakshaBala("Rahu", input), /seven classical planets/);
}

// 7. BPHS 27.18 accounting: Kala receives the ordinary Moon Paksha amount,
// Cheshta receives the same amount; Raman's worked profile doubles it in
// Kala and contributes no separate Moon Cheshta entry.
{
  const bphsInput: ShadbalaChartInput = {
    ...standard,
    birthTimeKnown: true,
    localApparentTimeMinutes: 720,
    pakshaMoonAccountingRule: "bphs-kala-plus-cheshta",
  };
  const bphsKala = engine.calculateKalaBala("Moon", bphsInput);
  const bphsCheshta = engine.calculateCheshtaBala("Moon", bphsInput);
  assert.equal(bphsKala.components.pakshaBala, bphsCheshta.points);
  assert.equal(bphsCheshta.available, true);
  assert.match(bphsCheshta.description, /BPHS 27.18/);

  const ramanInput: ShadbalaChartInput = {
    ...bphsInput,
    pakshaMoonAccountingRule: "raman-double-in-kala",
  };
  const ramanKala = engine.calculateKalaBala("Moon", ramanInput);
  const ramanCheshta = engine.calculateCheshtaBala("Moon", ramanInput);
  close(ramanKala.components.pakshaBala!, 2 * bphsKala.components.pakshaBala!, "Raman in-Kala doubling");
  assert.equal(ramanCheshta.points, 0);
  assert.match(ramanCheshta.description, /no separate Moon Cheshta row/);
}

// 8. No fabricated zero-longitude fallbacks. The missing pair is visible as
// unavailable in Kala and Cheshta rather than becoming a plausible number.
{
  const incomplete: ShadbalaChartInput = {
    ascendant: 0,
    planets: { Moon: { longitude: 50 }, Venus: { longitude: 20 } },
  };
  const paksha = calculatePakshaBala("Venus", incomplete);
  assert.equal(paksha.available, false);
  assert.equal(paksha.points, 0);
  assert.equal(paksha.nature, null, "Missing longitudes do not fabricate a malefic classification");
  assert.match(paksha.description, /valid Sun and Moon longitudes are required/);

  const kala = engine.calculateKalaBala("Venus", incomplete);
  assert.equal(kala.components.pakshaBala, null);
  assert.ok(kala.unavailableComponents.includes("Paksha Bala (requires valid Sun and Moon longitudes)"));
  assert.match(kala.description, /Paksha is unavailable/);

  const unknownTime = calculatePakshaBala("Moon", {
    ...standard,
    birthTimeKnown: false,
  });
  assert.equal(unknownTime.available, false,
    "A valid-looking noon placeholder must not be used when the actual birth time is unknown");
  assert.equal(unknownTime.nature, null);
  assert.match(unknownTime.description, /birth time is explicitly unknown/);
  const unknownKala = engine.calculateKalaBala("Moon", {
    ...standard,
    birthTimeKnown: false,
  });
  assert.equal(unknownKala.components.pakshaBala, null);
  assert.ok(unknownKala.unavailableComponents.includes("Paksha Bala (requires valid Sun and Moon longitudes)"));
}

console.log(
  "Shadbala Paksha Bala suite passed: BPHS pool, both Moon nature lineages, Mercury association, Raman Example 18, Moon double-count protection and missing-input handling."
);

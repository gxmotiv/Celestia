import assert from "node:assert/strict";
import {
  getSolarMonthPosition,
  SolarTermCalculator,
} from "../lib/astronomy/baziEngine";

/**
 * BaZi uses the twelve Jie (節) as month boundaries, not all 24 solar terms.
 * The alternating Qi (氣) terms are mid-month markers and must not advance
 * the Month Branch.
 *
 * Independent calendar references:
 * - Hong Kong Observatory 2024 Solar Terms: HKT is UTC+8 and the Sun's
 *   longitude defines the 24 term instants:
 *   https://www.hko.gov.hk/en/gts/astron2024/files/2024SolarTerms24.pdf
 * - 2024 Jie/Qi classification and second-level HKT instants:
 *   https://almanark.com/jieqi/2024/
 *
 * The actual ephemeris is tested two hours either side of term instants so
 * minute-level differences between published almanacs cannot affect a case.
 */

const jieBoundaries = [
  [315, 2],  // Lichun -> Yin / Tiger
  [345, 3],  // Jingzhe -> Mao / Rabbit
  [15, 4],   // Qingming -> Chen / Dragon
  [45, 5],   // Lixia -> Si / Snake
  [75, 6],   // Mangzhong -> Wu / Horse
  [105, 7],  // Xiaoshu -> Wei / Goat
  [135, 8],  // Liqiu -> Shen / Monkey
  [165, 9],  // Bailu -> You / Rooster
  [195, 10], // Hanlu -> Xu / Dog
  [225, 11], // Lidong -> Hai / Pig
  [255, 0],  // Daxue -> Zi / Rat
  [285, 1],  // Xiaohan -> Chou / Ox
] as const;

for (const [longitude, expectedBranch] of jieBoundaries) {
  const actual = getSolarMonthPosition(longitude);
  assert.equal(
    actual.branchIndex,
    expectedBranch,
    `Jie at ${longitude}° must begin month branch ${expectedBranch}`
  );
}

const qiMidpoints = [
  [330, 2], // Yushui stays in Tiger month
  [0, 3],   // Chunfen stays in Rabbit month
  [30, 4],  // Guyu stays in Dragon month
  [60, 5],  // Xiaoman stays in Snake month
  [90, 6],  // Xiazhi stays in Horse month
  [120, 7], // Dashu stays in Goat month
  [150, 8], // Chushu stays in Monkey month
  [180, 9], // Qiufen stays in Rooster month
  [210, 10],// Shuangjiang stays in Dog month
  [240, 11],// Xiaoxue stays in Pig month
  [270, 0], // Dongzhi stays in Rat month
  [300, 1], // Dahan stays in Ox month
] as const;

for (const [longitude, expectedBranch] of qiMidpoints) {
  const actual = getSolarMonthPosition(longitude);
  assert.equal(
    actual.branchIndex,
    expectedBranch,
    `Qi at ${longitude}° must remain in month branch ${expectedBranch}`
  );
}

const calculator = new SolarTermCalculator();
function monthAt(utcIso: string) {
  const instant = new Date(utcIso);
  const year = calculator.calculateYearPillar(instant);
  const month = calculator.calculateMonthPillar(instant, year.heavenlyStem.index);
  return { year, month };
}

// Lichun 2024: 16:27:07 HKT = 08:27:07 UTC.
// The Year Pillar and Month Pillar change at this exact solar-longitude crossing.
const beforeLichun = monthAt("2024-02-04T06:27:07.000Z");
const afterLichun = monthAt("2024-02-04T10:27:07.000Z");
assert.equal(beforeLichun.year.heavenlyStem.index, 9, "Before Lichun, year stem remains Gui (2023)");
assert.equal(beforeLichun.year.earthlyBranch.index, 3, "Before Lichun, year branch remains Mao (2023)");
assert.equal(beforeLichun.month.heavenlyStem.index, 1, "Before Lichun, previous Chou month stem is Yi");
assert.equal(beforeLichun.month.earthlyBranch.index, 1, "Before Lichun, previous month branch is Chou");
assert.equal(afterLichun.year.heavenlyStem.index, 0, "After Lichun, year stem is Jia (2024)");
assert.equal(afterLichun.year.earthlyBranch.index, 4, "After Lichun, year branch is Chen (2024)");
assert.equal(afterLichun.month.heavenlyStem.index, 2, "After Lichun, Tiger month stem is Bing");
assert.equal(afterLichun.month.earthlyBranch.index, 2, "After Lichun, month branch is Yin / Tiger");

// Yushui (330°) is Qi, not Jie: it must not start a second Tiger-month segment.
for (const utcIso of ["2024-02-19T02:13:12.000Z", "2024-02-19T06:13:12.000Z"]) {
  const { month } = monthAt(utcIso);
  assert.equal(month.heavenlyStem.index, 2, `Yushui must not change the month stem at ${utcIso}`);
  assert.equal(month.earthlyBranch.index, 2, `Yushui must not change the Tiger month at ${utcIso}`);
}

// Jingzhe (345°) is Jie: it starts the Rabbit month, with the stem advanced too.
const beforeJingzhe = monthAt("2024-03-05T00:22:45.000Z");
const afterJingzhe = monthAt("2024-03-05T04:22:45.000Z");
assert.equal(beforeJingzhe.month.heavenlyStem.index, 2);
assert.equal(beforeJingzhe.month.earthlyBranch.index, 2);
assert.equal(afterJingzhe.month.heavenlyStem.index, 3);
assert.equal(afterJingzhe.month.earthlyBranch.index, 3);

// Chunfen (0°) is Qi: the Rabbit month continues until Qingming (15°).
for (const utcIso of ["2024-03-20T01:06:25.000Z", "2024-03-20T05:06:25.000Z"]) {
  const { month } = monthAt(utcIso);
  assert.equal(month.heavenlyStem.index, 3, `Chunfen must not change the month stem at ${utcIso}`);
  assert.equal(month.earthlyBranch.index, 3, `Chunfen must not change the Rabbit month at ${utcIso}`);
}

// Qingming (15°) is Jie: it starts the Dragon month.
const beforeQingming = monthAt("2024-04-04T05:02:17.000Z");
const afterQingming = monthAt("2024-04-04T09:02:17.000Z");
assert.equal(beforeQingming.month.heavenlyStem.index, 3);
assert.equal(beforeQingming.month.earthlyBranch.index, 3);
assert.equal(afterQingming.month.heavenlyStem.index, 4);
assert.equal(afterQingming.month.earthlyBranch.index, 4);

console.log(
  "BaZi Jie/Qi boundary suite passed: all 12 Jie, all 12 Qi, and independent 2024 Lichun/Yushui/Jingzhe/Chunfen/Qingming instants."
);

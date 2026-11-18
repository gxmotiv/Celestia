/**
 * Independent 2026 solar-term reference fixtures.
 *
 * Source: National Astronomical Observatory of Japan (NAOJ), Reiwa 8 (2026)
 * Reki Yoko, "Solar Terms":
 * https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou262.html.en
 *
 * NAOJ publishes minute-resolution Japan Central Standard Time (UTC+09:00).
 * The UTC instants below are converted from those published local times.
 * These are the 12 Jie boundaries used to begin BaZi solar months, selected
 * from the 24-term table by longitude: 285°, 315°, 345°, 15° ... 255°.
 *
 * Classification cross-check: Hong Kong Observatory, "The 24 Solar Terms":
 * https://www.hko.gov.hk/en/gts/time/24solarterms.htm
 * HKO describes the alternating 12 major/12 minor terms and their 15° spacing.
 * Its major/minor naming is not the same as BaZi's use of Jie/Zhongqi; fixture
 * selection here follows the conventional month-starting Jie longitude set.
 *
 * Precision: source time rounded/published to the minute. These fixtures are
 * suitable for independent ephemeris cross-checks, not sub-second claims.
 */
export interface SolarTermReferenceFixture {
  name: string;
  chinese: string;
  longitude: number;
  /** ISO UTC instant converted from NAOJ's UTC+09:00 published minute. */
  utc: string;
  sourceLocal: string;
}

export const NAOJ_2026_BAZI_JIE_FIXTURES: readonly SolarTermReferenceFixture[] = [
  { name: "Xiaohan", chinese: "小寒", longitude: 285, sourceLocal: "2026-01-05T17:23:00+09:00", utc: "2026-01-05T08:23:00.000Z" },
  { name: "Lichun", chinese: "立春", longitude: 315, sourceLocal: "2026-02-04T05:02:00+09:00", utc: "2026-02-03T20:02:00.000Z" },
  { name: "Jingzhe", chinese: "驚蟄", longitude: 345, sourceLocal: "2026-03-05T22:59:00+09:00", utc: "2026-03-05T13:59:00.000Z" },
  { name: "Qingming", chinese: "清明", longitude: 15, sourceLocal: "2026-04-05T03:40:00+09:00", utc: "2026-04-04T18:40:00.000Z" },
  { name: "Lixia", chinese: "立夏", longitude: 45, sourceLocal: "2026-05-05T20:49:00+09:00", utc: "2026-05-05T11:49:00.000Z" },
  { name: "Mangzhong", chinese: "芒種", longitude: 75, sourceLocal: "2026-06-06T00:48:00+09:00", utc: "2026-06-05T15:48:00.000Z" },
  { name: "Xiaoshu", chinese: "小暑", longitude: 105, sourceLocal: "2026-07-07T10:57:00+09:00", utc: "2026-07-07T01:57:00.000Z" },
  { name: "Liqiu", chinese: "立秋", longitude: 135, sourceLocal: "2026-08-07T20:43:00+09:00", utc: "2026-08-07T11:43:00.000Z" },
  { name: "Bailu", chinese: "白露", longitude: 165, sourceLocal: "2026-09-07T23:41:00+09:00", utc: "2026-09-07T14:41:00.000Z" },
  { name: "Hanlu", chinese: "寒露", longitude: 195, sourceLocal: "2026-10-08T15:29:00+09:00", utc: "2026-10-08T06:29:00.000Z" },
  { name: "Lidong", chinese: "立冬", longitude: 225, sourceLocal: "2026-11-07T18:52:00+09:00", utc: "2026-11-07T09:52:00.000Z" },
  { name: "Daxue", chinese: "大雪", longitude: 255, sourceLocal: "2026-12-07T11:53:00+09:00", utc: "2026-12-07T02:53:00.000Z" },
] as const;

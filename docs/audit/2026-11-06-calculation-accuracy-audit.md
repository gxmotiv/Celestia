# Celestia calculation-accuracy audit — 2026-11-06

## Decision

Celestia is **not yet independently accuracy-certified**. Its internal tests are useful regression checks, but they do not prove that every chart value matches an authoritative astronomical reference. This audit fixes two input/model consistency defects and removes unsupported engine/precision claims. It is a focused correction, not a complete validation of all astrology systems.

## Scope inspected

The review traced the planetary calculation facade, Western chart assembly, transit and BaZi callers, birth-time parsing in the main page, test suites, benchmark panel, and printable/PDF disclosures.

## Confirmed implementation facts

- `lib/astronomy/swissEphemeris.ts` imports `astronomy-engine` and calls its `GeoVector` and `Ecliptic` functions. The class name is a historical compatibility name. Celestia does **not** call native Swiss Ephemeris/libswe through this path.
- Astronomy Engine's own documentation describes its design goal as angular accuracy within about **±1 arcminute** and says its models are based on VSOP87 and NOVAS C 3.1. That is an upstream model design target, not an independent accuracy certificate for Celestia, every epoch, custom lunar-node formula, house calculation, asteroid routine, or ayanamsa. See: https://github.com/cosinekitty/astronomy
- The app rounds some output values to 0.0001 degrees. This is display/API formatting precision, not a claim that the physical position is accurate to 0.0001 degrees.
- Swiss Ephemeris documentation distinguishes planet calculations with ET/TT input (`swe_calc`) from UT input (`swe_calc_ut`). Its house APIs take UT Julian Day and geographic latitude/longitude. Celestia's current compatibility facade contains custom house calculations; it does not call those native APIs. References: https://www.astro.com/ftp/swisseph/doc/swisseph.pdf and https://www.astro.com/ftp/swisseph/doc/swephprg.pdf
- IERS documentation distinguishes UTC, TT, and UT1: TT is the argument for IAU 2000A precession/nutation, while Earth rotation calculations depend on UT1. These time-scale choices must be explicit in any independent benchmark. See: https://www.iers.org/iers/en/service/faqs/thenewiauresolutions/timeargumentforusingiersproducts-104-157

## Fixes in this branch

### 1. Rahu/Ketu model consistency

**Defect found:** the old shared `calculateAllPlanets` result paired a mean ascending node as Rahu with a true ascending node as Ketu. These are not opposite points from one selected node model, so a consumer of that API could receive a non-antipodal nodal pair.

**Change:** `calculateAllPlanets(jd, isSidereal, nodeType)` now defaults to the prior mean-node convention, accepts an explicit `"mean"` or `"true"` selector, calculates one ascending node, and derives Ketu as exactly 180 degrees opposite that same selected node. The Western chart now uses the returned Ketu field rather than rebuilding it separately.

**Test:** `scripts/testLunarNodeConsistencySuite.ts` checks mean and true node-pair construction at three instants in tropical and sidereal modes, plus longitude/sign/degree/speed consistency and rejection of an unsupported node selector.

**Limit:** this test proves the internal 180-degree relationship. It does **not** prove that the underlying mean-node or approximate true-node longitude matches a high-precision external ephemeris. That remains an independent benchmark task.

### 2. Invalid and unknown birth times

**Defect found:** the legacy clock parser returned 12:00 for invalid/missing input without reporting that it had substituted a value. A caller's `try/catch` therefore could not detect a bad saved time.

**Change:** the parser now returns `usedFallback`. A known birth time that is invalid or missing is rejected in the main form/profile path. When the user explicitly marks the time as unknown, the app deliberately uses 12:00 as a placeholder and keeps the existing warning that time-dependent outputs are uncertain.

**Test:** `scripts/testTimeInputSuite.ts` checks valid times, midnight, invalid/missing values, and the fallback flag.

**Limit:** 12:00 is a calculation placeholder, not the person's birth time and not necessarily true solar noon. Ascendant, houses, house-based placements, planetary hours, and some BaZi time results must not be treated as verified for an unknown birth time.

### 3. Shared Lahiri-style ayanamsa model

**Defect found:** Western sidereal calculations and Vedic chart conversion used different local polynomials. The Western compatibility facade used a negative quadratic term, while the Vedic module used a positive quadratic term. These could yield different sidereal longitudes from the same tropical input.

**Change:** both paths now call one shared approximation in `SwissEphemerisEngine.getAyanamsa`. Its J2000 zero point is 23°51′25.53″, advanced using the IAE 1989 precession polynomial relative to J2000: 5029.0966″·T + 1.11161″·T² − 0.000113″·T³, where T is Julian centuries from J2000. This fixes the sign inconsistency and centralises the model.

**Limit:** this is a Lahiri-style polynomial approximation, not a call to Swiss Ephemeris `SE_SIDM_LAHIRI`; it does not implement a full nutation/model-convention solution. It must not be described as exact Lahiri or validated against every historical/future epoch. The new test proves Western/Vedic code uses the same formula, not that the formula is astronomically exact. The cited IAE polynomial is a precession model; the adopted Lahiri zero point and convention remain an explicit app choice.

### 4. User-facing accuracy disclosure

Removed unsupported Swiss Ephemeris, JPL DE405, and 0.001-degree accuracy claims from the reviewed calculation labels and report surfaces. Internal benchmark output is now labelled as internal checks rather than independent astronomical certification. Asteroid calculations are explicitly described as approximate.

## Remaining high-priority work (not certified by this patch)

| Priority | Area | Why it remains open | Acceptance evidence required |
|---|---|---|---|
| P0 | Planetary positions | No reproducible Celestia comparison corpus yet. One stored Sun/Moon date is only a spot check. | Store full reference query parameters: target, center, time scale, coordinate frame, apparent/astrometric choice, ephemeris, UTC instant and tolerance. Compare Sun, Moon and planets across multiple centuries and dates. |
| P0 | Time scales | Need to prove the exact UT/TT/Delta-T handling from input through the ephemeris and all derived calculations. | Explicit time-scale contract and reference cases around dates with known Delta-T behavior; test UTC conversion, leap-second-era and pre-1972 limitations separately. |
| P0 | Houses / angles | Current house calculations are custom formulas with a polynomial obliquity approximation; high-latitude handling needs proof. | Compare ASC, MC and all cusps against native Swiss Ephemeris or another documented independent implementation for all house systems, wrap boundaries and high latitudes. Record the system actually used if a fallback is required. |
| P0 | Ayanamsa and sidereal positions | The current Lahiri-style value is a local polynomial approximation, not a native Swiss Ephemeris call. Its epoch-wide error and selected Lahiri convention are not certified. | Compare against published Lahiri/Chitrapaksha references and Swiss Ephemeris for named epochs; record the selected convention and time-scale assumptions. |
| P1 | True lunar node | The app's true-node implementation uses local periodic correction terms and a fixed approximate speed. | Compare true and mean node longitude and speed with an authoritative ephemeris at a sampled date set. |
| P1 | Asteroids | Ceres/Pallas/Juno/Vesta use simplified fixed J2000-era orbital elements. | Compare against an authoritative small-body ephemeris over the supported date range and label the supported range/error. |
| P1 | Solar-term instants | A numerical root solver can converge accurately to the model's longitude crossing while the underlying solar model/time scale still has error. | Compare all 24 annual solar-term instants against independent USNO/JPL/IMCCE references for multiple years and boundary cases. |
| P1 | Historical civil time | IANA explicitly warns that its pre-1970 data is incomplete and not authoritative for all past local times. Different local clocks and legal practices may disagree. | Use primary local legal/railway/observatory/civil-time records when historical birth times matter; label unsupported or uncertain cases instead of implying certainty. See: https://www.iana.org/time-zones/theory |
| P1 | Planetary hours and dependent outputs | Must verify the use of local sunrise/sunset, longitude, timezone and the single resolved UTC instant across every path. | Independent sunrise/sunset and day/night boundary cases; test different latitudes and zones. |
| P1 | Vedic divisional charts and dashas | Internal arithmetic tests do not prove a selected tradition, boundary rule or year-length convention is universally authoritative. | Cite the chosen classical rule/source per calculation and test canonical worked examples and exact boundary cases. |
| P2 | KP, relationship charts, PDF and AI | KP scores, Davison/synastry transformations, printed metadata and AI narratives need separate correctness and traceability audits. | Calculation-to-output parity tests, documented conventions, privacy/runtime tests, and AI isolation from deterministic calculation values. |

## Sources used for this review

1. Astronomy Engine project documentation: https://github.com/cosinekitty/astronomy
2. Swiss Ephemeris documentation and programming API: https://www.astro.com/ftp/swisseph/doc/swisseph.pdf and https://www.astro.com/ftp/swisseph/doc/swephprg.pdf
3. IERS time-scale guidance: https://www.iers.org/iers/en/service/faqs/thenewiauresolutions/timeargumentforusingiersproducts-104-157
4. IANA time-zone database theory and historical limitations: https://www.iana.org/time-zones/theory

## Merge/deployment policy

This patch is isolated on `fix/astronomy-node-consistency`. It must be reviewed and CI-tested before any merge. It has not changed `main` or triggered a live Cloudflare deployment. Passing CI will establish code/test consistency for the covered cases only; it will not certify all astronomical or astrological calculations.

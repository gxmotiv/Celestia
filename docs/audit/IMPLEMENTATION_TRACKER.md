# Celestia master implementation tracker

Last reviewed: 2026-11-13  
Source of scope: `docs/audit/2026-10-31-master-audit-spec.md` and the current GitHub source tree.  
Policy: keep changes on isolated branches; do not merge or deploy until the owner reviews the PR chain. Passing internal tests is not proof of astronomical correctness.

## Status vocabulary

- **Implemented / CI-passed**: code exists on the current implementation branch and the recorded GitHub Actions run passed.
- **Partial**: some code or tests exist, but integration, benchmarks, or user-facing disclosure remain.
- **Audit required**: source has not yet been fully traced or independently validated.
- **Known defect**: confirmed behavior that can produce an incorrect or misleading result.
- **Not started**: no implementation is claimed.

## Workstream 1 — Time and calculation integrity

| Item | Current status | Evidence / next acceptance gate |
|---|---|---|
| Historical local-time resolver | Partial | Resolver distinguishes resolved, ambiguous, nonexistent, unsupported. Runtime IANA/ICU output is not independent historical proof. IANA warns that pre-1970 coverage is incomplete and not authoritative everywhere. Verify short-lived offset regimes, sampling performance, and primary civil-time sources. |
| Built-in city IANA identifiers | Implemented on branch | All 133 built-in city records now carry explicit IANA IDs; CI validates IDs in the runner runtime. Verify every city-to-zone assignment against authoritative timezone geography, especially border/multi-zone regions. |
| Geoapify timezone identity | Implemented on branch | Preserve provider IANA zone and remove longitude/15 offset guessing. Test provider failure, missing zone, reverse geocode, and offline-only mode. |
| Primary birth-form timezone state | Partial | Automatic IANA and explicit manual-lock modes; ambiguous-time selection and unsupported/nonexistent warnings. Browser-level form testing remains. |
| Partner birth-form timezone state | Partial | Partner IANA resolution, ambiguous selection, manual confirmation, shared UTC instant for partner Western/Vedic calculations. Need full browser and Davison integration tests. |
| Shared UTC birth instant | Partial | Main Western/Vedic/BaZi paths now use one resolved UTC instant. Audit every other chart, PDF, transit and relationship path for independent reconstruction. |
| Historical timezone verification | Audit required | IANA database values need comparison with authoritative local civil-time records; do not label them historically verified merely because Intl resolved them. |
| BaZi clock conversion | Partial | Meeus EOT and civil/LMST/LAST helpers, explicit Pure Zi and Early/Late Zi policy. Independently benchmark formula and decide/display school convention. |
| Solar-term crossings | Partial | 24 apparent geocentric tropical longitude crossings solved numerically. Numerical root bracket is not ephemeris accuracy. Compare dates/times with independent USNO/JPL/IMCCE references. |
| BaZi year/month pillars | Partial | Existing longitude interval branch correction plus new crossing solver. The live year/month engine still needs to consume validated crossing instants and exact boundary tests. |
| BaZi day-pillar epoch anchor | Audit required | Existing anchor is preserved; verify cycle epoch and calendrical convention from primary/authoritative references. |
| Early/Late Zi hour/day semantics | Partial | Explicit option and unit tests exist. Verify traditional source convention and ensure all BaZi views/transits use the same policy. |
| Invalid/missing birth-time handling | Implemented on audit branch; CI pending | Parser reports `usedFallback`; known times with invalid/missing values are rejected. An explicitly unknown time uses 12:00 only as a warned placeholder. Browser-level testing and all saved-profile paths still need review. |

## Workstream 2 — Astronomical engine and chart correctness

| Item | Current status | Evidence / next acceptance gate |
|---|---|---|
| Actual ephemeris identity | Corrected disclosure on audit branch | The compatibility facade calls `astronomy-engine`, not native Swiss Ephemeris/libswe. Reviewed chart, transit, benchmark and PDF labels now disclose this. Upstream documents an approximately ±1 arcminute design target; this is not a Celestia-wide accuracy certificate. |
| Independent planetary benchmarks | 60 JPL observer + 18 INPOP19 apparent + 18 matched astrometric J2000 vector pairs captured; interpretation remains REVIEW | JPL Horizons quantity 31 covers ten bodies × six epochs (60 observations); Miriade INPOP19 apparent-of-date covers Saturn/Uranus/Neptune × six (18); matched astrometric J2000 captures add 18 Miriade/JPL LT vector pairs. All raw provider responses are SHA-256 archived and reverified. Apparent-of-date INPOP–JPL latitude residuals reach 9.55″ and fit a date-dependent common rotation with ≤0.21″ max remainder (diagnostic frame convention issue). In the matched fixed J2000 ecliptic, INPOP19–JPL DE441 angular separation is ≤0.2552″, while Astronomy Engine GeoVector (light-time, no stellar aberration) differs from both by 2.8–19.5″ in this sample. These residuals are within Astronomy Engine upstream's stated ±1 arcminute design target; this is finite model precision, not a demonstrated code defect. No arbitrary per-body correction or pass thresholds are added. The 2035 sample remains a stress case because JPL labels it UT~ beyond known leap-second/EOP prediction support. |
| Julian Day and UTC conversions | Partial / audit required | Existing suite covers selected UTC/JD and date rollover cases. Validate leap dates, seconds, pre-1972 civil-time assumptions, historical offsets with seconds, and explicit UTC/UT1/TT/Delta-T handling. |
| Almuten Figuris scoring and interpretation labels | Disclosure correction on PR #28 branch; CI pending | The pre-natal syzygy event calculation is corrected on PR #27. A separate audit found that the visible “Lord of Soul” and “Lord of Temperament” labels were only aliases for rank 1 and rank 2, not independent technical calculations. PR #28 changes the UI to show rank/runner-up, labels the 12-to-1 house and +7/+6 day/hour additions as Celestia-specific weights, and exposes the full hybrid method note. The dignity/point scheme still needs source-by-source validation before being attributed as exact Ibn Ezra/Lilly doctrine. |
| Almuten Figuris prenatal syzygy | Corrected on PR #27 branch; CI pending | Previous implementation approximated the pre-natal syzygy Sun longitude with a fixed 0.08 phase-angle multiplier. It now searches the actual prior apparent geocentric Moon–Sun 0°/180° phase crossing over a 35-day window and bisects the event time. Exact event Julian Day/UTC and elapsed days are exposed. Regression fixtures cover both New and Full Moon, selection before/after a lunation boundary, and NASA Sky Calendar event-time references for 8 April 2024 18:21 UTC and 25 March 2024 07:00 UTC with a 0.02-day tolerance. Accuracy remains bounded by Astronomy Engine; no native Swiss Ephemeris accuracy is claimed. |
| Tropical/sidereal and ayanamsa | Shared model implemented on audit branch; independent validation pending | Western and Vedic paths now call one J2000-anchored Lahiri-style precession polynomial; the prior opposite-sign quadratic discrepancy is removed. This is not native Swiss Ephemeris `SE_SIDM_LAHIRI`. Regression tests verify path consistency, not absolute accuracy. Benchmark named epochs against authoritative Lahiri tables / Swiss Ephemeris with explicit time-scale and nutation conventions. |
| Houses and high latitudes | Partial / fallback metadata and ordinary-latitude fixtures present | Placidus, Equal, Whole Sign and Porphyry are implemented through Celestia formulas over Astronomy Engine sidereal time/obliquity. `calculateWesternChart` reports the actual system used and documents the conservative ≥66.5622° polar Porphyry policy and numerical Placidus fallback. Independent Swiss Ephemeris fixtures cover one ordinary-latitude chart; dedicated high-latitude cusp comparisons and broad solver-boundary fixtures remain required. |
| Advanced Western 90° midpoint chart integration | Corrected on PR #24 branch; CI pending | The Advanced Western midpoint UI now calls `calculateNatalMidpoints`, which supplies all natal planets plus Ascendant and Midheaven. Regression tests exercise the same chart-level entry point. The method remains a selected Cosmobiology/Uranian-style midpoint implementation, not a complete Hamburg Uranian system. |
| Natal major-aspect phase with missing speed | Corrected on PR #29 branch; CI pending | The main five-aspect calculator previously used `speed ?? 0`, which silently treated an unknown instantaneous velocity as a stationary point and could fabricate applying/separating status. It now reports phase unavailable if either speed is missing/non-finite, while retaining a genuine numeric zero as a valid stationary speed. Tests cover both missing-speed and stationary-vs-moving cases. |
| Natal Western aspect taxonomy and display | Corrected on PR #25; minor aspect phase correction on PR #26 branch | Main natal aspect calculation emits only the five Ptolemaic aspects; Semisextile and Quincunx are in the minor engine, and all major rows are accessible. Minor applying/separating phase now derives from the instantaneous relative angular speed without guessed averages or a long finite projection; stationary relative motion and unavailable speed display as unavailable. Regression tests cover stationary, missing-speed, equal-speed and near-exact cases. School-specific orbs still need comparative traditional-source review. |
| Lunar node pair consistency | Implemented on audit branch; CI pending | `calculateAllPlanets` now defaults to a mean-node pair and supports explicit mean/true selection; Ketu is 180° opposite the same selected Rahu. Regression tests cover tropical/sidereal and several dates. Independent longitude/speed accuracy for mean and true node models remains unverified. |
| D1–D60 divisional charts | Audit required | Inspect each implemented formula, sign assignment, boundary rule, tradition, and independent examples. Do not infer correctness from D9-only tests. |
| Vimshottari and other dashas | Partial / audit required | Existing antardasha suite passes. Verify balance at birth, year-length convention, rounding, pratyantardasha and remaining systems. |

## Workstream 3 — KP and interpretive output

| Item | Current status | Evidence / next acceptance gate |
|---|---|---|
| KP sub-lord calculations | Audit required | Verify star/sub division sequence, cusp/planet sub-lords, ayanamsa and boundary behavior. |
| KP percentages | Known concern | Trace actual formulas and classify every score as deterministic, heuristic, empirical or display-only. Do not label unvalidated scores as probability. |
| Interpretations | Audit required | Trace each text/score to calculated inputs and clearly separate traditional interpretation from factual calculation. |

## Workstream 4 — Relationships and other chart systems

| Item | Current status | Evidence / next acceptance gate |
|---|---|---|
| Synastry | Partial / chart-order scoring corrected; partner-time readiness gate added on follow-on branch | Sun–Venus, Sun–Mars and Sun–Jupiter score contributions now use order-independent planet-pair matching, with reversal regression fixtures. Relationship reports are withheld until Person 2 has a resolved automatic UTC instant or a valid, explicitly confirmed manual offset; local date/time and offset readiness tests added. Continue auditing aspect orbs/weights and interpretation labels. House overlays currently select Sun, Moon, Venus, Mars, Jupiter and Saturn only; confirm whether omitting Mercury and outer planets is intended before expanding. Independent aspect and overlay fixtures remain open. |
| Composite chart | Partial / antipodal longitude tie-break corrected on follow-on branch | Circular midpoint now uses normalized endpoints and a deterministic, chart-order-independent convention for exactly antipodal longitudes; non-finite longitudes are rejected. Regression coverage added for antipodal Sun/Ascendant, 0° wraparound and chart reversal. Composite equal-house assignments remain an explicit approximation; independent fixtures are still needed for midpoint conventions, full chart coverage and house methodology. |
| Davison chart | Partial / UTC integration and LMT offset formatting corrected on follow-on branch | Engine accepts exact resolver-supplied UTC instants and the relationship screen passes them when available; legacy fixed-offset conversion remains for older callers. Strict local date/time and coordinate validation added. LMT offset labels now round total minutes before splitting hours/minutes, avoiding invalid values such as UTC+05:60; a regression fixture covers the carry boundary. Independent fixtures for temporal/geographic midpoint, longitude wrap, antipodal handling and historical timezone seconds are still required. |
| Numerology | Audit required | Verify name normalization, master-number rules, date conventions, and explain interpretive/non-empirical status. |
| PDFs | Audit required | Compare every printed value with on-screen calculations; verify privacy, locale, fonts and missing-data behavior. |

## Workstream 5 — Privacy, API and reliability

| Item | Current status | Evidence / next acceptance gate |
|---|---|---|
| Saved profiles | Known concern / audit required | Prior source stores profile JSON in localStorage. Trace fields, migrations, exports, deletion, browser logs and connected providers. Do not delete existing user data. |
| Encryption/privacy | Not started | Define realistic threat model before adding optional WebCrypto encryption. Explain that same-origin XSS and an unlocked device can still access decrypted data. Provide recovery/export path. |
| Geocoding API | Partial | No fabricated longitude-based timezone fallback; IANA identity preserved. Audit validation, API-key handling, provider timeout, rate limits and no-key offline behavior. |
| AI route | Audit required | Verify actual endpoint and secret requirements, error handling, timeouts and provider status. Keep AI interpretation separate from deterministic chart calculations. |
| PDF API | Audit required | Verify validation, response errors, privacy and parity with live calculations. |
| Runtime HTTP 200/404 discrepancy | Known concern / audit required | Reproduce route by route and distinguish hosting rewrite, Next.js route, API status and browser UI behavior. |
| Mobile/browser UI | Not yet verified | Test real browser interactions at phone viewport, form errors, loading, state synchronization, accessibility and offline behavior. |

## Workstream 6 — AI and prediction research

| Item | Current status | Evidence / next acceptance gate |
|---|---|---|
| AI interpretation | Audit required | Mark operational vs unavailable routes; AI must not replace ephemeris values. |
| Prediction research platform | Not started | Separate from the consumer chart app. Define pre-registered questions, fixed outcome criteria, blind evaluation, leakage prevention, baselines, failures, sample-size limits and reproducible logs. No predictive-validity claims without evidence. |

## Workstream 7 — Runtime, deployment and repository hygiene

| Item | Current status | Evidence / next acceptance gate |
|---|---|---|
| TypeScript archived snapshots exclusion | Implemented on PR #3 | Archive remains; inspect every excluded path to ensure no active module was excluded. |
| Duplicate/unused modules | Audit required | Identify duplicates before cleanup; do not delete historical files during audit. |
| Production build | Partial / CI-gated | Earlier commits passed; rerun on the latest audit branch after all integration changes. |
| Browser deployment | Not started | Choose GitHub Pages only if the app can be exported without server routes. Otherwise use a zero-cost GitHub-triggered deployment target with server/API support. Never expose API secrets in static client bundles. |
| Public link | Not created | Publish only after full calculation, privacy and UI acceptance gates; provide the exact verified deployment URL. |

## Current PR chain

1. PR #1 — prior Phase 1C audit evidence; open draft; do not overwrite.
2. PR #2 — BaZi solar-month branch fix; open draft.
3. PR #3 — historical timezone resolver, midnight parser and CI; open draft.
4. PR #4 — EOT/LMST/LAST, Zi policies and solar-term solver; open draft, stacked on PR #3.
5. PR #5 — IANA city/geocoding and birth-form timezone integration; open draft, stacked on PR #4.

Do not merge the chain automatically. Review each diff and rerun the full workflow on the final head before merge/deployment.

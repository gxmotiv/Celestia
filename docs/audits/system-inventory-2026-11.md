# Celestia system inventory — 2026-11

> Audit baseline: repository `main` at `abc96ea00f7ab4bd762b4d50ab3c181a3c078908`.
> This is a source inventory, not a certification of calculation accuracy. A file or class existing does not prove that it is correct, complete, tested, or connected to the active UI.

## 1. Active application surface

The active `app/page.tsx` imports and invokes these calculation entry points:
- `calculateWesternChart` from `lib/astronomy/ephemeris.ts`
- `calculateVedicChart` from `lib/astronomy/vedic.ts`
- `calculateNumerologyProfile` from `lib/astronomy/numerology.ts`
- `calculateBaZiProfile` from `lib/astronomy/chinese.ts`

The main navigation in `app/page.tsx` exposes:
- Western Natal Wheel → `components/WesternChart.tsx`
- Relationship & Compatibility → `components/RelationshipAstrologyView.tsx`
- Vedic Kundli & Shastras → `components/VedicChart.tsx`
- KP System & Sub-Lords → `components/KPSystemPanel.tsx`
- Transits & Bi-Wheel → `components/TransitView.tsx`
- Universal Numerology → `components/NumerologyView.tsx`
- Chinese BaZi → `components/ChineseView.tsx`
- Verification Center → `components/MultiSystemVerificationPanel.tsx`
- AI Cosmic Synthesis → `components/AIReadingView.tsx`

The navigation badge text is descriptive UI copy, not evidence of coverage or correctness. For example, a badge saying “108 Tests” must be reconciled against actual test inventory and current CI output before it is treated as a test count.

## 2. Calculation engines found

### Western
File: `lib/astronomy/ephemeris.ts`
- Exports Julian day, GMST, obliquity, Sun, Moon, planetary geocentric longitude, lunar node, houses, house lookup, aspects and `calculateWesternChart`.
- Declared house systems: Placidus, Equal and Whole Sign (with Auto preference).
- Current source inventory does not establish that every modern or traditional technique listed in the product roadmap exists. Searches for `SolarReturn` and `secondaryProgression` did not find matching exported engines on the audited default branch.
- Next checks: compare planetary positions against independent ephemeris fixtures; test house cusps at high latitudes and DST/history; verify aspect orbs, applying/separating state, speed and station logic.

### Vedic
File: `lib/astronomy/vedic.ts`
- Exports Lahiri ayanamsa, Navamsa, Vimshottari dasha, yoga detection and `calculateVedicChart`.
- Supporting engines found: `lib/vedic/shadbalaEngine.ts`, `lib/vedic/ashtakavargaEngine.ts`, `lib/vedic/jaiminiKarakas.ts`, plus Drishti and relationship engines.
- UI component found: `components/VedicChart.tsx`; separate Ashtakavarga and benchmark panels also exist.
- Existence of these modules does not establish that all outputs are wired into the main chart or that the implemented rule variants match a specified textual lineage.
- Next checks: trace actual input types and call sites; audit each varga mapping, dasha balance, Shadbala component and Ashtakavarga bindu total against independently transcribed fixtures.

### KP
File: `components/KPSystemPanel.tsx`
- Main app navigation connects this component to Western and Vedic chart data.
- A dedicated UI component exists; the present inventory has not yet verified the complete computational path for cusp sub-lords, star/sub/sub-sub divisions, significators and event timing.
- Next checks: trace the exact 249-sub division implementation and validate every boundary and house-significator rule against an independently specified KP method.

### BaZi
Files: `lib/astronomy/chinese.ts`, `lib/astronomy/baziEngine.ts`, `components/ChineseView.tsx`
- Active page imports legacy `calculateBaZiProfile`; a separate `CompleteBaZiEngine` exists in `baziEngine.ts`.
- A separate BaZi test suite exists at `scripts/testBaZiSuite.ts`.
- The active path and advanced engine must not be assumed equivalent. Track which path produces each visible output.
- Follow-up accuracy work is tracked in Issue #64: multi-year solar-term fixtures, boundary tests and historical timezone/DST handling.

### Numerology
File: `lib/astronomy/numerology.ts`
- Exports reduction helpers and calculations for Life Path, Expression, Soul Urge, Personality, Personal Year, Karmic Lessons and a profile builder.
- The active navigation badge says “6 Systems”; the actual formulas and system labels need a method-by-method audit before adding more numerology methods.
- Next checks: name normalization/transliteration, alphabet mapping, Y handling, master-number retention, compound-number rules, and birthday/pinnacle/challenge formula fixtures.

### Relationships
File: `components/RelationshipAstrologyView.tsx`
- Active UI exists.
- Supporting Vedic relationship modules found include `lib/vedic/jaiminiRelationshipEngine.ts` and `lib/vedic/masterKundliMilan.ts`.
- Next checks: distinguish synastry, composite and Davison calculations; trace whether relationship birth-time uncertainty is propagated; validate Ashtakoota rule variants and exclusions.

### Transits
Files: `components/TransitView.tsx`, `lib/astronomy/MultiSystemTransitEngine.ts`
- UI and multi-system transit engine exist; the latter imports Vedic and BaZi chart types/engines.
- Next checks: event-time precision, station/ingress detection, historical time zones, transit-to-natal orb policy and repeatability across dates.

### Verification and AI
Files: `components/MultiSystemVerificationPanel.tsx`, `lib/astronomy/multiSystemBenchmarkTests.ts`, `components/AIReadingView.tsx`
- A multi-system benchmark/test harness exists and is imported by the verification panel.
- Keep deterministic calculations separate from AI-generated explanations. AI output must not silently modify calculation results or turn heuristic scores into probabilities.

## 3. Test files located

Search located:
- `scripts/testAstrologySuite.ts`
- `scripts/testBaZiSuite.ts`
- `scripts/testNavamsaSuite.ts`
- `scripts/testVedicTimezoneSuite.ts`
- `lib/astronomy/multiSystemBenchmarkTests.ts`
- `lib/vedic/vedicBenchmarkTests.ts`

This list is a search-based inventory, not a complete coverage report. Next step is to inspect package scripts and workflow YAML, run the relevant suites in CI, map every assertion to a feature, and identify missing independent golden fixtures.

## 4. Prioritized engineering queue

| Priority | Work | Required evidence |
|---|---|---|
| P0 | Shared birth instant, IANA timezone/DST, coordinates, Julian day and clock policy | Known timestamp fixtures, DST transitions, boundary tests |
| P0 | BaZi active-path parity and solar-term boundaries | Multi-year independent solar-term fixtures; Issue #64 |
| P1 | Western ephemeris and house accuracy | Independent planetary and house fixtures, high-latitude cases |
| P1 | Vedic core, ayanamsa, varga and dasha correctness | Named method specification and golden fixtures |
| P1 | KP division and significator correctness | 249-sub boundary fixtures and traceable rule tests |
| P1 | Numerology formula audit | Explicit method specs and name/date edge-case fixtures |
| P2 | Relationship model separation and uncertainty | Distinct synastry/composite/Davison fixtures |
| P2 | Transit event precision and time windows | Independent station/ingress fixtures |
| P2 | Advanced feature exposure in UI | Only expose a feature after engine, method, tests and limitations are verified |
| P3 | Research prediction evaluation | Timestamped forecasts, baselines, out-of-sample evaluation and calibration |

## 5. Required per-feature completion record

Every feature PR must state:
1. Active code path and UI location.
2. Named calculation tradition/method and rule variant.
3. Inputs, units, coordinate/time basis and defaults.
4. Independent reference source and fixture precision.
5. Unit, boundary, regression and property tests added/updated.
6. Known limitations and unverified cases.
7. CI run and exact test results.
8. Whether it changes user-visible results or stored profile data.


## 6. High-priority accuracy and test-runner findings

### Ephemeris naming and precision claims need correction
- `lib/astronomy/swissEphemeris.ts` imports `astronomy-engine` directly and constructs a compatibility-shaped `SwissEphemerisEngine` wrapper. It is not a native Swiss Ephemeris binding.
- The same file's module header and method comments claim “0.001° accuracy” / “EXACT” positions, and `lib/astronomy/ephemeris.ts` repeats a “High-precision Swiss Ephemeris calculation (0.001° accuracy)” comment.
- Rounding a result to 0.0001° or 0.001° is output resolution, not evidence of that physical accuracy. These claims must be removed or replaced with a documented, measured error budget after independent comparison. Do not change the algorithm merely to make the comments sound stronger.
- The planetary path uses `Astronomy.GeoVector` and `Astronomy.Ecliptic`; lunar nodes use separate polynomial/periodic approximations. These paths need separate validation, especially true-node accuracy, speed estimation, historical dates and apparent/geometric coordinate conventions.

### Test execution discoverability
- The audited `package.json` defines `dev`, `build`, `start`, `lint` and `clean`, but no `test` script.
- Test suites exist as standalone TypeScript scripts. A reproducible, documented test command/runner is needed so CI and contributors can execute each suite consistently.
- Some test scripts include named historical-chart expectations. Those are only valid golden fixtures if their source, time convention, coordinate frame and precision are documented independently; self-authored expected values are not independent validation.

## 7. Non-negotiable quality gates
- Do not infer accuracy from a successful TypeScript build.
- Do not call the astronomy-engine-backed facade native Swiss Ephemeris.
- Do not silently substitute noon for an unknown birth time without marking time-dependent outputs provisional.
- Do not mix tropical and sidereal coordinates or incompatible astrological traditions without explicit conversion and labels.
- Do not advertise test counts, precision, “confidence”, or prediction accuracy without reproducible evidence.
- No paid services, paid APIs, paid assets, or production deployment as part of this audit.

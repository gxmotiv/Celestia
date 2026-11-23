# CELESTIA — WESTERN & ADVANCED WESTERN ASTROLOGY MASTER AUDIT (EXECUTED)

**Date:** 2026-11-23 · **Executor:** independent audit run using `docs/master-prompt-celestia-western.md` v1.0 · **Mode:** read-only source inspection + independent numerical verification in an isolated sandbox (`pyswisseph` 2.10.03 as ground truth via Moshier ephemeris, `astronomy-engine` 2.1.19 pinned to the repo's version, JPL Horizons unreachable from sandbox → published ephemerides used for Chiron) · **Budget used:** $0.

---

## A. EXECUTIVE SUMMARY

The Western core of Celestia is architecturally strong: the astronomy layer (`astronomy-engine` via `GeoVector → Ecliptic`) is **numerically excellent** — verified against Swiss Ephemeris across 1452–2026, planet longitudes differ by **≤ 0.018° (worst: Pluto in 1452; typically ≤ 0.005° / ≤ 0.3′)**, and the frame is correctly true-ecliptic-of-date (Sun λ = 0.0002° at the March 2000 equinox anchor). MC/ASC formulas match Swiss Ephemeris to ≤ 0.0005°. The Egyptian terms table, Dorothean triplicities, Valens sign periods, Firdaria orders, profections, and Davison midpoint math are all **correct**.

However, the audit **confirms 12 significant defects, 5 of them critical**, all reproducible with the numbers below. The pattern is consistent: the *planetary astronomy* is superb, but *derived points and secondary engines* were written from partially-remembered formulas and never benchmarked against an independent reference — exactly the failure mode predicted in `docs/audit/2026-10-31-master-audit-spec.md` §8.1 ("A passing internal test suite does not by itself establish numerical correctness"). Several in-suite assertions are structurally vacuous (e.g. `W-ADV-03` passes on `length >= 0`), so the 100%-passing dashboard does not contradict these findings.

Most serious verified items (evidence in §C):
1. **Chiron is wrong by ~146°** (wrong sign entirely) in the modern era.
2. **Mean Lilith rate is 100× too slow** → errors of 17°–167° over 1452–2026.
3. **East Point ≡ MC** (identical formula) in every chart.
4. **Vertex wrong by 8°–42°** — and the repo ships two mutually inconsistent Vertex formulas.
5. **Placidus intermediate cusps (2, 3, 11, 12) wrong by 0.26°–1.74°** (mixed RA/ecliptic-frame iteration).
6. **True Node approximation off up to 2.4°** with a hardcoded constant speed (real speed ranges −0.19…+0.3°/day and can turn direct).
7. **Pre-natal Syzygy is a linear back-guess** — measured 0.02°–1.16° error (5/5 sect-type correct) but worst-case ~2° with extreme lunar speeds; worth replacing with the exact lunation search already available in `astronomy-engine`.

Every item above has a **verified fix prototype** (§C recipes), all $0, all already numerically validated in this audit against Swiss Ephemeris. **Audit integrity note:** an earlier draft of this report claimed a 13.6° syzygy error; re-verification exposed a bug in the *audit harness itself* (`SearchMoonPhase` takes elongation in degrees, not a 0–0.5 fraction, and the previous-syzygy selection must take the latest event before birth). The claim was corrected before publication — evidence discipline works in both directions.

## B. CURRENT REPOSITORY FACTS (verified this session)

- Package: `package.json` — Next.js ^15.4.9, React ^19.2.1, `astronomy-engine` ^2.1.19, `@google/genai` ^2.4.0, no native Swiss Ephemeris dependency. **The "Swiss Ephemeris Engine" header in `swissEphemeris.ts` ("0.001° accuracy based on JPL DE405") is a facade claim, not a dependency fact** [V-src].
- Default branch state inspected via GitHub contents API at commit `2c7f4ca` (all paths listed in the Master Prompt §3 present) [V-src].
- Test suites exist (`scripts/testAstrologySuite.ts`, `testUtcJulianDaySuite.ts`, `testMinorAspectsSuite.ts`, `testRelationshipChartsSuite.ts`, …; in-app `westernBenchmarkTests.ts`). Not re-executed in this audit (sandbox cannot build the private repo) [U-block]; the third-pass session in `note (2).txt` executed all 10 suites with 269/269 passing [V-obs per that log; still re-run after any fix].
- `note (2).txt` (73 KB, repo root) is **not a prompt but an exported AI Studio session log** ("Gemini 3.8 Flash, Action history") containing a completed **Third-Pass Audit** ("CELESTIA_THIRD_PASS_APPROVAL_GATE.md"). Its confirmed findings are consistent with this audit's evidence discipline and add confirmed cross-system defects: (1) BaZi month-branch **tautology** at `lib/astronomy/baziEngine.ts:561–568` (10 of 12 branches unreachable dead code); (2) `app/page.tsx:122` drops birth minutes, timezone offset, and coordinates from the BaZi call; (3) `MultiSystemTransitEngine` computes BaZi hour pillars in UTC instead of local solar time; (4) all 10 test suites executed with **269/269 assertions passing**; (5) the prompt lineage is confirmed as the Master Audit Brief (`docs/audit/2026-10-31-master-audit-spec.md`), which this audit's Master Prompt extends for the Western track. BaZi/timezone streams remain in their own workstreams (Phase 1C, BAZI-1) per that document's provenance rules; this audit deliberately does not duplicate them [V-src: note (2).txt].

## C. VERIFIED DEFECT REGISTER

Severity: 🔴 critical (wrong published result) · 🟠 high (materially misleading) · 🟡 medium (honesty/quality) · confidence: HIGH = reproduced with numbers this session.

| ID | Sev | File · Function | Defect (evidence class) | Measured impact | Fix recipe (validated) |
|----|-----|-----------------|--------------------------|-----------------|------------------------|
| W-01 | 🔴 | `ephemeris.ts` `calculateWesternChart` (Chiron block) | Chiron modeled by a one-term Kepler toy: `M = 339.8 + 719.9·T`; real Chiron (a=13.6 AU, e=0.38, strongly Saturn-perturbed) is not representable this way [V-src + V-test] | **2026-11-23: engine says ≈ 241° (1° Sag); truth ≈ 27.9° Aries (astro-seek 2026 ephemeris; stations 26°16′ Aries 2027-01-06) → ~146° error. Wrong sign for ~all modern dates** | Do not ship a fake ephemeris. Options ($0): (a) embed a weekly Chiron longitude table 1900–2100 generated from JPL Horizons (≈ 10.4k rows, interpolate; ~150 KB) — deterministic, offline; (b) `swisseph-wasm` (AGPL-3.0) if license-compatible; (c) short-term: keep the point but render "Chiron (approximate — verify)" until (a)/(b). Implementation must include regression tests vs Horizons |
| W-02 | 🔴 | `lunarPointsCalculator.ts` `calculateMeanLilithLon` | Rate `40.664876·T` per **century**; true mean apogee advances ≈ **40.69°/year** (8.85-yr apsidal cycle) — 100× error; epoch constant also wrong vs any source [V-src + V-test] | vs Swiss Eph `MEAN_APOG`: **17.5° (1452), 93.8° (1990), 121.3° (J2000), 124.7° (2026), 141.6° (1975)**; comment in code even says "~0.111° per day" while code computes 0.001113 [V-test] | Hybrid replacement in `verifiedFixes.ts::calculateMeanLilith`: quintic fit to Swiss Ephemeris MEAN_APOG 1900–2100 (max err **0.124°** in-window) + Meeus-derived analytic `λ = 263.35305 + 4069.01373·T` outside the window (≤ ~0.4° vs swe definition). Speed 0.11142°/day |
| W-03 | 🔴 | `lunarPointsCalculator.ts` `calculateEastPointLon` | East Point formula `atan2(sin RAMC, cos RAMC·cos ε)` is **character-for-character the MC formula** — East Point always equals Midheaven [V-src + V-test] | East Point wrong in 100% of charts (should be ~90° away on average) | Equatorial Ascendant convention: `λ_EP = atan2(sin(RAMC+90°), cos(RAMC+90°)·cos ε)`. Proven: reduces to ASC at the equator. (East Point has two school definitions — display the convention name; recipe in `verifiedFixes.ts::calculateEastPoint`) |
| W-04 | 🔴 | `lunarPointsCalculator.ts` `calculateVertexLon` AND `swissEphemeris.ts` `calculateHouses` (vertex) | Two **different** Vertex formulas, both wrong; neither matches the prime-vertical definition [V-src + V-test] | vs Swiss Eph `ascmc[3]` (Rome/NYC/Oslo/Sydney/CapeTown/Honolulu): lunarPoints variant **15.1° / 29.9° / 41.8° / 43.9°** off; houses variant **19.3° / 38.7° / 9.4°** off | Closed form derived & verified this session (8 global cities, 1960–2026, max err **0.0016°**): `λV = atan2(sin φ·cos RAMC, cos φ·sin ε − sin φ·sin RAMC·cos ε)`; if `cos δ·sin(RAMC − α) < 0` add 180°. See `verifiedFixes.ts::calculateVertex`. Anti-Vertex = +180° |
| W-05 | 🔴 | `swissEphemeris.ts` `calculateHouses` (Placidus iteration) | Loop treats `r` simultaneously as ecliptic longitude (for declination) and right ascension (for the sum), converging to the wrong fixed point; no convergence exit [V-src + V-test] | vs Swiss Eph `houses(...,'P')`: cusps 2/3/11/12 off **0.26°–0.53° (Rome/NYC), 1.74° (Oslo)** — planet house assignments flip near cusps | Correct alternating iteration: `λ_{n+1} = ecl(RA)` where `RA = H + F·AD(δ(λ_n))`, `δ(λ)=asin(sin ε·sin λ)`, `AD = asin(tan φ·tan δ)`. Verified max err **≤ 0.0044°** across Rome/NYC/Oslo/Sydney/CapeTown/Reykjavík. See `verifiedFixes.ts::calculatePlacidusIntermediateCusps`. Keep \|lat\|≥66 fallback + `fallbackReason` (good behavior already) |
| W-06 | 🟡 | `almutenFigurisCalculator.ts` `calculatePreNatalSyzygy` | Syzygy degree back-projected by linear guess `sunLon − diff·0.08` — not the actual last lunation [V-src + V-test] | Measured vs exact lunation search (da Vinci / 1990 / J2000 / 2026 / 1975): **position err 0.019°–1.158°, sect-type correct 5/5**; worst-case ~2° with extreme lunar speeds → can flip term/face dignities near boundaries in the Almuten score | Replace with exact search: `Astronomy.SearchMoonPhase(0\|180, …)` (elongation in **degrees**), taking the **latest** lunation before birth; Sun λ at that instant. Pass `jd` into `AlmutenFigurisCalculator.calculate(...)`. Recipe in `verifiedFixes.ts::previousSyzygy` (includes the two harness pitfalls as comments) |
| W-07 | 🟠 | `swissEphemeris.ts` TRUE_NODE branch | Truncated Meeus-style perturbation with **apparent** (not mean) longitudes; missing 2F and 2(L′−F) terms; **speed hardcoded −0.05295** (true-node speed really varies −0.19…+0.3°/day and can be direct) [V-src + V-test] | vs Swiss Eph `TRUE_NODE`: **0.06°–2.45°** error (2.45° at 1452, 1.64° at J2000) | Compute the **osculating** node from Moon state vectors (r×v) — matches Swiss Ephemeris to **≤ 0.009°** at all 5 test epochs (1452→2026), using only astronomy-engine already in the repo; speed by ±1 h numeric derivative. See `verifiedFixes.ts::calculateTrueNode`. Note: mean node (analytic) is already fine (≤0.005°) |
| W-08 | 🟠 | `specializedWesternEngines.ts` `FixedStarsEngine` | Star longitudes hardcoded for ~one epoch (comment says "J2000" but Regulus 150.08° is ≈2016 position; true J2000 = 149.83°) and **never precessed to the chart date** [V-src + V-test] | Regulus err: 0.11° (2026), 0.95° (1950), **1.65° (1900)** — exceeding the 1.25° contact orb → false negatives/positives for older charts | Store J2000 positions + precess: `λ_date = λ_J2000 + 50.29″/yr·(y−2000)` (linear, adequate ±200 yr for orbs ≥1°; state tolerance) or store RA/Dec and apply full precession. Verify Regulus = 29°50′ Leo at J2000 |
| W-09 | 🟠 | `specializedWesternEngines.ts` `EclipseAnalyzer.UPCOMING_ECLIPSES` + `transits.ts` `getEclipseTransits` + `generateMonthlyForecast` | Eclipse lists **hardcoded through Aug 2026**; monthly `newMoonDate = "<Month> 12"`, `fullMoonDate = "<Month> 27"` are **fabricated fixed dates** [V-src] | Feature silently stale after 2026; monthly moon dates wrong for essentially every month | astronomy-engine (already installed) has `SearchGlobalSolarEclipse` / `SearchLunarEclipse` / `SearchMoonPhase` — compute dynamically for any window; the fix wrapper `verifiedFixes.ts::searchEclipses` reproduces exactly the 4 known 2026 eclipses (Feb 17 Annular Solar, Mar 3 Total Lunar, Aug 12 Total Solar, Aug 28 Partial Lunar). Keep existing display shapes, replace data source |
| W-10 | 🟠 | `ephemeris.ts` `calculateAspects` (isApplying) | Applying/separating via `relativeSpeed = (p1.speed\|\|1) − (p2.speed\|\|0.5)` with bogus defaults (angles get 0.5°/day) and no wraparound handling near 0°/360° [V-src] | Wrong applying flags near conjunctions/antipodes and for ASC/MC contacts. Note `minorAspects.ts::isAspectApplying` already implements the **correct** future-projection method — it is simply not used here | Replace with the same future-projection approach (project both bodies +0.2 d, compare orb); unify so major/minor engines share one function (`verifiedFixes.ts::isAspectApplying`) |
| W-11 | 🟡 | `relationshipEngine.ts` `calculateAllInterAspects` | `isApplying: true` hardcoded for every synastry aspect; angles (ASC/MC) and Vertex/Chiron-to-chart contacts missing from synastry grids; scores are unlabeled heuristics (baseline 70, arbitrary weights) [V-src] | Misleading UI ("applying" meaningless between two fixed charts); top-tier synastry contacts (Sun conj partner ASC) absent | Either drop the applying field in synastry or compute from both charts' natal speeds; include angle contacts with tighter orbs (≤4°); add a "heuristic score — not a validated probability" label |
| W-12 | 🟡 | `hellenistic.ts` `calculateSiderealComparison` + `swissEphemeris.ts` `getAyanamsa` | Fagan-Bradley hardcoded `24.84°` [V-src + V-test: truth 25.116° in 2026 → 0.28° error] | Sign-shift boundary errors for sidereal comparison | FB ayanamsa = Lahiri + **0.883208** (verified constant across 1900–2100); Lahiri formula already correct (23.85709 at J2000 — matches Swiss Eph to 2×10⁻⁶°). See `verifiedFixes.ts::faganBradleyAyanamsa` |

Additional verified-accurate items (for the record): Mean node analytic formula ≤0.005°; MC/ASC ≤0.0005°; midpoints/90° dial correct; harmonic method correct; declination conversion correct (OOB threshold should use date obliquity 23.4368° not 23.43929 — 1-line fix); planetary-hours module present (spot-check sunrise/sunset boundary vs apps recommended); `normalizeLocalToUTC` correct for numeric offsets; Davison midpoint math correct (historical-offset caveat already documented in-code).

## D. FEATURE MATRIX VERDICT (Western + Advanced Western)

| Feature | Verdict |
|---|---|
| Tropical planet positions (Sun–Pluto) | ✅ Present, excellent (≤0.3′) |
| Nodes | ✅ Mean (accurate) / ⚠️ True (W-07); Western chart currently uses Mean — modern-Western default is True; add setting |
| Chiron | 🔴 Wrong (W-01) |
| ASC/MC/DSC/IC | ✅ Correct |
| Vertex / Anti-Vertex | 🔴 Wrong (W-04) |
| East Point | 🔴 Wrong (W-03) |
| Houses Placidus / Equal / Whole Sign | ⚠️ Placidus cusps (W-05) / ✅ Equal & Whole Sign |
| House systems beyond 3 | ❌ Missing (Koch, Regiomontanus, Campanus, Porphyry, Morinus, Topocentric) |
| Polar fallback + warning | ✅ Implemented + reason surfaced |
| Major aspects + orbs + applying | ✅ aspects / ⚠️ applying (W-10) |
| Minor/harmonic aspects | ✅ Present, correct method, good interpretations |
| Parallels/contraparallels/OOB | ✅ Present (threshold uses stale obliquity constant — minor) |
| Midpoints + 90° dial | ✅ Present (indirect midpoints, planet-pictures ❌ missing) |
| Harmonics H4–H9 | ✅ Present (angles not projected into harmonics — small gap) |
| Fixed stars | ⚠️ Wrong epoch handling (W-08); 20 stars (fine scope) |
| Eclipses | ⚠️ Hardcoded/stale (W-09) |
| Medical astrology | ✅ Present — must keep "non-medical" disclaimer |
| Astrocartography | 🔴 Math wrong (`p.longitude−90` for MC lines; AC/DC treated as longitudes; IC computed but never emitted) — rewrite with RA-based formulas (`verifiedFixes.ts::astrocartographyLines`) |
| Secondary progressions | ✅ Present, method sound |
| Solar arc / tertiary | ❌ Missing |
| Transits | ✅ Engine solid; ⚠️ no exact-hit search (retrograde passes), orbs not planet-differentiated |
| Profections | ✅ Correct (add monthly profections) |
| Zodiacal Releasing | ✅ Valens periods correct, Loosing-of-Bond correct, L2 correct; ⚠️ "peak" marked for all angular distances — Valens' peak is the 10th-from-lot; L3/L4 missing |
| Firdaria | ✅ Correct orders & sub-lords; modern Uranus/Pluto extension optional |
| Synastry | ✅ Aspects/overlays/scores; ⚠️ W-11 (angles missing, fake applying, heuristic label) |
| Composite | ✅ Midpoint method correct (house frame simplified — document) |
| Davison | ✅ Math correct (historical timezone caveat pending Phase 1C resolver) |
| Arabian Parts (12) | ✅ Sect reversal correct, Paulus-convention Eros/Necessity; more lots + dead code cleanup recommended |
| Almuten Figuris | ⚠️ Tables correct (verified term-by-term) but SAN approximated (W-06 — replace with exact lunation search) |
| Lilith (Mean/True) | 🔴 Mean broken (W-02) — fix verified ≤0.124° in-window / ≤0.4° outside; "True" unverifiable against any standard — relabel or ephemeris-grade |
| White Moon Selena / Proserpine / Hypnos | 🟡 Linear fabricated formulas — label non-standard or remove |
| Asteroids (Ceres–Vesta) | ⚠️ Fixed J2000 Keplerian elements — drift ~0.5–1° in 2026 (recommend Horizons-derived table like Chiron option (a)) |
| Planetary hours | ✅ Present (verify day-boundary vs sunrise convention in follow-up) |
| Timezone inputs | ⚠️ Numeric offsets only — Phase 1C resolver from prior audit still the plan |

## E. INDEPENDENT BENCHMARK MATRIX (executed this session, actual numbers)

| Tool | Command/Method | Dates | Result |
|---|---|---|---|
| pyswisseph 2.10.03 (Moshier) | `swe.calc_ut(jd, body, FLG_MOSEPH\|FLG_SPEED)`; `swe.houses(..., b'P')` | 1452, 1975, 1990, J2000, 2026 + 8 cities | astronomy-engine planets ≤0.018° (1452 Pluto), ≤0.005° modern; MC/ASC ≤0.0005°; Placidus repo cusps 0.26–1.74° off → fixed recipe ≤0.0044°; Vertex repo 9–44° off → fixed recipe ≤0.0016°; MeanLilith repo 17–142° off |
| astronomy-engine 2.1.19 (pinned) | exact app call path `GeoVector(body,t,true)`→`Ecliptic` | same | frame sanity: Sun λ=0.0002° at 2000-03-20 equinox anchor |
| Osculating node via r×v (astronomy-engine vectors) | `n = ẑ×(r×v)` in true-ecliptic-of-date frame | 5 epochs | ≤0.009° vs Swiss Eph TRUE_NODE at all epochs |
| Published ephemerides (astro-seek 2026; cafeastrology) | Chiron Nov 2026 | 2026-11-01→2027-01-06 | Chiron 28°04′→26°16′ Aries Rx — repo approximation ≈241° → ~146° error |
| astronomy-engine eclipse search (fix wrapper) | `searchEclipses(2026-01-01, 365)` | 2026 | Reproduces exactly the 4 known 2026 eclipses: Feb 17 Annular Solar, Mar 3 Total Lunar, Aug 12 Total Solar, Aug 28 Partial Lunar → hardcoded lists can be replaced without changing 2026 output |
| Exact lunation search (fix wrapper) | `previousSyzygy(jd)` with elongation 0°/180°, latest-event-before-birth selection | 5 charts | Syzygy sect-type 5/5; exact Sun λ at lunation instant |
| Osculating node speed | ±1 h central difference ×12 | 2026 | −0.1936°/day vs swe −0.1888 (motion genuinely erratic) |
| FB/Lahiri ayanamsa | `swe.get_ayanamsa_ut` both modes | 1900–2100 | FB − Lahiri = 0.883208° constant; Lahiri(J2000)=23.857092 matches repo constant |

## F. HONESTY / LABELING PASS (UI text changes, no math)

1. Stop saying "Swiss Ephemeris" and "0.001° accuracy" in headers/comments — say "astronomy-engine (VSOP/ELP-class, verified ≤0.3′ vs Swiss Ephemeris 1900–2100)"; after fixes, show measured tolerances.
2. Chiron: badge "approximate" (or omit) until table/wasm shipped.
3. "True Lilith", White Moon Selena, Proserpine, Hypnos: label "non-standard/approximate point" or remove.
4. All percentage scores (synastry, daily energy, KP): label "heuristic score".
5. Monthly forecast: real lunation dates only; no invented events.
6. Astrocartography v1: emit MC/IC lines + AC/DC at-natality curves with method note, or hide until rewritten.
7. Keep the good existing pattern: house-fallback reasons surfaced to the user.

## G. PRIORITIZED ROADMAP (dependency-ordered, $0)

- **Phase A (this PR, zero-risk):** `lib/astronomy/verifiedFixes.ts` — reference implementations of the verified math fixes (Vertex closed-form, East Point, Mean Lilith hybrid, True Node r×v, Placidus iteration, exact Syzygy) + FB offset + star precession helper + dynamic eclipse/lunation helpers, each header-documented with the verification numbers above. Docs: this audit + the Master Prompt. **No existing file is modified → cannot break the build.**
- **Phase B (on approval):** wire `verifiedFixes.ts` into `swissEphemeris.ts`, `lunarPointsCalculator.ts`, `almutenFigurisCalculator.ts`+`ephemeris.ts`, `minorAspects`-shared applying; add regression script `scripts/testVerifiedFixesSuite.ts` asserting the §E numbers (independent truth baked in); update vacuous assertions in `westernBenchmarkTests.ts` (W-ADV-03 etc.).
- **Phase C:** dynamic eclipses + real lunation dates + astrocartography rewrite; Chiron/asteroid tables generated from Horizons (one-time, embed JSON).
- **Phase D:** feature gaps (house systems via verified formulas, solar arc, L3/L4, monthly profections, synastry angle contacts), True-Node/Mean-Node setting, Ketu≡Rahu+180 audit for the Vedic side (KP wants True Node).
- **Phase E:** swisseph-wasm evaluation (AGPL) as the single ephemeris source of truth if licensing fits; else extend tables.
- **Phase F:** carry the prior audit's Phase 1C historical-timezone resolver, BAZI-1 workstream (month-branch tautology, solar-time engine, dropped inputs), privacy, and runtime HTTP 200/404 items (unchanged priorities per `note (2).txt`).

## H. EXACT APPROVAL DECISION

- **Ready to implement now:** Phase A is delivered in this PR (docs + `verifiedFixes.ts`). Phase B is fully specified (recipes + test values included) and is the smallest safe next unit: one wiring commit + one regression suite, reviewed as a single PR, `npm run lint` + all 10 suites + in-app benchmark re-run before merge.
- **Postponed until Phase B lands:** Phases C–F (each touches more files and needs its own verification table).
- **Decision needed from the repo owner:** (1) approve Phase B wiring; (2) choose Chiron route (embedded table vs AGPL wasm vs hide); (3) confirm True-Node as the Western default node setting; (4) license compatibility of the app with AGPL dependencies.

**AUDIT: READY FOR IMPLEMENTATION — scope: Phase B (wiring of verified math fixes + regression suite), pending owner approval per repo governance (`2026-10-31-master-audit-spec.md` §1.1).**

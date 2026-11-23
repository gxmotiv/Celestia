# CELESTIA MASTER PROMPT — Western & Advanced Western Astrology (v2.0)

> **Changelog v2.0 (2026-11-23):** completed repo map (25 astronomy files, incl. `verifiedFixes.ts`); expanded feature matrix to 12 domains (solar/lunar/planetary returns, combustion-condition cluster, antiscia, chart patterns, dispositor tree, temperament, void-of-course Moon, Sabian symbols, Uranian/Cosmobiology schools, mundane layer, eclipse interpretation, birth-time uncertainty, asteroids/dwarf planets); NEW §5 Current-Era Fixtures with January refresh rule; NEW §8 Offline-First requirements; tolerance table added to §2; defect lineage updated to executed-audit statuses (W-01…W-12); evidence-provenance rule (no deletable root files); output contract extended (I: currency verdict, J: removal decisions).
>
> **How to use this file:** paste everything below the line into any AI session together with access to this repository. It is self-contained: role, rules, method, feature checklist, 2026 fixtures, accuracy standards, and output contract. Re-run after every major refactor. Keep versioned — do not edit the prompt to make results look better; extend it only with new requirements.

---

## 0. ROLE

You are a **principal-level software architect, TypeScript/Next.js engineer, computational-astronomy specialist, historian of Western astrology, mathematical auditor, and QA engineer** working on Celestia — a client-side, **offline-first**, $0-budget astrology platform built on Next.js 15 + React 19 + `astronomy-engine` (MIT) behind a facade named `SwissEphemerisEngine` (which is **not** native Swiss Ephemeris — never describe it as such unless the dependency and call path prove it).

Your mission, in strict order: **(1) calculation correctness → (2) honest labeling of what is heuristic or approximate → (3) missing-feature coverage for Western and advanced Western astrology → (4) developer experience and UI.** Nothing outranks correctness.

## 1. NON-NEGOTIABLE RULES

1. **Inspect before you claim.** Every finding must carry one of these evidence classes:
   - [V-src] verified from current source (file + function + line)
   - [V-test] verified by an executed test (command + actual numbers)
   - [V-obs] runtime observation, honestly bounded
   - [V-ref] independently source-verified fact (cite the source + URL)
   - [P-rep] previously reported, NOT independently confirmed
   - [H-infer] inference/hypothesis (say what would prove it)
   - [U-block] unknown/blocked (say what is missing)
2. **Never trust internal tests as accuracy proof.** A test that recomputes the same formula it asserts is a tautology. Every numerical claim needs an *independent* reference (Swiss Ephemeris via `pyswisseph`, JPL Horizons, Meeus worked examples, astro.com published positions). **Delete or strengthen vacuous assertions** (e.g. `length >= 0`) wherever found.
3. **Read-only unless approved.** Audit and plan first. Code changes ship as a **branch + pull request**, never direct pushes to the default branch, and never without a verification table.
4. **$0 budget.** Free/open-source only. Allowed and proven: `astronomy-engine` (MIT), `pyswisseph` (AGPL — verification tooling only, not shipped), JPL Horizons API (free, networked, never a runtime dependency), Node `Intl` timezone data (document ICU limits). Not allowed: paid APIs, mandatory network calls for core charts, undocumented data files of unknown license.
5. **Separate the four layers and label each in the UI:** (a) astronomy, (b) calendar/timezone conversion, (c) traditional astrological rules (cite the school: Ptolemy / Dorotheus / Valens / Lilly / Ibn Ezra / Ebertin / modern), (d) heuristic interpretation & scores. A score is not a probability. An approximation is not an ephemeris position.
6. **10x thinking:** for each finding ask *what class of similar errors could exist nearby*, then check them all before reporting. One wrong coefficient usually means the whole series deserves scrutiny.
7. **Evidence provenance.** Never cite loose, deletable root files (e.g. exported AI chat logs) as evidence. Historical session logs belong in `docs/historical_snapshots/` with a dated filename; claims must be re-verified from source code even if a log exists. When a cited evidence file disappears, flag every claim it supported as [U-block] until re-verified [V-src].
8. **Dynamic over hardcoded.** Any feature that names a date (eclipse, ingress, lunation, moon phase, node shift) must compute it via `astronomy-engine` (`SearchGlobalSolarEclipse`, `SearchLunarEclipse`, `SearchMoonPhase`, ephemeris search) — never from a hardcoded list. Hardcoded lists rot silently; §5 fixtures exist *only* to verify the computed output.
9. **Offline-first.** The core chart path must run with zero network calls. Embedded data tables (Chiron, stars, Sabian symbols, cities) ship as static JSON with license notes. AI text generation (`lib/ai/*`) is an optional online enhancement: every AI interpretation must degrade gracefully to the offline rule-based engine, and AI output must be labeled "generated online".

## 2. VERIFICATION METHOD AND TOLERANCES

Ground-truth toolchain (all $0):
- `pip install pyswisseph` → `swe.calc_ut(jd, body, swe.FLG_MOSEPH | swe.FLG_SPEED)` for Sun/Moon/planets/nodes/apogees/ayanamsas; `swe.houses(jd, lat, lon, b'P')` for ASC/MC/Placidus/Vertex (`ascmc[3]`).
- `npm i astronomy-engine@<pinned>` → reproduce the app's exact call path (`GeoVector(body, time, true)` → `Ecliptic(vec)`), then diff.
- Eclipse/lunation/node events: `SearchGlobalSolarEclipse`, `SearchLunarEclipse`, `SearchMoonPhase` (elongation in **degrees**, take the **latest event before** the reference instant — both harness pitfalls already bit once).
- Sanity anchors: Sun λ = 0.000° ± 0.002 at 2000-03-20 07:35:35 UTC equinox; Lahiri ayanamsa 23.857092° at J2000; Fagan-Bradley = Lahiri + 0.883208° (constant 1900–2100); Regulus ≈ 29°50′ Leo at J2000; Horizons for Chiron (`COMMAND='"2060"'`, QUANTITIES=31).
- Fit/derive analytic replacements in a scratch sandbox first, report max error over a stated century range, then port to TypeScript. Wrap angles before polynomial fitting (`np.unwrap`); state every fit's validity window.

**Standard tolerances** (a fix is "verified" only inside these): planets ≤0.3′ vs Swiss Ephemeris · ASC/MC ≤0.01° · derived points (Vertex, EP, Lilith, lots) ≤0.05° · house cusps ≤0.05° · ayanamsa ≤0.01° · ingress/eclipse instants ±2 min vs published sources · eclipse degrees ±0.1° vs published sources (professional sites disagree at the arcminute level — the engine computes, fixtures only assert).

## 3. REPO MAP (verify paths exist before relying on them — complete as of 2026-11-23)

**Astronomy/astrology engine — `lib/astronomy/` (25 files):**
- `ephemeris.ts` — `calculateWesternChart` entry; aspects; legacy Keplerian code (Chiron toy — W-01).
- `swissEphemeris.ts` — astronomy-engine facade: planets, houses (Placidus/Equal/WholeSign), Vertex, node branches, ayanamsa, `normalizeLocalToUTC`.
- `verifiedFixes.ts` — **fix library from the executed audit: verified reference implementations (Vertex closed form, East Point, Mean Lilith hybrid, True Node r×v, Placidus iteration, exact syzygy, FB ayanamsa, star precession, dynamic eclipse/lunation helpers). Wire these in Phase B — do not re-derive them.**
- `minorAspects.ts` — minor/harmonic aspects + future-projection applying/separating (the *good* pattern to unify on).
- `advancedWesternCalculators.ts` — midpoints (Ebertin), harmonics, declinations/parallels.
- `specializedWesternEngines.ts` — fixed stars, eclipses, medical, astrocartography (ACG math wrong — audit §D; rewrite with RA-based formulas).
- `predictiveHellenisticEngine.ts` — secondary progressions, profections, Zodiacal Releasing, Firdaria.
- `hellenistic.ts` — sidereal comparison + Hellenistic helpers.
- `relationshipEngine.ts` — synastry, composite, Davison (66 KB).
- `lunarPointsCalculator.ts` — Lilith, White Moon, Vertex, East Point, theoretical points (W-02/W-03/W-04 live here).
- `arabianPartsCalculator.ts` — 12 Hermetic lots with sect reversal.
- `almutenFigurisCalculator.ts` — Ibn Ezra/Lilly almuten incl. pre-natal syzygy (W-06).
- `asteroidCalculator.ts` — fixed-J2000 Keplerian asteroids (Ceres–Vesta).
- `transits.ts` — transits, daily/weekly/monthly forecasts (W-09 fabricated moon dates live here).
- `MultiSystemTransitEngine.ts` — 64 KB multi-system transit engine; includes BaZi hour-pillar bug (UTC vs local solar time, per third-pass log — re-verify from source).
- `baziEngine.ts`, `chinese.ts`, `vedic.ts`, `numerology.ts` — non-Western systems (BaZi month-branch tautology at `baziEngine.ts:561–568` per prior log — re-verify from source; Western audit does not gate on them).
- `planetaryHours.ts`, `cities.ts` — planetary hours; city database.
- `interpretations.ts`, `westernExtendedInterpretations.ts`, `lib/astrology/interpretationEngine.ts` — rule-based interpretation layers (**the offline interpretation path**).
- `westernBenchmarkTests.ts`, `multiSystemBenchmarkTests.ts`, `scripts/test*Suite.ts` — suites (in-app + scripts).
- `docs/audit/2026-10-31-master-audit-spec.md` (brief) and `docs/audit/2026-11-23-western-master-audit.md` (**executed audit: 12 verified defects W-01…W-12, benchmarks, roadmap — read first; treat as leads, verify before citing**).
- `docs/historical_snapshots/` — archived evidence (session logs live here, per Rule 7).

## 4. WESTERN FEATURE MATRIX v2 (audit every row: Present / Correct / Wrong / Approx-labeled / Missing)

**D1 Core natal:** tropical zodiac (true ecliptic of date), Sun–Pluto + Mean/True Node (setting; True = modern-Western default) + Chiron, ASC/MC/Vertex/Anti-Vertex/East Point, retrograde speeds (numeric, not constants), sect (day/night) consistency across every module.
**D2 Zodiac & dignities:** sign properties computed (element/modality/polarity, classical + modern rulers); essential dignities per planet (domicile/exaltation/triplicity by sect/term(Egyptian, with Ptolemaic option)/face); accidental dignities (angularity, motion, condition); debilities (detriment/fall/peregrine); reception; almuten figuris (Ibn Ezra weights) with exact pre-natal syzygy.
**D3 Condition cluster (traditional):** combustion / cazimi / under the sunbeams, oriental–occidental (phaneta/acronychal), phasis, hayz, beaming, aversion. (2026 anchors: Saturn cazimi 3/25/26 4°43′ Aries; Venus Rx cazimi 10/23/26 0°45′ Scorpio.)
**D4 Aspects:** Ptolemaic majors + semisextile/quincunx; minors (semisquare/sesquiquadrate/quintile/biquintile/septile/novile/decile); per-aspect & per-planet orbs + per-school orb tables (Lilly vs modern vs Cosmobiology); luminaries bonus; **applying/separating via future projection** (one shared function, never relative-speed heuristics); waxing/waning phase labels; aspect-to-angle contacts; orb editability; out-of-sign handling; parallel/contraparallel with date-correct obliquity; aspect-configuration detection (T-square, grand trine/cross, yod, kite, mystic rectangle, thor's hammer); unaspected planets; dodekatemoria contacts.
**D5 Points & bodies:** antiscia/contrantiscia; Lots (Fortune/Spirit sect-reversed + ~20 more from Paulus, incl. marriage lots); twelfth-parts; asteroids Ceres–Vesta (Horizons-derived tables, like Chiron option (a)); dwarf planets/centaurs as opt-in ephemeris-grade points (Eris ~24–25° Aries in 2026; Sedna only after Horizons verification); Lilith branches (Mean = verified hybrid; "True" only if ephemeris-grade, else relabel); **fabricated linear points (White Moon Selena, Proserpine, Hypnos) removed or hidden behind a labeled "experimental / non-standard" toggle**.
**D6 Houses:** Placidus (fixed iteration), Equal, Whole Sign, Alcabitius, Koch, Regiomontanus, Campanus, Porphyry, Morinus, Topocentric; polar fallback + surfaced reason; house-strength (angular/succedent/cadent) in accidental dignities; Gauquelin sectors optional + labeled experimental.
**D7 Predictive:** secondary progressions (+ progressed lunar phase, ingress list); **solar returns** (with annual-profection pairing) + **lunar returns** + planetary returns; solar arc directions; tertiary & minor progressions; transits with exact-hit search (retrograde passes), station dates, shadow periods; profections (+ monthly); Zodiacal Releasing L1–L4 (Valens; peak = 10th-from-lot); Firdaria (+ Uranus/Pluto extension note); decennials & distributions (Valens bond/necessity) optional; primary directions (document school); planetary hours/days; elections basics.
**D8 Relationship:** synastry (angles + Vertex/Chiron contacts, no fake applying, orbs per contact class, reception display); house overlays; composite (+ true composite MC/ASC house frame); Davison (exact midpoint math + historical-timezone caveat); Coalescent optional; synastry-grid UI parity; heuristic scores labeled "not a validated probability".
**D9 Chart synthesis:** Jones chart patterns (bowl/bucket/locomotive/splash/splay/bundle/see-saw); stellium detection; final dispositor + dispositor tree; chart ruler; sect lights; temperament (Greenbaum method); dominant-planet scoring (labeled heuristic); chart signature.
**D10 Advanced schools:** Cosmobiology (Ebertin midpoints + indirect midpoints + planetary pictures + sensitivity points); Uranian/Hamburg (Transneptunians Cupido–Poseidon, symmetric sums A+B−C on the 90° dial) — off by default, labeled non-mainstream; harmonics H2–Hn with angles projected (Addey); **Sabian symbols** (embedded 360-entry table, cite source edition); Evolutionary (Pluto/nodal developmental story) as interpretation layer only; fixed stars with **precession to chart date** + parans + royal-star notes; declination longitude equivalents (DLE) optional.
**D11 Mundane & eclipse:** eclipses computed **dynamically** (classification, peak instant, degree); eclipse-interpretation layer (natal contacts to eclipse degrees, ±orb rule, saros labeling via embedded license-safe catalog); lunation phases + real new/full dates; ingress charts (solar ingress as mundane base); great-cycle tracking (Jupiter–Saturn 20-yr; Saturn–Neptune 36-yr — the Feb 20, 2026 reset at 0°45′ Aries is the current cycle anchor); precessional ages labeled *contested convention*; astro*carto*graphy with real MC/IC/AC/DC math (AC/DC are latitude curves), relocation charts, cyclo*carto*graphy optional, local space.
**D12 Honesty & UX layer:** every heuristic score labeled; every approximation badged; birth-time uncertainty mode (recalculate at ±N min, show which placements/houses flip); medical astrology behind a non-medical disclaimer; timezone inputs via IANA + historical DST (Phase 1C), numeric offsets only as fallback; lunar perigee/apogee (supermoon) + void-of-course Moon computed; PDF/export parity with on-screen data.

## 5. CURRENT-ERA FIXTURES & CURRENCY BLOCK (refresh every January; compute, never hardcode)

Use these as **regression-test anchors and demo-data sanity checks** — asserted within §2 tolerances against dynamically computed values. They are NOT feature data.

**Slow-planet state 2026 (all [V-ref], see audit report for sources):** Pluto ~1–3° Aquarius · Neptune: Aries ingress Jan 26, 2026, Rx Jul 7 at 4°25′ Aries, back into Pisces late 2026, direct Dec 12 at 1°36′ Pisces, re-enters Aries early 2027 · Saturn: Aries re-ingress Feb 14–15, 2026, Rx Jul 26 at 14°45′ Aries, direct Dec 10 at 7°55′ Aries · Uranus: direct Feb 4 at 27°27′ Taurus (conj Algol), Gemini re-ingress Apr 25–26, Rx Sep 10 at 1°41′ Gemini · Jupiter: direct Mar 11 at 15°05′ Cancer, Leo ingress Jun 30, Rx Dec 12 at 27°01′ Leo · Nodes: NN→Aquarius / SN→Leo Jul 26, 2026 (mean node; until Mar 26, 2028) · Chiron: **stays in Aries all 2026** (~26–28°; Taurus ingress June **2027**, not 2026 — a published source misdates this; ephemeris wins).

**2026 one-off anchors:** Saturn–Neptune conjunction Feb 20, 2026 at 0°45′ Aries (World Point; first since 1989, not at 0° Aries since 1702) · eclipses: Feb 17 annular solar 28°50′ Aquarius; Mar 3 total lunar ~13° Virgo; Aug 12 **total solar 20° Leo** (published sources disagree 20°02′ vs 20°08′ — tolerance test case) near the SN; Aug 28 partial lunar ~5° Pisces · Mars–Saturn conj Apr 19 at 7°52′ Aries; Mars–Jupiter conj Nov 16 at 25°53′ Leo · Venus Rx Oct 3–Nov 13 (8°29′ Scorpio → 22°51′ Libra) · Mercury Rx: Feb 25–Mar 20 (Pisces), Jun 29–Jul 23 (Cancer), third in late Oct–Nov (verify at fixture time) · Mars: no Rx in 2026.

**Currency discipline:** (a) engine computes every event — fixtures only verify; (b) any *viral* claim ("7 planets in Aries, first time in 500 years"; "Sedna enters Gemini 2026") is [P-rep] until Horizons/independent verification — never ship it as computed output; (c) each January: re-derive the fixture block for the new year from the engine itself + one published cross-check, and record sources.

## 6. DEFECT LINEAGE & STATUS (from the executed 2026-11-23 audit — verify each before fixing; do not re-derive)

Statuses: ✅ fix-verified (recipe + numbers in audit §C/§E) but **not yet wired** · ❌ open.
- W-01 ✅ Chiron toy Kepler (~146° wrong) → embed Horizons table 1900–2100 (offline JSON) or AGPL wasm; label "approximate" meanwhile.
- W-02 ✅ Mean Lilith 100× rate error → hybrid quintic fit (≤0.124°) + Meeus analytic outside window.
- W-03 ✅ East Point ≡ MC → Equatorial-Ascendant convention (display convention name).
- W-04 ✅ Vertex dual implementation, 8–42° wrong → closed form (≤0.0016°); Anti-Vertex = +180°.
- W-05 ✅ Placidus mixed-frame iteration (0.26–1.74° off) → correct alternating iteration (≤0.0044°); keep polar fallback.
- W-06 ✅ Pre-natal syzygy linear guess → exact `SearchMoonPhase` search (elongation in degrees, latest-before-birth).
- W-07 ✅ True Node truncated series + constant speed → osculating node from r×v (≤0.009°); speed by ±1 h derivative; Mean node already fine; add True/Mean setting (True default).
- W-08 ❌ Fixed stars J2000-only → store J2000 + precess 50.29″/yr (±200 yr adequate for ≥1° orbs).
- W-09 ❌ Hardcoded eclipse lists + fabricated monthly moon dates → dynamic `Search*` (fix wrapper reproduced all 4 2026 eclipses exactly).
- W-10 ❌ Applying via bogus defaults (`speed||1`, `||0.5`) → unify on future-projection with `minorAspects.ts`.
- W-11 ❌ Synastry hardcoded `isApplying: true`, missing angle/Vertex/Chiron contacts, unlabeled scores.
- W-12 ❌ Fagan-Bradley hardcoded 24.84° → Lahiri + 0.883208°.
Plus inherited workstreams (own gates, separate from Western track): historical timezone resolver (Phase 1C), BaZi month-branch tautology + dropped birth inputs + UTC hour pillars (BAZI-1 — re-verify from source since the session log was removed from root), localStorage privacy, runtime HTTP 200/404. Obliquity constant for OOB → date value. After any fix: regression tests with independently sourced expected values.

## 7. HONESTY / LABELING CONTRACT (UI text; some are removals)

1. Say "astronomy-engine (VSOP/ELP-class, verified ≤0.3′ vs Swiss Ephemeris 1900–2100)" — never "Swiss Ephemeris" or "0.001°".
2. Chiron badged "approximate" (or omitted) until the table/wasm ships; same for Ceres–Vesta until Horizons tables land.
3. "True Lilith", White Moon Selena, Proserpine, Hypnos: label "non-standard/approximate point" behind an experimental toggle, or remove.
4. All percentage scores (synastry, daily energy, KP): "heuristic score — not a validated probability".
5. Monthly forecasts: real computed lunation/eclipse dates only; no invented events.
6. Astrocartography: emit correct MC/IC lines + AC/DC at-natality curves with a method note, or hide until rewritten.
7. AI-generated text: labeled "generated online"; offline fallback text always available.
8. House-fallback reasons surfaced to the user (existing good pattern — keep).
9. Every school-specific choice displayed with its school (terms: Egyptian/Ptolemaic; decans: Chaldean/Faces; node: True/Mean; East Point convention; direction school).

## 8. OFFLINE-FIRST REQUIREMENTS

- Core chart path (input → calculation → display → export) must complete with network disabled; CI runs the suites in a no-network sandbox.
- Embedded datasets (Chiron/asteroid tables, fixed stars J2000, Sabian table, cities) are static JSON, license-noted, version-pinned.
- AI text (Pollinations/FreeModel/NaraRouter/OpenRouter via `lib/ai/generateText.ts`) is an optional online layer: feature-detect connectivity, degrade to `lib/astrology/interpretationEngine.ts` rule-based text, and label the difference in the UI.
- Future $0 offline-AI option: in-browser WebGPU LLM (WebLLM-class) — optional, never a dependency, downloaded explicitly by the user.
- No CDN runtime dependencies; PWA/service-worker caching verified by an offline smoke test.

## 9. OUTPUT CONTRACT

Return one report with sections:
**A. Executive summary** (evidence-classified) · **B. Current repo facts** (versions, structure — distinguished from historical claims) · **C. Verified defect register** (ID, severity 🔴/🟠/🟡, file/function, evidence, measured impact, fix recipe, confidence, approval needed?) · **D. Feature matrix verdicts** (Present/Correct/Wrong/Approx/Missing per §4 D1–D12) · **E. Independent benchmark matrix** (tool, command, dates, tolerances, actual numbers) · **F. Honesty/labeling pass** (what the UI must start saying; what must be removed) · **G. Prioritized roadmap** (dependency-ordered phases, smallest safe next unit, acceptance criteria) · **H. Exact approval decision** (ready now vs postponed) · **I. Currency verdict** (§5 fixtures recomputed and asserted; any stale fixture flagged) · **J. Removal decisions** (list of items removed/hidden this pass, per §7, with one-line justification each).
Optionally append a machine-readable JSON defect register (id, severity, file, status) for CI consumption.
Finish with one of: `AUDIT: READY FOR IMPLEMENTATION — scope: <list>` or `AUDIT: NOT READY — blockers: <list>`. If the audit is too large for one run, ship verified findings, mark the rest incomplete, and provide the continuation plan — never claim completion you did not achieve.

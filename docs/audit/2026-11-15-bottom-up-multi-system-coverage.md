# Celestia bottom-up, cross-system audit map

**Review date:** 15 November 2026  
**Branch at review start:** `deploy/cloudflare-workers-free`  
**Purpose:** make the user's "smallest to biggest, in every system" requirement operational. This is an audit map and active work ledger, not an accuracy certificate or a claim that every tradition has been exhaustively enumerated.

## 1. Audit rule: bottom-up, then end-to-end

A system is not complete because its top-level page renders or because one chart-level test passes. Each method must be checked at every applicable layer, in this order:

| Layer | Smallest-to-largest check | Required evidence before promotion |
|---|---|---|
| **L0 — primitives** | Numeric domains, modulo/wrap, sign conventions, floating-point boundary policy, arcsecond/minute rounding, date validation, array indexing, deterministic ordering, invalid/NaN/infinite input | Unit tests at exact boundary, just below, just above, negative/wrap values, invalid values, and independent arithmetic fixtures |
| **L1 — civil time and place** | Calendar date, clock time, seconds, IANA zone, historical offset, ambiguous/nonexistent time, UTC conversion, geocoding, latitude/longitude sign, local mean/apparent time | Explicit input policy, IANA identity, historical limitations, DST boundary tests, coordinate validation, no silent noon/offset fallback |
| **L2 — astronomical/calendar primitives** | Julian day, UT/UT1/UTC/TT, Delta-T/EOP, ephemeris identity, reference frame/equinox, geocentric/topocentric frame, longitude/latitude/speed, node model, solar-term crossings | Named model and settings; independent reference vectors with frame/time-scale parity; residuals and tolerances recorded |
| **L3 — base chart geometry** | Tropical/sidereal conversion, ayanamsa, sign, nakshatra, pada, sub, house cusps, divisional segment, pillar/calendar boundary | Every boundary convention named; exact edge and cross-sign/cross-date fixtures; chart outputs trace back to L0-L2 inputs |
| **L4 — tradition-specific derived rules** | Dignity, aspect, house lord/occupant, karaka, significator, element strength, pattern, yoga, lot, node agency, hidden stem, useful-god, etc. | Primary/recognized source and edition; distinct lineage variants; rule order, exception handling and provenance; no cross-tradition substitution |
| **L5 — timing and prediction** | Dasha/year-lord/profection/releasing/luck pillar, event promise, house combinations, transit triggers, recurrence, period boundaries | Dated test charts; exact period starts/ends; rule path and grade shown; heuristic score not described as probability; empirical claims require pre-registered outcome testing |
| **L6 — synthesis and interpretation** | Combine only already-computed method outputs; handle conflicting testimony; distinguish calculation from interpretation and historical doctrine from modern advice | Source-labelled interpretation; explain missing/unknown inputs; no invented default; uncertainty preserved |
| **L7 — product path** | UI selector, chart state, saved profile, report/PDF, Android offline, API, caching and deploy | Same method and options in UI/API/export; accessible control; stale-state tests; privacy checks; build, runtime smoke and device tests |
| **L8 — independent acceptance** | Cross-check smallest results first, then complete worked chart, then prediction/event output | Reproducible fixture with inputs, source, output, model settings, hashes, tolerance and reviewer; selected CI suites alone are not certification |

**Pass rule:** a level can only be marked implemented when the calculation and its required validation exist. A higher-level result cannot compensate for an unvalidated lower-level input. A test that repeats the implementation's own formula is a regression test, not an independent reference.

**Variant rule:** every rule needs an ID for tradition, author/text, edition/translation and options. Never blend different schools to make one result look comprehensive. When sources disagree, retain selectable profiles or explicitly mark the result unresolved.

## 2. Shared foundation — every system depends on this

| Bottom-up item | Current repository evidence | Status and smallest next checks |
|---|---|---|
| Numeric normalization and formatting | `lib/astronomy/ephemeris.ts`, `lib/vedic/divisionalCalc.ts`, `lib/kp/subLordEngine.ts`, multiple system helpers | **Partial.** There are guards and boundary suites, but normalization, rounding and wrap logic are repeated in several modules. Build one shared contract only after comparing semantics; test 0/360, −epsilon, exact cusp/segment edge, seconds carry, and tie precision. |
| Birth-time parsing and unknown time | `lib/astronomy/timeInput.ts`; `scripts/testTimeInputSuite.ts` | **Implemented for the tested parser contract; integration partial.** Trace every route from form, profile, partner chart, PDF, transit and offline input. Unknown time must never look like a known noon birth. |
| IANA/historical timezone | `lib/astronomy/historicalTimezone.ts`; timezone audit docs and resolver suites | **Partial.** Validate city-to-zone assignment, pre-1970 limitations, short-lived offsets, seconds offsets, ambiguous and nonexistent local time, and actual browser interaction. Runtime ICU resolution is not proof of historical truth. |
| Geocoding and coordinates | `lib/astronomy/cities.ts`, geocoding API and tracker | **Partial.** Check coordinate parsing, latitude/longitude ranges, zone identity, provider timeout/failure, no-key/offline behavior and stale response races. Never infer time zone from longitude alone as a silent substitute. |
| Julian day and civil calendar | `SwissEphemerisEngine` in `lib/astronomy/swissEphemeris.ts`; UTC/JD suites | **Partial.** Test midnight rollover, leap days, calendar assumptions before 1582/1752, seconds, negative/remote dates and all call sites. State the calendar used. |
| Time scales | `lib/astronomy/swissEphemeris.ts`, time/audit register | **Audit required end-to-end.** Label UTC, UT1 and TT separately; trace Delta-T and Earth-orientation assumptions through sidereal time, angles, houses, solar terms and transit calculations. |
| Ephemeris identity and reference frame | `lib/astronomy/swissEphemeris.ts` | **Disclosure corrected; model validation partial.** This is a compatibility facade calling Astronomy Engine, not native Swiss Ephemeris/libswe. Preserve apparent/astrometric, true/mean equinox, light-time and aberration options in every benchmark. |
| Node pairs | `LunarNodeType` and shared planet calculation; `scripts/testLunarNodeConsistencySuite.ts` | **Internal consistency tested.** Mean/true must be explicit; Ketu must be exactly opposite the selected Rahu model. Independently benchmark both node models against a named external reference. |
| House-frame consistency | `lib/astronomy/ephemeris.ts`; `scripts/testHouseFrameConsistencySuite.ts` | **Partial.** GAST and true obliquity are paired consistently for tested MC/Ascendant formulas. All 12 cusps, high latitudes, each house system and fallback behavior still require independent references. |
| Saved state and output parity | `app/page.tsx`, profile/UI modules, PDF routes and Android wrapper | **Audit required.** Trace method IDs/options and exact UTC birth instant through save/load, partner chart, relationship chart, PDF, offline workspace and export. Check deletion/export/privacy without rewriting existing user data. |

## 3. System-by-system bottom-up scope

### 3.1 Western astrology — tropical, sidereal and historical schools

| Layer | Current scope evidence | Status / next checks |
|---|---|---|
| L0–L2 | Shared astronomy facade and reference benchmark archives | **Approximate/partial.** Continue independent planet and angle vectors across epochs; test speed sign, retrograde station, node, asteroid and fixed-star data separately. |
| L3 chart geometry | `calculateWesternChart`, house modules including Placidus, Equal, Whole Sign, Porphyry, Regiomontanus, Koch, Campanus, Alcabitius, Morinus and Meridian | **Partial.** Validate every cusp, sign-boundary house assignment, polar fallback and requested-vs-actual house disclosure against a reference. A method enum is not proof of a complete house engine. |
| L4 natal foundations | Major/minor aspects, dignities, sect, antiscia, Lots, Almuten, midpoint and harmonic calculators | **Partial.** Keep Hellenistic, Medieval, Renaissance, Modern, Uranian/Hamburg, Cosmobiology, harmonic, sidereal and psychological methods separate. Validate orb and dignity/source variants, chart patterns and interpretation evidence. |
| L5 timing | Transits, secondary progressions, annual profections, Zodiacal Releasing L1/L2, Firdaria and returns | **Partial.** Audit exact dates/retrograde passes, all levels, start/end conventions, converse variants and author-specific source rules. Primary directions, tertiary/minor progressions and some systems remain absent. |
| L6–L8 | Advanced Western panels, print/PDF and suites such as `testWesternLotSectFormulaSuite`, `testWesternAntisciaSuite`, `testWesternIntegritySuite` | **Partial.** Validate each panel's calculation path and PDF parity. Passing suites certify only their named fixtures, not the complete historical system. See `western-astrology-master-scope-catalog.md`. |

### 3.2 Parashari Jyotish

| Layer | Current scope evidence | Status / next checks |
|---|---|---|
| L0–L3 | `lib/astronomy/vedic.ts`, `divisionalCalc.ts`, shared Lahiri-style polynomial | **Partial.** Cross-check Lahiri variant/epoch, sign and nakshatra boundary, pada, exact divisional boundary and chart house frames. Current configured Shodashavarga is 16 named charts, not every possible Varga number. |
| L4 graha/rasi rules | Dignity, natural relationships, Parashari aspects, yoga, Avastha, Ashtakavarga, Shadbala and Tara Bala modules | **Partial.** Independently check each planet-specific strength formula and all sign/degree cut-offs. Separate natural friendship from temporary/compound friendship and different commentarial schemes. |
| L5 Dasha | Vimshottari plus additional Dasha engines in `lib/vedic/completeDashaSystems.ts` and related modules | **Partial.** Each system needs its own activation condition, starting-lord calculation, year length, balance, cyclic order, sub-period nesting, date arithmetic and boundary tests. Do not treat all Dasha systems as interchangeable or all as universally applicable. |
| L6–L8 | Vedic main chart, divisional charts, period screens, print and offline modules | **Partial.** Recompute the same chart via UI, saved profile, API/PDF and offline app. Verify every active period agrees with the selected variant. |

**Smallest-first acceptance:** check 360° normalization → 30° Rasi edge → 13°20′ Nakshatra edge → 3°20′ Pada/Sub edge → every D1–D60 configured division boundary → house and varga synthesis → each strength/yoga rule → Dasha balance/start/end → prediction/interpretation.

### 3.3 Jaimini Jyotish

| Layer | Current scope evidence | Status / next checks |
|---|---|---|
| L0–L3 | Sidereal positions and houses are supplied by the Vedic chart | **Partial.** Reject inconsistent sign/longitude/house data; ensure the Lagna used for Karakamsa is the same sidereal chart frame. |
| L4 Karakas | `lib/vedic/jaiminiKarakas.ts`: explicit 7-Karaka and 8-Karaka choices; 8-Karaka reverses Rahu's in-sign degree | **Partial, now receiving direct regression coverage.** Test each ranking position, 7/8 scheme differences, Rahu at 0° and near 30°, exact/sub-arcsecond tie policy, sign-label match and missing/duplicate positions. The selected default does not establish a universal lineage. |
| L4 Rashi/Graha Drishti | `getJaiminiAspectedSigns` in `lib/vedic/drishtiEngine.ts`, separate Parashari Graha Drishti | **Partial.** All twelve Chara/Sthira/Dwisvabhava target maps now have direct tests and invalid sign indices fail closed. Check their integration into every Jaimini chart and interpretation view; do not confuse Rashi Drishti with Parashari Graha Drishti. |
| L5 sign Dashas | Chara Dasha material is present in the broader Dasha engine | **Audit required.** Verify direction, sign-year count, dual lords, strength comparison and exception sequence against a named BPHS/Jaimini commentary variant. |
| L6–L8 | Vedic chart integration currently publishes Jaimini Karakas/Karakamsa | **Partial.** A chart integration test exists; a complete Jaimini prediction suite (Arudha, Upapada, argala, special lagnas, sign Dashas and source-specific judgement) is not established by that integration test. |

### 3.4 Krishnamurti Paddhati (KP)

| Layer | Current scope evidence | Status / next checks |
|---|---|---|
| L0 | `kpSubLordEngine.ts`, degree formatting, normalized longitude and cusp validator | **Partial.** Test all 27 Nakshatra boundaries, nine sub and sub-sub transitions, 0°/360° wrap, leap-date input and malformed cusp arrays. |
| L1–L3 | `kpCusps.ts`, `kpEngine.ts`, KP ayanamsa profile and sub-lord division | **Partial.** The linear 1900-era ayanamsa profile is explicitly provisional; reconcile named Swiss Ephemeris KP modes and KSK printed tables before calling it canonical. House cusps currently use a sidereal Placidus conversion; other KP house conventions remain to be source-reviewed. |
| L4 significators | `kpSignificators.ts`: house Grades I–IV; planetary A–D; node agents | **Partial.** Keep house-to-planet Grades I–IV separate from planet-to-house A–D. Selected Reader VI node-agent tier is applied; Reader III/V remains a comparison option. Conjunction uses a provisional same-sign rule; node aspect, sign-lord and lower-tier handling remain lineage-sensitive. |
| L4 modern methods | `kpFourStepEngine.ts`: positional status, primary/secondary house groups, CIL | **Partial.** Preserve Classical KP four-fold hierarchy, later Gondhalekar 4-Step and CIL as distinct methodologies. Complete the sourced strong/weak adjudication, conjunction, retrograde and full node refinements; do not equate a union of houses with the complete method. |
| L5 prediction/horary | `kpPredictionEngine.ts`, 1–249 and 1–2193 horary material | **Partial.** Event-house combinations and rule scoring still require source review. Dasha/Bhukti/Antara strongest-grade evidence is displayed, but the score remains a heuristic, not a probability. Ruling planets still need local sunrise, retrograde filters and node substitution. |
| L6–L8 | Advanced KP screen and KP audit report | **Partial.** Ensure profile switching does not leave an invalid target; chart, prediction, horary, saved profiles and reports use the same KP convention and disclose unsupported periods. |

### 3.5 BaZi / Four Pillars

| Layer | Current scope evidence | Status / next checks |
|---|---|---|
| L0–L2 | `timeEngine.ts`, `solarTerms.ts`, `baziEngine.ts` | **Partial.** Validate UTC/longitude/equation-of-time arithmetic, solar longitude and term-crossing residuals against independent almanac/astronomy data. |
| L3 pillars | Ten Heavenly Stems, twelve Earthly Branches, hidden stems, year/month/day/hour pillars, Jie/Qi boundaries and Zi policy | **Partial.** Test every Jie branch boundary, every Qi non-boundary, day-cycle epoch, midnight/early-late Zi, hour branch, leap/civil-time transitions and solar-vs-lunar calendar assumptions. |
| L4 pattern and strength | Five-element distribution, Day Master estimate and supportive-element suggestions | **Approximate/partial.** The current compact score is not a complete classical pattern or Useful-God selection. Month command, hidden-stem season, roots, combinations, clashes, transformations and competing Zi Ping methods require separate implementations. |
| L5 luck pillars | Luck pillar engine and annual influence | **Partial.** Confirm school-specific direction, starting age/day-to-year conversion, solar-term basis, boundary dates and age calculation. |
| L6–L8 | BaZi panel, saved charts, PDF and offline | **Partial.** Keep heuristic labels honest and ensure civil-clock / LMST / LAST and Pure Zi / Early-Late Zi options are visible and consistent across every output. |

### 3.6 Numerology

| Layer | Current scope evidence | Status / next checks |
|---|---|---|
| L0–L1 | Gregorian birth date and name normalization in `lib/astronomy/numerology.ts` | **Partial.** Validate Unicode/diacritics, transliteration, empty names, punctuation, compound names and calendar/date conventions. |
| L4 formula | Current code has a Pythagorean letter table, life path, expression, soul urge, personality and karmic lessons | **Partial.** The current implementation is not a complete Chaldean, Hebrew gematria, Kabbalistic or other numerology system. Add named, separate tables/rules only with sources and worked examples. |
| L5–L8 | Numerology profile and report integration | **Audit required.** Define master-number preservation per calculation, compound-number presentation, personal-year cycle boundary and consistency in PDF/offline. Describe the outputs as symbolic/interpretive and not empirically validated prediction. |

### 3.7 Hellenistic / Medieval / Modern and specialized Western methods

These are method families inside Western astrology, not additional ephemeris systems. Their coverage is tracked in `western-astrology-master-scope-catalog.md`. The required bottom-up order is: tropical/sidereal frame → sect/sign/house geometry → dignities/rulers/terms → lots/antiscia/aspects → natal synthesis → profection/Firdaria/Zodiacal Releasing/directions/transits → interpretation/report. Hellenistic, Medieval/Arabic/Persian/Latin, Renaissance, Modern psychological, Uranian/Hamburg, Cosmobiology and Harmonic methods must remain source-attributed and separately selectable. **Current overall status: Partial.**

### 3.8 Relationship charts and compatibility

| Layer | Current scope evidence | Status / next checks |
|---|---|---|
| L0–L3 | Both charts pass through birth-time, timezone, ephemeris and house pipelines | **Partial.** Confirm shared exact UTC instants and no independent fixed-offset reconstruction in every caller. |
| L4 synastry | `relationshipEngine.ts` cross-chart aspects and overlays | **Approximate/partial.** Audit aspects/orbs, point filtering, house-overlay subset and chosen interpretation school. |
| L4 composite/Davison | Circular midpoint and geographic/time midpoint paths | **Partial.** Independently benchmark longitude wrap, exact antipodes, UTC midpoint, latitude policy, local mean time and house method. |
| L5–L8 compatibility | Category/affinity scores and report/UI | **Heuristic.** Do not present a compatibility score as empirically validated. Check partner profile sync, gender/category neutral handling, PDF parity and privacy. |

### 3.9 Other cross-cutting features

- **Planetary hours:** sunrise/sunset, local date, day ruler, Chaldean sequence and polar no-sunrise/sunset cases must be checked from the time/location layers upward. NOAA-style approximation and fixed-offset input remain limitations.
- **Medical astrology symbolism:** historical symbolism only. It must never be presented as a diagnosis, screening, prevention or treatment system.
- **AI interpretations:** AI must not create or modify deterministic chart calculations. It must identify missing inputs and distinguish source text, system rule and model-generated interpretation.
- **PDF/export:** every field must be mapped from the actual chart schema; compare a complete output with the live chart, and test empty, invalid and large request data.
- **Android offline:** test which systems are genuinely included in the offline bundle. Do not claim full web parity for KP, AI, geocoding, transits or relationship features unless those paths exist and pass offline tests.

## 4. Source and research anchors — preserve variants

The following are research starting points; an online transcription is not automatically a critical edition.

| Method family | Source anchor | Caution to preserve |
|---|---|---|
| Parashari | [Brihat Parashara Hora Shastra, R. Santhanam English transcription](https://archive.org/stream/BPHSEnglish/BPHS%20-%202%20RSanthanam_djvu.txt); [BPHS chapter 46, Dasha material](https://www.siva.sh/brihat-parashara-hora-shastra/46/1-5) | Chapter numbering, translation and commentarial additions differ. Alternative Dasha systems are conditional; do not make every one the default. |
| Jaimini | [Jaimini Sutras, B. Suryanarain Rao / Raman-era transcription](https://archive.org/stream/JAIMINISUTRAS_201707/JAIMINI%20SUTRAS_djvu.txt) | Seven/eight Chara Karaka schemes, Rahu ranking and tie-filling rules have commentarial variations. The code must label the chosen method. |
| BaZi | [Di Tian Sui / Chanwei text at Chinese Text Project](https://ctext.org/wiki.pl?if=gb&chapter=126492); [Zi Ping Zhen Quan Pingzhu](https://ctext.org/wiki.pl?if=gb&chapter=974137); [San Ming Tong Hui, volumes 1–2](https://zh.wikisource.org/wiki/三命通會/卷一) | Distinguish original text from later commentary. The five Useful-God selection schools often quoted together may come from a later commentator, not the original author. |
| Hellenistic | [Valens, Anthologies (digital text)](https://www.skyscript.co.uk/valens_janegca.html); [Ptolemy, Tetrabiblos III.10](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/3B*.html); [Project Hindsight translation catalogue](https://www.projecthindsight.com/products/translations.html) | Valens, Ptolemy and Dorotheus are distinct witnesses, not one uniform rulebook. Record textual/source variant for Lots and timing methods. |
| KP | [KSK Reader corpus index](https://kpastrology.astrosage.com/kp-learning-home/resources); [KP Astrology Basics transcription](https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/KP-Astrology-Basics_djvu.txt); [KP Simple Rules transcription](https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/KP-Simple-Rules_djvu.txt) | Readers III/V/VI differ on some node-agent ordering; later teaching texts are not equivalent to KSK's original Readers. |
| Numerology history | [Daniel Abrams, “From Germany to Spain: Numerology as a Mystical Technique,” Journal of Jewish Studies (1996)](https://www.liverpooluniversitypress.co.uk/doi/10.18647/1856/JJS-1996); [UCL Pythagorean research thesis](https://discovery.ucl.ac.uk/id/eprint/1529408/1/Pythagoreans-number&numerology.pdf) | Ancient number philosophy, Hebrew gematria and modern name-number algorithms are not the same system. Do not infer modern Pythagorean letter mapping from ancient Pythagorean mathematics. |
| Shared technical standards | [Astronomy Engine](https://github.com/cosinekitty/astronomy); [Swiss Ephemeris documentation](https://www.astro.com/swisseph/swephprg.htm); [IERS time-scale guidance](https://www.iers.org/iers/en/service/faqs/thenewiauresolutions/timeargumentforusingiersproducts-104-157); [IANA timezone theory](https://www.iana.org/time-zones/theory) | These establish technical interfaces and model conventions; they do not independently certify every Celestia output. |

## 5. Acceptance gates and reporting

For every system, maintain one result per applicable layer:

- **Source traced** — the code path and actual call sites are inspected.
- **Unit-tested** — local primitive/rule assertions run and pass.
- **Integration-tested** — chart generation uses the same output end-to-end.
- **Independently benchmarked** — a separately sourced worked example or numeric reference is compared with declared settings and tolerances.
- **UI/export tested** — the chosen method and provenance remain consistent across web, saved profile, PDF and supported offline paths.
- **Known limitation** — a specific missing variant, approximation or unavailable input is visible to the user.
- **Not checked / blocked** — state what cannot be proven yet.

Do not promote a method to “complete” because another method in the same broad tradition passed CI. Keep the test-suite name, commit SHA, actual run result and reference fixture attached to each acceptance claim.

## 6. Immediate execution order

1. **Clear current KP regression gate.** The new direct Jaimini suite is separate; fix any failing KP fixture or source logic before further prediction work.
2. **Complete L0 shared numeric/time checks.** Compare repeated local normalizers and exact boundary handling, then preserve system-specific semantics.
3. **Continue the Jaimini micro-tests.** Directly verify 7/8 scheme, Rahu rank, tie precision and twelve Rashi Drishti maps before chart integration.
4. **Audit Parashari dasha systems smallest-first.** For each one, check year length, start lord, balance, nested subdivisions and exact period boundaries.
5. **Audit BaZi day/month/year/hour boundaries and pattern engine.** Keep calendar/root finding separate from Useful-God heuristics.
6. **Return to KP prediction after the foundations are stable.** Finish source-specific 4-Step, node, retrograde, ruling planets, local-sunrise and grade-weighting.
7. **Run system-specific UI, saved-profile, PDF and offline parity checks.** No system gets a pass by borrowing another system's acceptance.

**Scope note:** this map will expand as additional files, systems and source lineages are discovered. “Smallest to biggest” is a repeatable inspection order, not a promise that every historical school can be made finite or fully implemented in one release.

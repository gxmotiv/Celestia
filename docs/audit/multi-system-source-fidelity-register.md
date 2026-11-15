# Celestia Multi-System Source-Fidelity Register

**Working branch:** `deploy/cloudflare-workers-free`  
**Updated:** 15 November 2026  
**Status:** initial cross-system audit register; this is not a claim that any tradition is fully implemented.

## Why this register exists

Celestia supports several distinct calculation and interpretive traditions. They may share astronomical inputs, calendar conversion, user profiles, storage, chart rendering and accessibility components, but they must not silently share rules that belong to a different school.

A Western Placidus chart, a Parashari Jyotish chart, a KP chart, a BaZi chart and a numerology report are not interchangeable presentations of one universal method. A result must identify the method and version that produced it. Comparative synthesis may be offered after the independent results are calculated; it must never overwrite or disguise those results.

“All of a system” is also not a finite universal checklist. Traditions contain different authors, editions, lineages and local conventions. Celestia therefore uses a versioned catalogue of explicitly named methods and reports what is implemented, partial, approximate, symbolic or not yet implemented.

## Non-negotiable implementation contract

Every selectable method needs these items before it can be marked **Implemented (tested)**:

1. **Identity and source:** named school, author/text or recognized method source, edition/translation where relevant, chapter/page/verse or documented source URL, and the exact variant being implemented.
2. **Input contract:** calendar, time scale, timezone, location, coordinate frame, zodiac/ayanamsa, house frame, birth-time uncertainty, and any required user choices.
3. **Calculation contract:** equations, rule order, boundary handling, day/night or other conditional rules, rounding policy, and explicit treatment of unsupported inputs.
4. **Independent verification:** hand-checked examples or independent reference fixtures, edge cases, regression tests and tolerances. A test that repeats the same implementation formula is not an independent reference.
5. **Product integration:** the real website and app workflows use the same declared method; charts, reports, exports and transits disclose the method actually calculated.
6. **No silent substitution:** never replace a method with a different system because it is convenient. Show a clear unsupported/error state or a disclosed, source-authorized fallback.

Shared astronomy may provide raw positions and time conversions. It does not authorize sharing each tradition's rulerships, house doctrine, dasha rules, significator hierarchy, letter mappings or interpretive judgements.

## System register

| System / family | Repository entry points | Method boundary to preserve | Immediate audit focus |
|---|---|---|---|
| Modern and traditional Western astrology | `docs/audit/western-astrology-master-scope-catalog.md`; `lib/astronomy/` | Keep modern tropical, Hellenistic, medieval, Renaissance/horary, electional, Uranian, Cosmobiology and harmonic school variants named separately. A supported house calculation does not make the whole tradition complete. | Continue the Western technique catalogue, independent ephemeris limits, dignities/receptions, antiscia, Lots, primary directions, horary and electional workflows. |
| Parashari Jyotish | `lib/astronomy/vedic.ts`; `lib/vedic/` | Keep Parashari rules and source/edition variants distinct from Jaimini, KP and Western rules. Conditional dashas must retain their source conditions; a menu of D1–D60 labels is not proof that all varga calculations and interpretations are correct. | Reconcile divisional-chart boundaries, Shadbala components, dasha conditions and birth-balance rules against named text editions and independent worked examples. |
| Jaimini Jyotish | `lib/vedic/jaiminiKarakas.ts`; related `lib/vedic/` timing engines | Do not treat Jaimini rasi dashas, chara karakas, aspects or argala as synonyms for Parashari graha drishti or Vimshottari rules. Jaimini itself has interpretive and textual variants. | Establish separately sourced rule profiles and test fixtures for karaka selection, rasi aspects and each implemented rasi dasha. |
| KP / Krishnamurti Paddhati | `lib/kp/` | KP is its own stellar/sub-lord method. Preserve its KP ayanamsa profile, Placidus cusps, star/sub/sub-sub divisions, cuspal sub-lords, significator ordering and ruling planets. Do not inherit whichever Western house system the user selected. | KP cusp calculations now recalculate the required Placidus geometry from the birth chart's original time and coordinates; high-latitude unsupported cases fail closed. Next: validate KP ayanamsa and cusp/sub-lord boundaries against cited original KP tables and independently captured fixtures. |
| Numerology: Pythagorean, Chaldean and Indian/Vedic | `lib/numerology/pythagorean.ts`, `chaldean.ts`, `vedic.ts` | Keep letter tables, compound-number treatment, reductions, name source and planetary correspondences attached to the named method. Do not use a mapping from one school as if it were universal. | Audit each table against its named author/edition and add test vectors for accents, punctuation, non-Latin names, master numbers and compound numbers. |
| Chinese Lo Shu | `lib/numerology/loshu.ts` | Distinguish the Lo Shu magic-square arrangement from modern birth-date digit-grid interpretations. Grid geometry and a particular contemporary reading method need separate provenance. | Source-label arrow, missing/excess-number and elemental interpretations; verify exactly which input digits are counted and which are excluded. |
| Kabbalah / Gematria | `lib/numerology/kabbalah.ts` | Hebrew gematria values are distinct from a Western Latin-to-Hebrew transliteration. A transliteration is a declared mapping variant, not the original Hebrew spelling or a universal Gematria calculation. | Disclose transliteration table and pronunciation assumptions; separate Hebrew-input calculation from Latin-name transliteration; audit the selected Tree-of-Life and tarot correspondences by lineage. |
| Tamil En Kanitham / Tamil-region numerology | `lib/numerology/tamil.ts` | Do not label a Chaldean-Indian English-letter table as a proven classical Tamil-script table. Tamil script, Latin transliteration, regional adaptations and birth-star naming sounds are different inputs and practices. | The current Peyar En output now identifies its Chaldean-Indian Latin A–Z mapping and returns “Not calculated” for Tamil or mixed-script names. A traditional Tamil-script table must not be invented; examine the digitized Eṇ Cuvaṭi manuscript and other primary sources first. |
| Chinese BaZi / Four Pillars | `lib/astronomy/baziEngine.ts`; `lib/vedic/` is separate | Preserve solar-term year/month boundaries, day-boundary convention, local time basis, stem-branch rules, hidden stems, Ten Gods, luck pillars and school-specific conventions. Do not substitute Gregorian year or midnight rules without naming the selected profile. | Solar-month tests now distinguish the 12 Jie month-starts from the 12 intervening Qi terms; add independent term-instant and historical timezone fixtures, then continue hidden-stem/Ten-Gods validation and luck-pillar direction/starting-age checks. |
| Other systems and extensions | `lib/astrology/`, plus future method-specific modules | Astrocartography, Uranian/Hamburg, Cosmobiology, harmonics, fixed stars, medical symbolism, numerology and future systems need their own provenance and unsupported-state policy. | Add a system only after its reference method, required inputs and independent expected outputs have been identified. |

## Findings and fixes from this audit cycle

### Western Lots: Fortune and Spirit formula provenance

**Finding:** the Lot calculator used the common sect-reversed Hellenistic formula correctly, but a benchmark attributed the nocturnal reversal to Ptolemy's `Tetrabiblos` III.10. That attribution is incorrect: Ptolemy specifies the Sun-to-Moon arc for Fortune both by night and by day. The common reversed convention is documented in other Hellenistic sources and examined by Dorian Gieseler Greenbaum; Valens also preserves a more nuanced night-Fortune rule in `Anthology` III.11 depending on whether the Moon is above or below the Earth.

**Correction:** `ArabianPartsCalculator` now publishes `formulaProfile: "common-hellenistic-sect-reversed"` and labels Fortune and Spirit formula strings as the common Hellenistic day/night profile. The code comment explicitly excludes Ptolemy's non-reversing formula and Valens' special night-Fortune variant, rather than claiming one universal classical rule. Both the Western benchmark and the multi-system benchmark now state the actual method lineage; the multi-system benchmark independently recomputes Fortune and Spirit from chart Ascendant, Sun and Moon instead of checking only that a formula label contains "Day" or "Night".

**Regression coverage:** `scripts/testWesternLotSectFormulaSuite.ts` checks numeric day/night Fortune and Spirit positions, their reflection about the Ascendant, New Moon and Full Moon coincidences, house assignment, and invalid cusp-count rejection.

**Sources:** [Dorian Gieseler Greenbaum, "Calculating the Lots of Fortune and Daemon in Hellenistic Astrology", *Culture and Cosmos* (2007)](https://doi.org/10.46472/cc.01211.0217) compares the common sect-reversed formulas and textual variants. [Valens, `Anthologies`, Riley translation / Skyscript digital edition](https://www.skyscript.co.uk/valens_janegca.html) provides the primary text for `II.23` (Daimon) and `III.11` (Fortune). [Ptolemy, `Tetrabiblos` III.10, Robbins Loeb translation](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/3B%2A.html) explicitly says to use the Sun-to-Moon distance "both by night and by day"; the note to that passage explains the direction of projection.

### Parashari Shodashavarga boundary audit

**Correction:** `lib/vedic/divisionalCalc.ts` now rejects unknown varga IDs and non-finite longitudes instead of silently falling back to D1. Equal-width divisions use a sub-microarcsecond floating-point boundary tolerance so exact D7/D9/D45-style cusps are assigned to the following half-open subdivision consistently. D30 keeps its unequal odd/even segment tables and uses the same explicit boundary handling for sign and degree output.

**Regression coverage:** `scripts/testParashariVargaSuite.ts` checks the named rules and exact boundaries across all 16 configured Shodashavarga charts, degree mapping, and invalid-input rejection. This validates the implemented sign-assignment algorithms at the tested boundaries; it does not certify every Varga interpretation, dignity doctrine, or textual variant.

### BaZi Day Master strength / Useful-God disclosure

**Finding:** `FiveElementAnalysisEngine.evaluateDayMaster` uses a compact weighted heuristic: month-branch seasonal support plus aggregate same/resource versus output/controlling element counts. It does not evaluate the full classical pattern, roots, hidden-stem seasonal command, combinations, clashes, transformations, or the competing Yong Shen schools.

**Correction:** `ChineseView` now labels the strength as an estimate, renames “Favorable Elements (Yong Shen)” to “Model-Suggested Supportive Elements,” and explains that this is not a complete classical Useful-God or pattern-selection analysis. The five-element chart remains a weighted distribution summary, not a strength verdict.

**Next work:** choose and cite a specific Zi Ping lineage and source edition before implementing a full Useful-God/pattern engine. Keep the current model available only as a provisional comparison view until independently benchmarked.

### BaZi Jie / Qi solar-month boundaries

**Finding:** BaZi's twelve monthly branches are opened by the twelve Jie (節) terms, spaced 30° apart from Lichun at 315°. The alternating Qi (氣) terms at the 15° midpoints do not advance the month branch. Treating all twenty-four solar terms as month boundaries would incorrectly advance the Month Pillar twice in each month.

**Validation:** `scripts/testBaZiJieQiBoundarySuite.ts` checks all twelve Jie branch starts and all twelve Qi non-boundaries, then tests the actual Swiss Ephemeris Sun longitude around the 2024 Lichun, Yushui, Jingzhe, Chunfen and Qingming instants. The expected result is checked two hours either side of each calendar instant to avoid overfitting a few seconds of model/almanac difference.

**Sources:** the [Hong Kong Observatory's 2024 solar-term reference](https://www.hko.gov.hk/en/gts/astron2024/files/2024SolarTerms24.pdf) explains the 24 terms as Sun-longitude events and specifies Hong Kong Time as UTC+8; the [2024 term table with Jie/Qi classification](https://almanark.com/jieqi/2024/) provides exact term instants and identifies the twelve Jie as month boundaries. These are astronomical/calendar test references, not claims that BaZi interpretations are scientifically predictive.

### Parashari natal dignity cut-offs (BPHS 3.51–54)

**Finding:** Mercury in Virgo was classified as Moolatrikona from 15° through 30°, but BPHS 3.52–53 divides Virgo into three consecutive zones: 0°–15° exaltation, 15°–20° Moolatrikona and 20°–30° own sign. The same audit also found that other classical Moolatrikona limits used inclusive upper bounds, causing an exact boundary degree to remain in the preceding dignity zone.

**Correction:** `evaluateVedicDignity` is now exported for direct testing and validates its inputs. The seven classical planets use explicit half-open intervals: Sun/Leo [0°,20°), Moon/Taurus exaltation [0°,3°) then Moolatrikona [3°,30°), Mars/Aries [0°,12°), Mercury/Virgo exaltation [0°,15°), Moolatrikona [15°,20°), own [20°,30°), Jupiter/Sagittarius [0°,10°), Venus/Libra [0°,15°), and Saturn/Aquarius [0°,20°). This ensures the exact boundary belongs to the following zone, consistently.

**Regression coverage:** `scripts/testParashariNatalDignitySuite.ts` checks all seven planets' boundaries, all three Mercury Virgo zones, ordinary late-Virgo own-sign degrees and invalid sign/degree rejection. Since dignity feeds chart labels and some Yoga predicates, the correction affects downstream calculations as well as the displayed dignity badge.

**Sources:** [BPHS Chapter 3, verses 51–55 Sanskrit and translation](https://www.siva.sh/brihat-parashara-hora-shastra/3/51-55) and the [digitized BPHS full text, verses 49–56](https://archive.org/stream/ParasharaHoraSastra/BrihatParasharaHoraSastraVedicAstrologyEbook_djvu.txt). Verse 53 specifically states Mercury's next five Virgo degrees are Moolatrikona and the remaining degrees are own sign.

### Shadbala status correction

**Finding:** the Shadbala screen previously claimed a complete classical six-fold result while the engine used provisional/fixed values and simplified approximations. Saptavargaja initially repeated one Rashi relationship across seven Vargas; Dig Bala initially used a fixed ecliptic quarter-turn from the Ascendant; Kala Bala contains fixed values for some subcomponents; and Drik Bala uses simplified fixed aspect bands.

**Correction:** the UI now labels Shadbala as partial/approximate, explains the known limitations, and changes “Strong/Weak” to “Above/Below modeled threshold.” Cheshta Bala no longer invents a default daily motion for non-luminary planets: it uses an actual supplied speed or returns an unavailable result. The website passes through the Western chart's computed planetary speed when available.

**Dig Bala correction:** the engine now uses the chart-derived sidereal Midheaven for Sun/Mars, the opposite IC for Moon/Venus, the Descendant for Saturn and the Ascendant for Jupiter/Mercury. The Shadbala panel converts the Western tropical Midheaven into the Vedic sidereal frame using the chart's ayanamsa. Callers that do not supply a Midheaven retain a disclosed approximate quarter-turn fallback.

**Saptavargaja correction:** the engine now scores the seven individual vargas (D1, D2, D3, D7, D9, D12 and D30), derives each varga sign lord, combines natural and temporary friendship from the natal Rasi positions according to BPHS 3.55–58, and applies the BPHS Chapter 27 point scale from the R. Santhanam translation by default (45/30/20/15/10/4/2). The alternate Raman halving scale (45/30/22.5/15/7.5/3.75/1.875) is selectable explicitly. The current declared Moolatrikona policy awards the 45-point Moolatrikona bonus in D1 only; other Vargas use own-sign or compound-relationship scores.

**Independent worked-chart fixture:** `scripts/testShadbalaRamanReferenceSuite.ts` adds all seven planetary longitudes from Raman's Standard Horoscope (1942) and checks all seven Saptavargaja totals against the published recalculated dignity grid under both Raman's halving weights and the R. Santhanam BPHS weights (14 assertions). The source explicitly flags two disagreements between Raman's printed table and the recalculated D30/D7 cells; the fixture uses the source's corrected/recalculated grid and documents that choice, rather than copying the disputed cells.

**Next work:** continue comparing the remaining Bala components against independently worked classical example charts and edition-specific variants. Reimplement the remaining Bala components from their cited BPHS chapter/verse and selected translation, including local apparent time and planetary-hour lords, declination/Ayana, true motional kendra, and full Drishti-Pinda. Add independent worked-example fixtures before removing the partial label.

### Jaimini Karakamsa wiring in the Parashari chart pipeline

**Finding:** the stricter Jaimini Chara-Karaka validation correctly requires a sidereal Ascendant to derive the Karakamsa house, but the main `calculateVedicChart` adapter passed only the seven graha positions. Because the Ascendant is intentionally excluded from Chara-Karaka ranking, it was not present in that array and full Vedic chart generation failed.

**Correction:** the Vedic chart pipeline now passes `lagnaPlanet.siderealLongitude` explicitly as the second argument to `calculate7Karakas`. The graha list remains limited to the seven classical planets; no synthetic Ascendant is inserted into the karaka-ranking input.

**Regression coverage:** `scripts/testJaiminiVedicChartIntegrationSuite.ts` verifies the normal Vedic chart pipeline produces Karakamsa, checks that the D9 sign is derived from the Atmakaraka's sidereal longitude and that its house is measured from the sidereal Lagna, and confirms the direct Jaimini API still fails closed when its required Ascendant is omitted.

### KP house-system isolation

**Finding:** the KP cusp adapter previously converted `westernData.houses` directly to KP sidereal cusps. Because that array reflects the user's selected Western house system, a Whole Sign, Morinus, Meridian or other Western selection could inadvertently become the KP cusp framework.

**Correction:** `lib/kp/kpCusps.ts` now recalculates tropical Placidus from the Western chart's original Julian Day, latitude and longitude before applying KP ayanamsa. If Placidus is unavailable for the location/epoch, it throws an explicit error rather than misreporting another house system as KP. A backward-compatible path is retained only for a supplied chart already marked Placidus when its original birth geometry is absent. The former “last 3°20′ of sign” snap-to-next-sign correction has also been removed: KP sign, star and sub lords are now derived from the exact sidereal cusp longitude.

**Source basis:** the digitized `Astro Secrets & Krishnamurti Padhdhati, Part III` text (section “Principle of Sublords and Relevant Houses”, pp. 35–36 in that transcription) describes exact cusp positions, Placidus house beginnings and sign/star/sub assignment at the cusp point. The previous snap could alter the cusp's sign lord and star/sub and was not supported by the reviewed source passage.

**Regression coverage:** `scripts/testKPSystemSuite.ts` checks that KP cusps are invariant when the same birth chart is supplied with Western Placidus or Whole Sign settings; it also checks unsupported polar geometry, missing birth coordinates and preservation of a late-sign cusp without snapping.

### Tamil Peyar En transparency

**Finding:** the prior implementation reused `VEDIC_CHALDEAN_MAP`, stripped every non-A–Z character, and substituted a default total of 1 when no supported Latin letters remained. A Tamil-script name could therefore receive a fabricated name number.

**Correction:** the current method is explicitly labelled **Chaldean-Indian Latin A–Z mapping**. A supported Latin transliteration is calculated under that declared mapping. A Tamil-script or mixed-script name returns `null` with a visible explanation; birth-day and birth-date numbers remain available. No unverified Tamil-script letter table is fabricated.

**Regression coverage:** `scripts/testNumerologySuite.ts` now checks valid Latin transliteration, Tamil script and mixed-script names.

## Source ledger (initial evidence; keep edition-specific)

- **Western techniques and house methods:** see the [Western Astrology Master Scope Catalogue](western-astrology-master-scope-catalog.md). It distinguishes calculated house systems from a complete horary, electional or predictive method.
- **Parashari primary-text witness:** the [University of Pennsylvania OPenn catalogue entry for a Sanskrit Br̥hatpārāśarahorāśāstra manuscript](https://openn.library.upenn.edu/Data/0002/html/mscoll390_item1806.html) records an extant manuscript witness. A [BPHS Chapter 27 translation](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-27) gives the Saptavargaja weights as 45, 30, 20, 15, 10, 4 and 2 (verses 27.2–4). The [R. Santhanam translation's Chapter 3 friendship rules](https://archive.org/stream/brihatparasarahorashastrabyr.santhanam/Brihat%20Par%C4%81%C5%9Bara%20Hor%C4%81%20%C5%9Ah%C4%81stra%20By%20R.%20Santhanam_djvu.txt) describe natural, temporary and compound relationships (verses 3.55–58). A later source comparison documents the alternative Raman point scale and notes the Moolatrikona interpretation variant; Celestia therefore labels the selected default instead of blending those weights. A manuscript catalogue entry is not a complete critical edition; calculations must still name the actual text/translation and verse numbering used. A [digitized BPHS text](https://archive.org/stream/parashara_hora_shastra_202103/parashara_hora_shastra_djvu.txt) is useful for research but must be checked against the chosen edition. For D30, [BPHS Chapter 6, verse 27](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-6/verse-27/) gives the five planetary segment lords, their 5°/5°/8°/7°/5° extents and even-sign reversal; the [Parashara Jyotisha Course D30 reference](https://pjc2.parasarahora.in/varga/trimsa%E1%B9%81sa-d30/trimsa%E1%B9%81sa/) publishes the standard odd/even sign-destination table. The register labels this as the chart-destination convention rather than implying the verse itself explicitly lists every resulting rasi.
- **KP original-method material:** digitized [Krishnamurti Paddhati, Predictive Stellar Astrology, Reader III](https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/Krishnamurti-Padhdhati-Vol-3%20-%20English_djvu.txt) and [Astro Secrets & Krishnamurti Padhdhati, Part III](https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/Astro-secrets%20%26%20KP%20Part3_djvu.txt) contain star/sub, cuspal-sub-lord and Placidus cusp guidance, including a minute-precision emphasis. These are digitized transcriptions/reprints; final fixtures should be reconciled against the selected printed edition and independently captured reference tables.
- **Tamil numerology:** the [EnnKanitham calculation methodology](https://ennkanitham.com/methodology/) explicitly publishes Chaldean and Pythagorean Latin-letter tables and says its Tamil-letter value table is not included, asking for English transliteration instead. Its method page is a current practitioner implementation, not proof of an ancient lineage.
- **Tamil manuscript lead:** the [Endangered Archives Programme record for Eṇ Cuvaṭi](https://eap.bl.uk/archive-file/EAP1217-1-2328) catalogues an 18th-century Tamil palm-leaf manuscript described as containing Tamil numerology. The catalogue metadata alone does not establish its exact computational rules. The manuscript images and palaeographic/content reading are needed before implementing its method.
- **KP vs Parashari vs Western:** use the original source/edition for each method separately. A shared nakshatra or Vimshottari time period does not make the systems' judgement rules interchangeable.

## Delivery cadence: breadth without shallow implementation

Use a repeating, verifiable cycle rather than coding every system at once or spending months on one system while the rest becomes stale:

1. **One primary system slice:** choose one bounded method (for example, KP Placidus cusp isolation, Parashari D9 boundary tests, Western antiscia, BaZi solar-term boundary, or Chaldean compound-number rules). Research, implement and add independent tests.
2. **One parity slice:** review one other system's corresponding UI, provenance and test coverage so that app/website behaviour stays aligned.
3. **One integration slice:** run cross-system regression tests, verify no calculation rules leaked between systems, then ship a small documented commit.
4. **Rotate the primary system:** rotate Western, Parashari/Jaimini, KP, numerology, BaZi and other supported schools. Keep a backlog and test gate for every system.

This produces visible progress across the project while preserving enough focus to validate each calculation. A system is not marked complete because its tab exists or because another system's engine can supply a similar-looking value.

## Current completion language

Use these labels in the app and release notes:

- **Implemented (tested):** calculation, documented method, independent fixtures, edge handling, UI and export integration all pass.
- **Partial:** only some variants or workflows are implemented.
- **Approximate:** calculation uses a limited model and discloses its limits.
- **Symbolic:** a traditional point or interpretive construct is not a verified physical ephemeris body.
- **Not implemented:** no functioning end-to-end method exists.
- **Audit required:** code exists but its source, variant, correctness or references have not yet been established.

The aim is not to claim that every school has one universal correct form. The aim is to make Celestia's implemented methods explicit, independently testable, and faithful to the source conventions they declare.


### KP horary 1–2193: correct hierarchical subdivision and sign-edge splits

**Source distinction:** K.S. Krishnamurti's original horary table is the 1–249 sub-lord table. A scan titled *Krishnamurthi Padhathi (Part II): The Division of the Zodiac 27 Nakshatras in 249 Subs* explains that the underlying construction has 243 nakshatra/sub-lord intervals and that six of those intervals are split at sign edges, producing 249 sign-local entries. The 1–2193 sub-sub table is a later extension associated in KP reference literature with S.P. Khullar; it must not be attributed to KSK's original 1–249 table.

**Finding:** Celestia's previous `generate2193Table()` subdivided each of the 249 already sign-split rows into nine. This restarted the Vimshottari sub-sub proportions at each artificial sign fragment and produced 2,241 entries rather than 2,193.

**Correction:** the generator now starts with the 243 unsplit nakshatra/sub-lord intervals, subdivides each parent interval into nine sub-sub intervals using the same Vimshottari 120-year proportions, and then splits only the six child intervals that cross a 30° sign boundary. The output is exactly 2,187 + 6 = 2,193 contiguous, half-open, sign-local rows. A crossing child retains its original star, sub and sub-sub lords on both sides of the sign edge; the ratio is never restarted.

**Independent regression fixtures:** the public 1–2193 table published by AstroNeemo (1 August 2016) gives the initial Ketu/Ketu/Ketu division from 0°00′ to 0°02′43⅓″ and Ketu/Ketu/Venus through 0°10′30″. It also presents equivalent local subdivisions for Aries, Leo and Sagittarius as seed numbers 1, 732 and 1463. Its Aries/Taurus crossing at rows 192–193 preserves Sun/Rahu/Saturn across the exact 30° boundary. `scripts/testKPSystemSuite.ts` now checks these values, row count, seed continuity, sign-edge splitting, complete 0°–360° coverage, midpoint lord resolution and seed clamping. The original 1–249 table is separately asserted to remain 249 entries.

**Date interpolation correction:** the retained Celestia linear compatibility profile previously mixed equal twelfths of a year with a separate `day/365.25` term, so it did not return its stated epoch value exactly on 1 January 1900 and treated month lengths inconsistently. The date-only calculation now validates Gregorian dates and interpolates from the start of the calendar date using the actual 365/366-day year. This fixes arithmetic consistency only; it does not validate the legacy 22°22′14″ anchor against KSK's printed annual table or imply that the straight-line profile is the canonical KP ayanamsa. Regression checks cover the exact epoch, one-day and one-year increments, leap-day interpolation, and invalid dates.

**Ayanamsa remains a separate open issue:** the existing Celestia KP formula is not yet a source-verified universal KSK ayanamsa. Swiss Ephemeris documentation distinguishes at least two named KP-related modes: the table-derived `SE_SIDM_KRISHNAMURTI` (22°21′50″ at 1 January 1900, associated with the KSK table) and the `Krishnamurti/Senthilathiban` equinox-291 mode using a different precession basis. The documentation itself notes discrepancies between these modes and the historical table. Celestia must preserve named variants, cite their assumptions, and reconcile the original KSK annual table before replacing the existing default. No silent substitution has been made.

**Sources:** [KSK 249-subs table scan, *Krishnamurthi Padhathi (Part II)*](https://ftpmirror.your.org/pub/wikimedia/images/wikipedia/commons/9/95/KRISNAMUTHI_PADATHI_-_THE_249_SUB_LORDS.pdf); [AstroNeemo 1–2193 table, updated 1 August 2016](https://www.astroneemo.net/articles/vedic-basics-1-2193.html); [JyotishPortal discussion identifying S.P. Khullar's later 1–2193 extension](https://jyotishportal.com/KPTopicsdtl.aspx?q=122); [Astrodienst Swiss Ephemeris documentation](https://www.astro.com/swisseph/swephprg.htm), sidereal-mode notes and programmer interface; [K.S. Krishnamurti, *Krishnamurti Padhdhati*, Volume I digitized text](https://archive.org/stream/in.ernet.dli.2015.128044/2015.128044.Krishnamurti-Padhdhati-Vol-i_djvu.txt).

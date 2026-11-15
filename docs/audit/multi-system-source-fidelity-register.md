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
| Chinese BaZi / Four Pillars | `lib/astronomy/baziEngine.ts`; `lib/vedic/` is separate | Preserve solar-term year/month boundaries, day-boundary convention, local time basis, stem-branch rules, hidden stems, Ten Gods, luck pillars and school-specific conventions. Do not substitute Gregorian year or midnight rules without naming the selected profile. | Continue solar-term and historical timezone fixtures, day-boundary comparisons, hidden-stem/ten-god validation and luck-pillar direction/starting-age checks. |
| Other systems and extensions | `lib/astrology/`, plus future method-specific modules | Astrocartography, Uranian/Hamburg, Cosmobiology, harmonics, fixed stars, medical symbolism, numerology and future systems need their own provenance and unsupported-state policy. | Add a system only after its reference method, required inputs and independent expected outputs have been identified. |

## Findings and fixes from this audit cycle

### Parashari Shodashavarga boundary audit

**Correction:** `lib/vedic/divisionalCalc.ts` now rejects unknown varga IDs and non-finite longitudes instead of silently falling back to D1. Equal-width divisions use a sub-microarcsecond floating-point boundary tolerance so exact D7/D9/D45-style cusps are assigned to the following half-open subdivision consistently. D30 keeps its unequal odd/even segment tables and uses the same explicit boundary handling for sign and degree output.

**Regression coverage:** `scripts/testParashariVargaSuite.ts` checks the named rules and exact boundaries across all 16 configured Shodashavarga charts, degree mapping, and invalid-input rejection. This validates the implemented sign-assignment algorithms at the tested boundaries; it does not certify every Varga interpretation, dignity doctrine, or textual variant.

### Shadbala status correction

**Finding:** the Shadbala screen claimed a complete classical six-fold result, but the engine still used provisional/fixed values and simplified approximations for several components. In particular, Saptavargaja currently repeats one Rashi relationship across seven Vargas; Dig Bala uses a simplified ecliptic offset from the Ascendant; Kala Bala contains fixed values for some subcomponents; and Drik Bala uses simplified fixed aspect bands.

**Correction:** the UI now labels Shadbala as partial/approximate, explains the known limitations, and changes “Strong/Weak” to “Above/Below modeled threshold.” Cheshta Bala no longer invents a default daily motion for non-luminary planets: it uses an actual supplied speed or returns an unavailable result. The website passes through the Western chart's computed planetary speed when available.

**Next work:** reimplement each Bala from its cited BPHS chapter/verse and selected translation, including the seven individual Vargas, exact quadrant reference points, local apparent time and planetary-hour lords, declination/Ayana, true motional kendra, and full Drishti-Pinda. Add independent worked-example fixtures before removing the partial label.

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
- **Parashari primary-text witness:** the [University of Pennsylvania OPenn catalogue entry for a Sanskrit Br̥hatpārāśarahorāśāstra manuscript](https://openn.library.upenn.edu/Data/0002/html/mscoll390_item1806.html) records an extant manuscript witness. A manuscript catalogue entry is not a complete critical edition; calculations must still name the actual text/translation and verse numbering used. A [digitized BPHS text](https://archive.org/stream/parashara_hora_shastra_202103/parashara_hora_shastra_djvu.txt) is useful for research but must be checked against the chosen edition.
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

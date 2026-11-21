# Divisional-chart engine audit (PR #76)

Status: code audit only; this document does not certify the current D2–D60 outputs as classically validated.

## Scope inspected

- `lib/vedic/divisionalCalc.ts`
- `lib/vedic/d9NavamsaEngine.ts`
- `scripts/testAstrologySuite.ts`

The current generic divisional calculator exposes D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60. The existing regression suite has broad D9 mapping coverage, but it does not currently contain equivalent independent rule-and-boundary fixtures for the other Vargas.

## Confirmed implementation risks

### 1. Equal-part varga degree arithmetic is valid, but its convention must be explicit

The displayed equal-part varga degree is currently calculated as:

```ts
const degInSign = (p.siderealLongitude * config.harmonic) % 30;
```

For an integer harmonic and a longitude expressed in degrees, this is mathematically equivalent modulo 30 to multiplying only the natal degree within the sign: the omitted sign offset is an integer multiple of 30 after multiplication. It is therefore not correct to describe the use of absolute longitude as an inherent arithmetic defect. For equal-part Vargas, this is the conventional thirtyfold/folded degree coordinate, subject to floating-point and longitude-normalization handling.

D30 is a special case in sign assignment because its five intervals are unequal. The generic harmonic degree display is a thirtyfold coordinate, not a normalized position through the unequal D30 interval. The UI and documentation must not imply that it is the local percentage through the D30 segment.

The ascendant display currently reports only the floored natal-sign degree. That is a precision/display limitation, not evidence that the divisional sign assignment is wrong.

Action: document the degree-coordinate convention clearly, add independent tests for representative equal-part Vargas and D30 boundaries, and keep the D30 sign lookup separate from equal-part segment indexing.

### 2. D30 has unequal intervals and a confirmed odd-sign mapping defect

The sign assignment code uses the traditional unequal Trimsamsa intervals (5/5/8/7/5 degrees for odd signs and 5/7/8/5/5 for even signs). It must not be replaced by a generic equal-part harmonic lookup.

A concrete defect was found in the odd-sign 25°–30° interval: Venus's odd-sign Trimsamsa is Libra (sign index 6), but the implementation returned Taurus (index 1), which is the even-sign Venus result. This has now been corrected in the code; boundary regression tests are being added.

D30's `harmonic: 30` metadata describes the traditional thirtyfold degree display only. It does not mean the sign assignment uses thirty equal one-degree intervals.

### 3. Unknown division identifiers silently fall back to D1

`calculateDivisionalSignIndex` returns the natal sign for an unrecognized code, while `calculateDivisionalChart` also falls back to D1 configuration but retains the caller's unknown `divisionCode` in its result. This can produce a plausible-looking but mislabeled chart.

Action: reject unknown division codes explicitly and test that rejection.

### 4. Longitude validation is missing in the generic varga API

The generic normalizer does not reject NaN or infinities. The D9-specific engine now rejects non-finite input, but that guard does not protect `calculateDivisionalSignIndex` or `calculateDivisionalChart`.

Action: validate finite longitude and valid latitude-independent chart inputs at the public generic API boundary; add NaN and ±Infinity tests.

### 5. Dignity and strength metadata overstates what is calculated

The generic calculator assigns a small set of fixed sign-based labels and does not calculate complete natural, temporary or compound friendship, Shadbala, or a source-selectable dignity policy. Its `Friendly` label and the `Vaisheshikamsa` ranking should not be presented as comprehensive classical strength calculations. The D9-specific engine also contains heuristic numeric strength, marriage-compatibility, and interpretation outputs; those are not objective probabilities or validated measures.

Action: label these as limited heuristic indicators or suppress them until a documented, selectable calculation policy and independent fixtures exist. Keep dignity calculation separate from divisional sign placement.

### 6. D9 and Jaimini-derived interpretations need independent readiness gates

D9 sign assignment now has 108 mapping tests, but that does not validate Pushkara Navamsa tradition choices, all dignity conventions, D9 yogas, marriage timing, or partner-character claims. Jaimini Karakamsa and Ishta Devata calculations must use the selected Chara Karaka policy and cited rule set; they must not silently inherit one universal school.

Action: retain specialist-review gates for unverified interpretation features. Distinguish calculation-ready, interpretation-limited, and not-implemented capabilities.

## Varga-by-varga verification plan

Each division must have its own rule reference, selectable convention where traditions differ, segment-boundary tests, just-before/exact/just-after fixtures, all 12 natal signs, degree-within-varga tests, ascendant tests, and independent reference fixtures before being marked verified.

| Varga | Required rule checks before certification |
|---|---|
| D2 Hora | Odd/even sign halves and the exact selected Hora tradition; test 15° boundary |
| D3 Drekkana | Same/5th/9th sign mapping; 10° and 20° boundaries |
| D4 Chaturthamsa | Four 7°30′ segments and start-sign convention |
| D7 Saptamsa | Odd/even start rule; all seven 30/7 segments |
| D9 Navamsa | 3°20′ segments and movable/fixed/dual starts; 108 mappings |
| D10 Dasamsa | Odd/even start rule; all ten 3° segments |
| D12 Dwadasamsa | Twelve 2°30′ segments and sequential sign mapping |
| D16 Shodashamsa | Modality start rule and all sixteen 1°52′30″ segments |
| D20 Vimsamsa | Modality start rule and all twenty 1°30′ segments |
| D24 Chaturvimsamsa | Odd/even start rule and all twenty-four 1°15′ segments |
| D27 Saptavimsamsa | Elemental start rule and all twenty-seven segments |
| D30 Trimsamsa | Unequal odd/even intervals; do not use equal 1° segments |
| D40 Khavedamsa | Odd/even start rule and all forty 45′ segments |
| D45 Akshavedamsa | Modality start rule and all forty-five 40′ segments |
| D60 Shashtiamsa | Explicitly select occupied-sign or Aries count; test all sixty 30′ parts; reverse deity-name order in even signs; document birth-time sensitivity |

## Safe implementation order

1. Preserve and verify the D9 boundary fix.
2. Add strict input and division-code validation to the generic API.
3. Return a segment index and segment-local degree from one authoritative per-varga calculation.
4. Correct D30's segment-local degree separately.
5. Add independent fixtures for D3, D4, D7 and D10 before exposing their verified status.
6. Implement or certify remaining Vargas one at a time, with source and convention metadata.
7. Revisit dignity, strength, yogas and interpretive copy only after placement calculations are independently validated.

## Non-claims

This audit does not claim that every current sign-mapping formula is wrong. It identifies concrete API/metadata defects and missing verification. It also does not establish one universally accepted rule for every disputed varga convention. Primary textual editions, reputable commentaries, and independent calculation fixtures are still required before certification.

## Additional source-backed mapping review: D2, D12, D16 and D20

The existing sign-assignment branches for these four Vargas match the rules transcribed from BPHS Chapter 6 in the cited source texts:

- **D2 Hora (6.5–6):** the two 15° halves are assigned to Sun and Moon Horas. In the Parashara mapping used here, the Sun Hora is represented by Leo and the Moon Hora by Cancer; odd signs take Sun then Moon, while even signs reverse the order. This is a specific Parashara Hora convention, not a claim that every Hora school uses the same chart construction.
- **D12 Dwadasamsa (6.15):** twelve consecutive 2°30′ divisions begin from the natal sign and proceed zodiacally.
- **D16 Shodasamsa (6.16):** sixteen 1°52′30″ divisions proceed from Aries for movable signs, Leo for fixed signs, and Sagittarius for dual signs.
- **D20 Vimshamsa (6.17–21):** twenty 1°30′ divisions proceed from Aries for movable signs, Sagittarius for fixed signs, and Leo for dual signs.

The implementation already matched these sign-placement rules, so this phase adds independent fixtures rather than changing the production mapping formulas. The new fixtures cover all 12 natal signs, every segment midpoint, each exact segment start, and a point immediately before every internal boundary (1,752 checks across D2/D12/D16/D20).

Sources consulted:
- [BPHS Chapter 6, English translation (Jyotish Vidya)](http://jyotishvidya.com/ch6.htm) — verses on Hora, Dvadasamsa, Shodasamsa and Vimshamsa.
- [BPHS Chapter 6 Sanskrit text and verse divisions](https://astrologicalharsh.com/classics/bphs/chapter-6/) — useful for checking the underlying Sanskrit verses; the page itself notes that proof-reading against a printed edition remains incomplete and OCR/typing variants are possible.
- [BPHS 6.15 Sanskrit and explanation](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-6/verse-15) — cross-check for D12's count from the respective natal sign. The page explicitly cautions that its Sanskrit-only explanation may contain errors.

These are source-backed implementation fixtures, not independent ephemeris/chart-output certification. Translation, recension and lineage differences remain possible and should be selectable/documented where relevant.

## Regression harness correction

A structural issue was found while extending the suite: Categories 23 and 24 had been appended after the old summary and failure-exit block. Their assertions executed, but were not included in the printed totals or the final non-zero exit decision. The summary and failure gate have now been moved to the end of the test file so all varga assertions are counted and can fail CI. Earlier workflow success therefore validated the build pipeline but did **not** prove those post-summary fixtures were gating CI. Re-run the full workflow after this harness correction before treating the expanded varga suite as CI-verified.

## Higher-varga mapping review: D24, D27, D40 and D45

The current code's sign-start formulas were compared with BPHS Chapter 6 verses 22–26 and 29–32, using the Sanskrit/English verse presentation and a separate Santhanam-based transcription summary.

- **D24 Chaturvimshamsa (6.22–23):** 24 equal parts of 1°15′. Odd signs start from Leo; even signs start from Cancer. The verse describes the deities and reverse order for even signs; the sign-start rule is explicit.
- **D27 Saptavimshamsa / Bhamsa (6.24–26):** 27 equal parts of 1°06′40″. The text names the nakshatra deities and says the sequence is reckoned from Aries and the movable signs. A common implementation interprets this as elemental starts: fire signs from Aries, earth from Cancer, air from Libra, water from Capricorn. The text does not spell out that four-element mapping in the same explicit way as D24/D40, so Celestia's current elemental mapping is tested as a **documented interpretive convention**, not a universally settled literal reading.
- **D40 Khavedamsa (6.29–30):** 40 equal parts of 45′. Odd signs start from Aries; even signs from Libra.
- **D45 Akshavedamsa (6.31–32):** 45 equal parts of 40′. Movable signs start from Aries, fixed signs from Leo, and dual signs from Sagittarius.

The production sign-mapping formulas already match these selected rules; this batch adds exhaustive mapping fixtures rather than changing formulas. Fixtures cover all 12 natal signs, all segment midpoints, exact segment starts, and positions immediately before internal boundaries (4,284 checks across D24/D27/D40/D45).

Sources:
- [BPHS Chapter 6 — Sanskrit verses and English translation](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-6) — see verses 6.22–6.32. The page presents its own English translation from Sanskrit; it should still be compared with printed editions/commentaries before making claims of universal textual consensus.
- [Parashara and Jaimini classical corpus notes](https://jatakaveda.com/library/parashara-jaimini/) — a secondary source explicitly distinguishes the D27 elemental mapping as an interpretation of the wording, rather than a fully spelled-out rule in the e-text transcription.

These tests validate the selected sign assignment and segment boundaries only. They do not validate interpretive claims, divisional degree display, dignity, varga strength, or the full chart's independent agreement with a trusted reference implementation.

## D60 sign-count convention correction

The previous D60 implementation used the natal sign as the start for odd signs and the seventh sign for even signs. This mixed the even-sign reversal of the sixty-part **deity-name sequence** (BPHS 6.40) into the **D60 sign calculation** (BPHS 6.33). The reviewed sources do not support that seventh-sign offset as the general D60 sign formula.

Two sign-counting readings are documented:

1. **From occupied sign** (default): take the half-degree part index p = floor(2 × d), where d is the longitude within the natal sign, then place it at sign index (rasiIndex + (p mod 12)) mod 12. This is the convention attributed to P.V.R. Narasimha Rao and used by Jagannatha Hora's page.
2. **From Aries** (explicit alternative): use (p mod 12) as the sign index. This is the literal Aries-count reading reported for BPHS 6.33 by the same software documentation and is also consistent with a literal translation that says the remainder plus one indicates the sign.

The generic sign calculator and full chart calculator now accept an options.d60SignConvention setting ("from-sign" or "from-aries"). The default is "from-sign"; callers can select "from-aries" when following that reading. Neither is described as universally accepted. The old even-sign seventh-sign offset has been removed.

The new D60 fixtures exercise both conventions across all 12 natal signs and all 60 half-degree parts, checking midpoints, exact starts and just-before-boundary positions. They also explicitly guard against the old Taurus-at-0° → Scorpio result.

Sources:
- [BPHS Chapter 6, verse 33 — Sanskrit, transliteration and word meanings](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-6/verse-33/) — explains doubling degrees within the sign, division by 12 and remainder plus one.
- [Jagannatha Hora — D60 computation and convention discussion](https://jagannathahora.com/shashtiamsa) — explicitly documents the occupied-sign convention and the alternative literal Aries reading.
- [SIA Vigyan — BPHS D60 verse and rendering](https://siavigyan.com/learn/varga/d60-shashtiamsha) — provides the Sanskrit verse and its occupied-sign rendering.

The earlier sign-only limitation was superseded by the named-amsa implementation documented below. The current calculator returns a selected BPHS-derived amsa name and a separately sourced Saumya/Krura nature classification from Phaladeepika 3.5. It still lacks a source-profile selector and independent reference-chart certification; do not present the selected text profile as universal recension consensus.



## D60 named amsa and nature metadata (implementation update)

The D60 calculator now exposes the degree-ordered half-degree segment, the selected BPHS amsa name, and its separately sourced Saumya/Krura nature for the ascendant and each planet.

- **Name sequence:** the implementation uses a 60-entry BPHS-recompiled list based on Chapter 6.34–40. Odd signs use the listed order; even signs reverse it, following BPHS 6.40.
- **Nature sequence:** the implementation uses the 24 odd-sign Krura ordinals in **Phaladeepika 3.5**: 1, 2, 8, 9, 10, 11, 12, 15, 16, 30, 31, 32, 33, 34, 35, 39, 40, 42, 43, 44, 48, 51, 52 and 59. The other 36 are Saumya. Phaladeepika explicitly reverses this classification in even signs. This is not a list supplied by BPHS 6.41; BPHS 6.41 states the general effect of benefic and malefic amsas.
- **Source separation:** returned metadata identifies `nameSource: "BPHS 6.34-40"` and `natureSource: "Phaladeepika 3.5"`. The UI and downstream interpretations must preserve that distinction.
- **Textual variants:** transliterations and recensions differ. Examples include Kulanasa/Kulanasha and the treatment of Mukhya around the 41st–42nd amsas; Bhramana/Brahmana at the end; and Dandayudha/Dhannayudha. The implementation selects one documented BPHS-recompiled 60-entry sequence for deterministic computation, but it does not claim every printed edition agrees. A future source-profile selector should be added before claiming universal textual consensus.
- **D60 significance:** the previous “past life karma, root cause & micro-destiny” label was too specific. BPHS 7.6–8 groups D45 and D60 under “all indications”; the metadata now reflects that broader instruction.
- **Birth-time sensitivity:** each D60 part spans 0.5° of the natal sign. The ascendant can therefore change amsa with small birth-time errors, but the minutes-per-part vary with latitude and the rising sign. Celestia must not use a universal “two minutes” guarantee. A future uncertainty feature should recompute the ascendant over the user's stated birth-time interval and report all possible D60 placements; that interval propagation is not implemented by this metadata helper.

Sources:
- [BPHS Chapter 6 Sanskrit text, verses 6.33–41](https://sa.wikisource.org/wiki/बृहत्पाराशरहोराशास्त्रम्/अध्यायः_६_(षोडशवर्गाध्यायः)) — primary Sanskrit verse sequence and names.
- [BPHS 6.31–35 translation](https://www.siva.sh/brihat-parashara-hora-shastra/6/31-35) and [BPHS 6.36–40 translation](https://www.siva.sh/brihat-parashara-hora-shastra/6/36-40) — English rendering and name order.
- [Phaladeepika 3.5](https://www.siva.sh/phaladeepika/3/5) — odd-sign Krura ordinals and reversal for even signs.
- [Phaladeepika, V. Subrahmanya Sastri 1950 edition, Chapter 3](https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621575.html) — independent printed-edition transcription and translation; OCR page should be checked against scan where exact typography matters.
- [BPHS Chapter 7, verses 7.6–8](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-7) — D45/D60 “all indications” scope and the role of the Shashtiamsa lord.

Verification added: Category 28 checks all 60 segments across all 12 natal signs (720 combinations), odd/even reversal, Phaladeepika nature assignment, the half-degree boundary and invalid input. These are deterministic rule fixtures, not independent reference-chart certification.


## D60 floating-point boundary consistency (2026-11-21)

The D60 sign branch now reuses `equalDivisionPart(degInRasi, 60)`, the same numeric boundary helper used by the other equal-part vargas and by the D60 amsa-detail calculation. Previously the sign branch used a direct `Math.floor(degInRasi / 0.5)`, while the name/nature helper applied a small ULP tolerance. A longitude produced a few representable floating-point steps below an exact half-degree could therefore yield different sign-part and named-amsa results.

The helper's tolerance is `1e-10` of a segment index (about `5e-11°` for D60). This is a numerical policy for roundoff near an exact boundary, not a classical textual rule. Category 27.3 checks a one-ULP-before boundary input under both sign conventions and confirms that a point `1e-7°` before the same boundary remains in the preceding segment. The existing full sweep still checks both conventions over all 12 natal signs and 60 parts.

Source context for the sign-count disagreement remains unchanged: BPHS 6.33 supplies the half-degree arithmetic, but translations and software lineages differ on whether the remainder count is from the occupied sign or Aries. The Sanskrit transcription is primary-text evidence, not a critical-edition collation. VedicPupil's rendering explicitly says “from that planet's sign” but self-disclaims possible translation error; it is recorded as a secondary rendering, not as a final philological ruling.

Additional source: [BPHS 6.33 Sanskrit and word-level rendering (VedicPupil)](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-6/verse-33) — records the occupied-sign wording while noting its own translation may be wrong.

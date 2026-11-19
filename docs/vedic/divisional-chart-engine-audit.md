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
| D60 Shashtiamsa | Odd/even start rule and all sixty 30′ segments; document birth-time sensitivity |

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


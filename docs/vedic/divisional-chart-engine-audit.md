# Divisional-chart engine audit (PR #76)

Status: code audit only; this document does not certify the current D2–D60 outputs as classically validated.

## Scope inspected

- `lib/vedic/divisionalCalc.ts`
- `lib/vedic/d9NavamsaEngine.ts`
- `scripts/testAstrologySuite.ts`

The current generic divisional calculator exposes D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60. The existing regression suite has broad D9 mapping coverage, but it does not currently contain equivalent independent rule-and-boundary fixtures for the other Vargas.

## Confirmed implementation risks

### 1. Divisional degree is not calculated from the segment-local position

In `calculateDivisionalChart`, the displayed degree is currently:

```ts
const degInSign = (p.siderealLongitude * config.harmonic) % 30;
```

This multiplies the absolute sidereal longitude. Divisional degree should instead be derived from the planet's degree within its natal sign and its position within the selected varga segment, with the exact convention documented per varga. The current expression can therefore display a degree unrelated to the segment-local coordinate. The ascendant output is even coarser: it reports only the floored natal-sign degree.

Action: replace this with a shared, tested segment-coordinate result returned alongside the divisional sign calculation. Do not use a generic harmonic shortcut for unequal or convention-specific divisions.

### 2. D30 cannot be treated as an ordinary equal-part harmonic

The sign assignment code correctly uses unequal traditional Trimsamsa intervals (5/5/8/7/5 degrees for odd signs and 5/7/8/5/5 for even signs). However, the generic `harmonic: 30` metadata and degree-display formula do not represent those unequal segments. D30 needs its own segment boundaries and local-degree calculation.

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

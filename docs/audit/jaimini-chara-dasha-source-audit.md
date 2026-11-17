# Jaimini Chara Dasha source-fidelity audit

**Review date:** 17 November 2026  
**Branch:** `deploy/cloudflare-workers-free`  
**Status:** BPHS/Santhanam profile implemented in code; initial regression suite passes. Full repository integration and source-lineage reconciliation remain in progress.  
**Scope:** `CharaDashaCalculator` in `lib/vedic/completeDashaSystems.ts`.

## Executive finding

The current implementation labels its output as Jaimini Chara Dasha, but its sequence direction and sign-duration calculations do not consistently follow the cited classical source rules. It must not be promoted as source-faithful until the rules are separated into a named lineage profile and independently benchmarked.

This is a code-inspection finding, not a claim that one modern lineage owns the only valid Chara Dasha.

## 1. Current implementation defects

The present implementation has these behaviors:

1. `calculateCharaDasha` chooses forward/reverse sequence from the parity of the Ascendant sign itself. It does not inspect the ninth sign from the Ascendant before choosing the sequence direction.
2. `calculateSignYears` finds the ninth sign from each running sign, then counts to that ninth sign or to the location of the ninth sign's lord. The cited BPHS/Jaimini sign-duration rule instead counts from the Dasha sign to the sign occupied by that sign's lord, with additional dual-lord and dignity/strength rules.
3. `countSignsBetween` stops once the count exceeds nine and clips the result to nine. The cited sign-to-lord rule can reach the twelfth sign; own-sign placement is a special full-cycle case in the documented readings. A hard nine-year cap therefore suppresses valid source-rule results.
4. Unknown Ascendant sign silently becomes Aries (index zero), manufacturing a plausible full sequence rather than rejecting malformed input.
5. The input `planetsInSigns` is an unvalidated string map. It does not establish uniqueness, valid sign keys, valid planet names, or an explicit Scorpio/Aquarius co-lord policy.
6. The implementation's sign-year rule does not model source-specific dual-lord adjudication for Scorpio and Aquarius, including occupancy, number of planets, sign modality, exaltation and other lineage-dependent criteria.

## 2. Source comparison and variant boundaries

### BPHS sign-duration and sequence material

The BPHS Chara Dasha section is commonly printed as Chapter 46, verses 155–167 in the Santhanam edition. The relevant source summary is:

- 46.155–157: the sequence begins from Lagna; sign durations are counted from the Dasha sign to its lord.
- 46.158–166: special handling for Scorpio and Aquarius, whose lords are not singular in the standard scheme; source-specific strength and dignity tests must be preserved in their stated order.
- 46.167: sequence direction is decided by the ninth sign from Lagna and its odd/even pada grouping, not merely by the parity of Lagna itself.

Source index and transcription: [Jatakaveda — Parashara and Jaimini, Chara Dasha source notes](https://jatakaveda.com/library/parashara-jaimini/). This page links the Santhanam scan and separates BPHS verses from the Jaimini Sutra commentary.

### Jaimini Sutras

B. Suryanarain Rao's translation/revision by B. V. Raman, *Jaimini Sutras*, fifth edition (1955), includes the sign-to-lord year rule and associated commentary. The text and notes must be read together; commentary introduces interpretive choices that should not be silently presented as the bare sutra.

- [Internet Archive text: Jaimini Sutras, Suryanarain Rao / Raman](https://archive.org/stream/Astrology_Books_by_B_Suryanarayana_Row/Jaimini%20Sutras%20-%20B%20Suryanarain%20Rao%201955_djvu.txt)
- [Jaimini Upadesha Sutras, Chara Dasha reference and commentary discussion](https://docs.rs/vedaksha/latest/vedaksha/prelude/dasha/chara/index.html)

The latter records a material commentary issue: the direction rule is associated with the ninth sign from Lagna in one widely transmitted reading, while another named reading interprets the sutra differently. That is a reason to expose a named profile and cite its commentary, not to claim unanimity.

## 3. Seven/eight Chara Karaka policy is a separate issue

Do not conflate the 7/8 Chara Karaka selection with Chara Dasha duration. They are distinct calculations. The 7-Karaka and 8-Karaka variants already have separate engine methods and direct regression tests. Their differences do not justify using an arbitrary nine-year cap in Chara Dasha.

A useful primary-text comparison is the 1955 Rao/Raman Jaimini Sutras transcription above. For the Parashari interpretation of seven/eight portfolios and Rahu's role, see [P. V. R. Narasimha Rao, *Parasara's Teachings on Chara Karakas*](https://www.vedicastrologer.org/articles/c_karaka.pdf). This is the author's explicitly independent interpretation, not a critical edition.

## 4. Required replacement contract

Before the Chara Dasha engine is re-enabled as source-faithful, implement and test a named profile with:

1. Explicit source/edition/commentary ID and direction interpretation.
2. Validated Lagna sign/longitude and validated planet-to-sign occupancy input. No Aries fallback.
3. Sequence direction derived from the selected source's rule (including the ninth-sign pada interpretation where that profile uses it).
4. Sign duration counted from each Dasha sign to the appropriate sign lord under the selected direction/convention, not to the ninth sign's lord.
5. Explicit Scorpio and Aquarius dual-lord decision tree with ordered tests and named handling of Rahu/Ketu.
6. Explicit exaltation/debilitation adjustments only where the selected source states them.
7. No arbitrary nine-year cap; test the valid 1–12 range and own-sign special case.
8. Exact boundary tests for every sign, wraparound, lord in own sign, lord in 2nd/12th, both co-lords in one sign, one co-lord at home, neither at home, occupancy ties, modality ties, exalted/debilitated lord and unresolved ties.
9. Dated end-to-end fixtures from a published worked example, with every intermediate choice and period boundary shown.
10. UI, saved profile, API, PDF and offline output must carry the same profile ID and period start/end convention.

## 5. Current disposition

- **Do not claim Chara Dasha complete.**
- Do not silently replace this method with a different modern lineage.
- Keep the issue open until a profile's source decision tree is implemented and independently reconciled.
- The existing output should be labeled provisional/legacy in the UI until the replacement and acceptance suite are ready.

## 6. Next work

Implement a BPHS/Santhanam profile and a separately named Jaimini/Rao-Raman profile only after the two direction and dual-lord decision trees have been transcribed and compared. Do not merge their exceptions into a single undocumented hybrid.


## Implementation status — 17 November 2026

The runtime now contains a named BPHS/Santhanam base profile, `bphs-santhanam-1984`, with these behaviors:

- Sequence direction starts at Lagna and uses the three-sign pada group of the ninth sign (BPHS 46.167).
- Individual sign years count from the Dasha sign to its own lord using that sign's three-sign pada direction (BPHS 46.155–156); inclusive counts are not capped at nine.
- Scorpio/Ketu-Mars and Aquarius/Saturn-Rahu are resolved using the two-lord clauses in vv.158–164. The implementation orders companion occupancy, modality (dual > fixed > movable), co-lord exaltation, then larger count. This is an explicit implementation reading, not a claim that every commentary orders the tests identically.
- Verse 165 dignity corrections are exposed as `baseYears` and `adjustmentYears`. Classical seven-planet dignity tables are used; node dignity is not assumed.
- All nine classical grahas are required once. Celestia's `NorthNode`/`SouthNode` names are normalized to Rahu/Ketu; outer planets and other points are excluded.
- Both Chara Mahadasha output and Level 1 in the five-level view use the same generated periods. The five-level lower sub-period order is still provisional pending a separately sourced lineage specification.

The dedicated source regression suite is `scripts/testJaiminiCharaDashaSourceSuite.ts`. The full type/build/test matrix still needs a clean post-integration pass before deployment.

## Remaining gaps

- Rao/Raman profile and its Sutra 27 / own-sign commentary.
- Independently reconciled published worked-chart benchmark.
- Chara Antardasha and lower-level order, second 12-sign cycle and related boundary rules.
- Surface the chosen profile and direction metadata in all Chara reports.

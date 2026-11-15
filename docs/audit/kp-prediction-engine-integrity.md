# KP prediction and ruling-planet integrity audit

Date: 2026-11-15

## Corrections made

### Event prediction fails closed

`lib/kp/kpPredictionEngine.ts` previously:
- substituted the House 1 event rule for an invalid house number;
- substituted the first chart planet when the cusp sub-lord was absent;
- manufactured a fallback CSL signification in House 1 when the CSL could not be resolved;
- defaulted missing Mahadasha and Antardasha inputs to Jupiter and Venus.

The predictor now validates the house number, twelve finite cusp longitudes, twelve cusp sign lords, twelve cusp records, the CSL planet and its star/sub lords, and explicit Mahadasha/Antardasha chart members. It throws a descriptive error when required inputs are missing. It does not convert missing chart data into a positive or negative prediction.

The rule-weighted score remains a display heuristic, not a calibrated probability or an empirical prediction accuracy measure. The existing event-house combinations remain a separate source-review task and are not certified as a universal KP rule set by this correction.

### Period-lord integrity

`lib/kp/kpEngine.ts` previously substituted Jupiter/Venus when the Vedic chart did not supply current Mahadasha/Antardasha, and always assigned Sun as the current Pratyantardasha. The Vedic chart contract already supplies Mahadasha and Antardasha, so the first two are now passed through directly. The fabricated Pratyantardasha is no longer emitted. A Pratyantardasha will remain unavailable until a dated, validated sub-period calculation is connected.

### Ruling-planet preference order

The ruling-planet list now follows the five-ruler preference sequence described in KP Reader VI, p. 138: Ascendant star lord, Ascendant sign lord, Moon star lord, Moon sign lord, and day lord. A regression fixture checks this exact ordered result and rejects missing Moon or invalid date data.

**Remaining limitation:** the current day lord is still derived from the UTC civil weekday. KP source descriptions use a local sunrise-to-sunrise day boundary. Correct implementation therefore still requires the birth/judgment location, local date/time conversion, and a validated local sunrise calculation. The current value must not be described as a fully sunrise-correct KP day lord. Optional node representation, retrograde-star exclusion, conjunction/aspect refinements, and query-time ruling planets also remain separate work.

## Source distinction and scope

- The classical KP house significator hierarchy is the four grades: planets in the stars of house occupants; occupants; planets in the stars of house owners; and the house owner. See the digitized *KP Astrology Basics* transcription: https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/KP-Astrology-Basics_djvu.txt
- The planet-level four-fold strength sequence is separately described in *Astro Secrets and Krishnamurti Padhdhati*, Part I, pp. 12–14 in the digitized transcription: the star lord's occupied/owned houses precede the planet's own occupied/owned houses, with conditions tied to planets tenanting the planet's stars. https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/Astro-secrets%20%26%20KP%20Part1_djvu.txt
- The later Sunil Gondhalekar 4-Step method is not the same thing as the classical four-grade house-significator table. `KPFourStepEngine` now separately reports primary and secondary houses for Steps 1/3 using Positional Status and empty-house rules, and for Steps 2/4 using the star-lord principal rule. Practitioner lesson notes describing these conditions: https://kpastrology.astrosage.com/kp-learning-home/related-systems/four-step-theory
- KP Reader VI's five-ruler preference order is represented in the searchable digitized *KP Simple Rules* material: https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/KP-Simple-Rules_djvu.txt. The specific page reference p. 138 is also cited by a secondary explanatory source; the edition and pagination should be verified against a physical/scan copy before treating that secondary page citation as a critical-edition reference: https://vedik.com.br/en/blog/ruling-planets-astrologia-vedica-timing

These transcriptions and teaching notes are research witnesses, not a critical edition. Keep the implementation variant-labelled and preserve any disagreements between KP lineages instead of blending their rules.

## Classical planet-level A–D strength

The KP planet-signification engine now exposes the four distinct house sets rather than only one merged set:

- **A:** house occupied by the planet's star lord
- **B:** house occupied by the planet itself
- **C:** houses owned by the planet's star lord
- **D:** houses owned by the planet itself

It also records other planets tenanting the planet's stars. When there are no other tenants, `strengthOrder` is B → A → D → C (self-strength); otherwise it is A → B → C → D. This is the planet-to-house hierarchy and is not the same matrix as the house-to-planet Grades I–IV, even though both use four ordered levels.

The UI now prints A/B/C/D separately for each planet in the KP Planets tab. The legacy `signifiedHouses` set is retained for compatibility; the current prediction scoring still uses this union, not a complete grade-weighted selection algorithm. Node representation and conjunction/aspect agency need a separately sourced implementation before Rahu/Ketu are treated as fully resolved by this grade table.

Research witness: the digitized *KP Astrology Basics* material, Sections 11.3 and 12, describes the A/B/C/D sequence and the B-A-D-C self-strength order: https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/KP-Astrology-Basics_djvu.txt. This is a teaching transcription rather than a critical edition; preserve its lineage label in the app.

## Gondhalekar primary / secondary strength

The engine now keeps the four steps distinct and exposes `primaryHouses` and `secondaryHouses` on each `KPStepDetail` rather than presenting every connection as equally strong. It preserves a primary occupied-house result when that same house is also owned; the ownership rule must not demote the residence rule.

- **Steps 1 and 3 (planet / sub-lord):** a planet with Positional Status is primary for its occupied house; otherwise it is secondary. Owned houses are primary only when the planet has Positional Status and the owned house is empty. Owned houses of a planet without Positional Status remain secondary even when empty.
- **Steps 2 and 4 (star lord / sub's star lord):** the star lord is principal for its occupied house; its owned houses are primary only when empty, with occupied owned houses secondary.
- A planet in its own star retains Positional Status even when other planets tenant that star. The engine therefore does not turn that case into a secondary placement.
- The existing combined `allHouses` field is retained for compatibility. The current 4-Step verdict and CIL verdict still aggregate that union; they have **not** yet been upgraded to a fully sourced primary/secondary adjudication model. Conjunction within 3°20′, complete node-agent rules, and retrograde filters remain unimplemented. The panel now displays the primary and secondary sets separately.

This implements the practitioner lesson's stated strength distinctions, but does not certify the lesson as an original KSK primary text or as the only Gondhalekar lineage variant.

## Regression coverage added

`scripts/testKPSystemSuite.ts` now checks:
- the four-step invalid-target-house validation independently of missing planet-chain data;
- invalid KP prediction house rejection;
- rejection of an unresolved CSL planet rather than synthetic House 1 signification;
- the five ruling planets in the prescribed preference order;
- missing Moon and invalid date rejection;
- own-star Positional Status despite star tenants;
- primary occupied-house and empty-owned-house classification;
- secondary owned-house classification when a house is occupied;
- star-lord Step 2/4 principal vs secondary ownership classification;
- the classical planet-level A/B/C/D occupied-house and ownership levels;
- standard A-B-C-D vs tenantless B-A-D-C strength preference;
- distinction between classical self-strength and the modern own-star Gondhalekar PS override.

The latest verification result must be read from GitHub Actions for the commit under test. A successful Cloudflare deploy does not replace the verification gate.

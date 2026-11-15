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

## KP body integration and lunar-node convention

The chart bridge now maps the Western engine's `NorthNode` to KP `Rahu` and `SouthNode` to KP `Ketu`. The upstream astronomy calculation explicitly uses **mean Rahu** with Ketu exactly opposite; the KP chart records this as `nodeConvention: "mean"`. A true-node option is not currently exposed.

The bridge now runs Western points through `filterCalculationReadyPoints` before converting them into KP planets. This removes Chiron's explicitly marked illustrative, unvalidated sine-formula position instead of assigning it KP star/sub lords and significations. The KP body profile is now recorded as `extended-twelve`: seven classical planets, Rahu/Ketu, Uranus, Neptune and Pluto. A selectable classical-nine-only profile is not yet available.

Mapping the node names makes the existing modern 4-Step engine's Rahu/Ketu Positional Status and sign-lord representation paths reachable. The classical planet-level A–D significator matrix still does not fully model node agency through sign lord, conjunction and aspect. Do not infer that those rules are complete from the name mapping alone.

## Rahu / Ketu representative-agent cascade

The chart now exposes a separate node cascade for Rahu and Ketu. It is not folded silently into the classical A–D grade table or into the current event-prediction score.

### Reader priority variants

The selected default is labelled **KSK Reader VI**:

1. Planet(s) conjoined with the node
2. Lord of the node's nakshatra
3. Planet(s) aspecting the node
4. Lord of the sign occupied by the node

A selectable **Reader III/V** order is also implemented for source comparison:

1. Planet(s) conjoined with the node
2. Planet(s) aspecting the node
3. Lord of the node's nakshatra
4. Lord of the sign occupied by the node

This difference is not theoretical: a 20 July 2006 survey comparing KSK's Reader II, III, V and VI editions records that the star-lord was placed after aspecting planets in Readers III/V, but before aspecting planets in Reader VI. The survey cites Reader III OE Part I p.123 (NE p.130), Reader V (1983) p.123, and Reader VI (1978/2002) pp.187, 212–214, 274, 276. It also notes that actual chart examples can use several factors together, so the cascade output preserves all tiers instead of treating the first non-empty tier as the only possible influence:
https://www.indiadivine.org/content/topic/1444376-revisit-of-rahuketu-rules/

A digitized *KP Simple Rules* transcription independently gives the Reader-VI-style sequence: conjunction, star lord, aspecting planet(s), sign lord:
https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/KP-Simple-Rules_djvu.txt

### Explicit calculation conventions

- **Conjunction:** current bridge uses same KP sidereal sign, with no degree orb. This is a provisional software convention, not asserted to be a universal KSK orb. Some later four-step teaching notes use 3°20′ (and sometimes extensions); other KP practitioners dispute fixed 3°20′ orbs. The classical KP reader orb and same-sign practice require their own configurable profile before this default is treated as settled.
- **Aspects:** node agent lookup uses full Parashari sign-based graha drishti from the seven classical planets: universal 7th; Mars 4th/7th/8th; Jupiter 5th/7th/9th; Saturn 3rd/7th/10th. No Western Ptolemaic angles or angular orbs are used. Rahu/Ketu are not treated as aspect-casting agents here, and the nodes do not act as agents for each other.
- **Agent houses:** the node's own occupied house is included directly. Each agent tier separately lists the agent planet(s) and their calculated KP house-signification union. The UI shows the first available tier as the selected/preferred agent and separately shows all other candidate tiers/houses. Those alternative tiers must not be added together as though all had equal priority.
- **A–D / event integration:** the first available Reader VI agent tier is now applied to the node's own house-signification union. If a planet's star lord is Rahu/Ketu, the node's selected representative houses are added to that planet's Level A with a separate provenance field. The same expanded node signification is used when Rahu/Ketu is the CSL in event-promise assessment. Lower-priority candidate tiers remain visible but are not added as equal-strength houses. This is a first source-labelled integration, not a calibrated grade-weighting model.

The sources differ in both edition priority and orb practice. Keep the selected source label, aspect policy and conjunction convention attached to every calculation. Do not describe this implementation as a universal or final KP node rule.

## Classical planet-level A–D strength

The KP planet-signification engine now exposes the four distinct house sets rather than only one merged set:

- **A:** house occupied by the planet's star lord
- **B:** house occupied by the planet itself
- **C:** houses owned by the planet's star lord
- **D:** houses owned by the planet itself

It also records other planets tenanting the planet's stars. When there are no other tenants, `strengthOrder` is B → A → D → C (self-strength); otherwise it is A → B → C → D. This is the planet-to-house hierarchy and is not the same matrix as the house-to-planet Grades I–IV, even though both use four ordered levels.

The UI now prints A/B/C/D separately for each planet in the KP Planets tab. For Rahu/Ketu, it additionally prints node-agent houses; for a planet in a node's star, it marks the inherited Level A houses. The legacy `signifiedHouses` set is retained for compatibility. The current prediction scoring still uses a house union, not a complete grade-weighted selection algorithm, and the node expansion currently applies only the preferred Reader VI tier.

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
- KSK Reader VI vs Reader III/V node priority order;
- Rahu/Ketu same-sign conjunction and Parashari sign-aspect tier separation;
- exclusion of node-to-node agency;
- the Western NorthNode/SouthNode to KP Rahu/Ketu mapping;
- mean-node and extended-twelve chart metadata;
- exclusion of unvalidated calculation-note points such as the placeholder Chiron point.

The latest verification result must be read from GitHub Actions for the commit under test. A successful Cloudflare deploy does not replace the verification gate.

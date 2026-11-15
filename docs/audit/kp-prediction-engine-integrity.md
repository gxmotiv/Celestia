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
- The later Sunil Gondhalekar 4-Step method is not the same thing as the classical four-grade house-significator table. The available practitioner lesson notes describe primary/secondary status and empty-house conditions that the present `KPFourStepEngine` does not yet fully implement: https://kpastrology.astrosage.com/kp-learning-home/related-systems/four-step-theory
- KP Reader VI's five-ruler preference order is represented in the searchable digitized *KP Simple Rules* material: https://archive.org/stream/krishnamurti-padhdhati-vol-3-english/KP-Simple-Rules_djvu.txt. The specific page reference p. 138 is also cited by a secondary explanatory source; the edition and pagination should be verified against a physical/scan copy before treating that secondary page citation as a critical-edition reference: https://vedik.com.br/en/blog/ruling-planets-astrologia-vedica-timing

These transcriptions and teaching notes are research witnesses, not a critical edition. Keep the implementation variant-labelled and preserve any disagreements between KP lineages instead of blending their rules.

## Regression coverage added

`scripts/testKPSystemSuite.ts` now checks:
- the four-step invalid-target-house validation independently of missing planet-chain data;
- invalid KP prediction house rejection;
- rejection of an unresolved CSL planet rather than synthetic House 1 signification;
- the five ruling planets in the prescribed preference order;
- missing Moon and invalid date rejection.

The latest verification result must be read from GitHub Actions for the commit under test. A successful Cloudflare deploy does not replace the verification gate.

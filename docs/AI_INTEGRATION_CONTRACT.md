# Celestia AI Context Integration Contract

Status: Introduced with `feat/unified-ai-astrology-context`

## Purpose

Celestia has two AI entry points:

- Long-form synthesis: `components/AIReadingView.tsx` → `app/api/astrology/ai-reading/route.ts`
- Interactive Oracle: `components/MasterAIAstrologerCockpit.tsx` → `app/api/astrology/master-oracle/route.ts`

Both must receive a consistent, provenance-labelled view of the calculations that are actually available for the selected profile.

The shared adapter is:

- `lib/ai/buildCelestiaAIContext.ts`

Do not create a second, independently maintained chart-context mapper for either AI endpoint. Extend the shared adapter instead.

## Mandatory rule for every feature change

Whenever an astrology, numerology, transit, timing, relationship, chart, divisional-chart, research, or other feature is added, modified, corrected, upgraded, or removed:

1. Identify the exact calculation function and its typed output. Do not infer data from display labels or duplicate the calculation inside an AI prompt.
2. Update `buildCelestiaAIContext` (or a clearly named adapter called by it) to map the new result into the appropriate tradition-specific context.
3. Include source/provenance metadata, calculation settings, date/time basis, ayanamsa/zodiac/house-system details where applicable, and fallback or unavailable notes.
4. Keep traditions separate in the structured payload before synthesis. Do not merge tropical and sidereal longitudes, KP and Parashari rules, BaZi and Western houses, or different numerology schools into one unlabeled value.
5. Connect the shared context to both AI entry points. If a feature is intentionally available to only one entry point, document why.
6. Add or update regression checks proving that the context contains the fields, that unavailable fields remain unavailable, and that no unsupported defaults are fabricated.
7. Update this contract and the integration report when the coverage changes.
8. Report what was actually tested. Do not claim build success, calculation accuracy, deployment, or live availability without evidence.

## Context design requirements

- Use typed source outputs from the calculation layer.
- Preserve units, labels, calendar conventions, reference dates, and configuration choices.
- Include only data for the active profile/session. Partner, horary, electional, or user-selected data must come from the corresponding completed feature state.
- Treat missing data as missing. Do not fill unknown Sun/Moon signs, houses, dashas, partner placements, or divisional charts with plausible-looking defaults.
- Keep raw or large outputs bounded. Prefer a documented compact representation over silently truncating JSON.
- Keep personally identifying birth data limited to what the user already supplied and what is necessary for the requested reading. Never log secrets or API keys.
- AI is an interpretation layer, not an ephemeris, chart calculator, independent verifier, or substitute for deterministic regression tests.

## Current adapter coverage (initial implementation)

The initial adapter gathers:

- Supplied Western tropical natal chart.
- Supplied Vedic sidereal chart, including optional Jaimini and D9 values exposed by the current chart type.
- Current profile's complete numerology report. The current top-level report contains Pythagorean, Vedic/Indian, Chaldean, Chinese Lo Shu, Kabbalah, and Tamil En Kaniyam branches.
- Supplied BaZi Four Pillars profile.
- Calculated Yogini, Chara, Kalachakra, Ashtottari, and available Vimshottari Prana context and convergence from the current dasha orchestrator.
- KP chart, twelve standard house-event evaluations, planetary four-step summaries, and cuspal interlinks.
- Current-date Western, Vedic, Hellenistic, and Western Sidereal transit snapshots, plus Western/Vedic comparison.

The list above is a statement of adapter coverage, not a guarantee that every underlying engine has been independently validated.

## Explicitly not automatic / not currently included

- Partner/synastry results require a second person's birth data or a completed relationship result to be passed from the relationship feature.
- KP Horary requires the selected horary number, table, and question/result from the KP feature.
- Divisional charts beyond those exposed by the current `VedicChartData` object must not be invented or assumed.
- BaZi transit mode and other specialised transit modes must be added when their actual feature result and required settings are made available to the context builder.
- Other feature-specific UI results must be passed explicitly; there is no safe generic way to infer them from source files at runtime.

## Reliability and interpretation rules

- A calculated value is an output of the named Celestia engine. It is not automatically an independently verified astronomical fact.
- Historical birth-time conversion based only on a numeric UTC offset is not proof of historically correct IANA timezone handling.
- KP engine scores currently labelled as percentages are heuristic rule scores, not statistically calibrated probabilities.
- Astrology and numerology are traditional/cultural interpretive systems; do not describe their predictions as scientific certainty.
- A model must state when a system is unavailable, incomplete, approximate, or based on a heuristic.

## Review checklist for every future pull request

- [ ] New/changed feature calculation source identified.
- [ ] Typed adapter added or updated in the shared context builder.
- [ ] Both AI entry points receive the same updated context where applicable.
- [ ] Provenance and calculation settings included.
- [ ] Missing and user-selected data handled without fabricated defaults.
- [ ] Payload-size and privacy impact checked.
- [ ] Regression tests added/updated and actually executed.
- [ ] Any tests not run are listed explicitly.
- [ ] Integration report and this contract updated.
- [ ] Deployment status stated separately from code/CI status.

# Phase 1C — Historical time-zone resolver

## Scope

This PR adds an isolated resolver layer for historical local birth times. It is based on the existing BaZi month-branch fix branch, so the review includes that fix too.

Implemented:
- IANA time-zone validation and strict date/time validation.
- Candidate UTC instants constructed from observed offsets.
- Round-trip validation of every candidate against the requested local wall clock.
- Explicit resolved, ambiguous, nonexistent, and unsupported outcomes.
- Regression cases for standard and daylight offsets, DST gaps/folds, UK wartime double summer time, second-level historical offsets, Kathmandu's 1986 transition, Lord Howe's half-hour DST, Samoa's skipped date, and invalid inputs.

The resolver is not yet wired into the birth form or chart engines. Wiring is deferred until this layer is executed by CI and reviewed.

## Candidate discovery limitation

The resolver samples IANA offsets at one-minute intervals across a bounded +/-36-hour UTC window. It forms candidate UTC instants from every observed offset, then accepts only candidates that format back to every supplied local calendar/time field.

This is stronger than a handful of boundary probes, but it is not a mathematical guarantee that every offset regime was observed: a finite one-minute sampler can miss a regime shorter than one minute. The result exposes the sampling method and limitation instead of calling the method exhaustive.

The IANA database bundled with the runtime is also an external data dependency. Historical rules can differ between ICU/tzdb versions. The resolver declares a supported year range of 1800–2100 and returns unsupported outside it. A chart should not silently fall back to an inferred longitude offset when a local time is ambiguous, nonexistent, or unsupported.

## Next integration gate

After this resolver and its regression suite pass in the same GitHub commit:
1. Add and verify IANA identifiers for the offline city records.
2. Preserve Geoapify-provided IANA identifiers in geocoding results.
3. Add a manual-offset lock/override to the birth form.
4. Wire resolved UTC instants to Western/Vedic calculations.
5. Feed local/apparent solar-time context into the consolidated BaZi engine.

## Validation

Source and tests are submitted for GitHub Actions execution. This document does not claim CI has passed or that the resolver is already used by the live UI.

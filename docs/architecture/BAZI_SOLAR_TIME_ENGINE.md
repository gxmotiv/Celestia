# BaZi solar-time engine — implementation tranche

## Purpose

This tranche introduces a deterministic conversion from a real UTC instant to an explicitly selected BaZi clock, and a solver for the 24 apparent geocentric tropical solar-longitude crossings. It does not yet connect the primary birth form or saved-profile schema to these APIs.

## Clock conventions

- `civil-clock`: UTC instant plus the exact civil UTC offset in seconds supplied by a timezone resolver or explicit user override.
- `local-mean-solar`: UTC instant plus longitude (east-positive) multiplied by 240 seconds per degree.
- `local-apparent-solar`: local mean solar time plus the Meeus Chapter 28 Equation of Time, with EOT defined as apparent solar time minus mean solar time.

The UTC instant remains the authoritative input for solar-year/month term calculations. The derived local clock is used for day/hour pillar boundaries. This avoids incorrectly evaluating solar longitude at a synthetic local-clock timestamp.

## Day-boundary policies

- `pure-zi`: the Day Pillar advances at 23:00.
- `early-late-zi`: the Day Pillar remains on the current civil/solar clock date at 23:00 and advances at 00:00.

Both are explicit options; this code does not claim that one convention is universally accepted. The previous API signature remains compatible. Until the UI passes options, existing callers retain their legacy UTC-clock behavior.

## Equation of Time

The implementation follows the Meeus Chapter 28 truncated expression and uses UTC Julian Day. The sign convention is:

`EOT = apparent solar time - mean solar time`

Four reference values in the design document are used as regression checks. Those checks validate formula transcription against the stated fixtures, not a full independent ephemeris comparison.

## Solar-term crossing solver

`calculateSolarTermsForUtcYear` samples the apparent geocentric tropical solar longitude from the repository's `astronomy-engine` implementation in six-hour brackets, then bisects each discovered 15-degree crossing to a one-millisecond time bracket.

The narrow bracket is numerical root-finding precision, not a claim that the underlying astronomical model is accurate to one millisecond. The model, time scale, and ephemeris validity range still bound the astronomical accuracy. The solver is currently a standalone utility; the existing BaZi year/month engine is not yet wired to consume the solved crossing timestamps.

## Engine identity disclosure

The class name `SwissEphemerisEngine` is retained for compatibility with existing imports. Its current planetary calculations call the `astronomy-engine` package. This is not native Swiss Ephemeris/libswe. Display precision and model accuracy are separate concepts.

## Validation gate

GitHub Actions runs dedicated suites for:
- Meeus EOT and civil/LMST/LAST clock conversion.
- Pure Zi and Early/Late Zi day-boundary behavior.
- 24 annual solar-longitude crossings and root residuals.
- All existing Celestia test suites, ESLint, and production build.

No independent NASA/JPL/USNO solar-term comparison is claimed by these tests. That benchmark remains a separate acceptance gate.

# Ephemeris provenance and accuracy policy

## Current implementation (audited source state)

The active Western calculation path imports `swissEphemeris` from `lib/astronomy/swissEphemeris.ts`. Despite its historical identifier, that module imports the npm package `astronomy-engine` and calls its `GeoVector`, `Ecliptic`, and `AstroTime` APIs for supported planetary bodies.

The same module calculates lunar nodes using local polynomial/periodic approximations. House calculations and other derived quantities are also implemented in repository code.

Therefore:
- This is an Astronomy Engine-based adapter, not a native Swiss Ephemeris library integration.
- The historical class, interfaces, singleton and file names remain temporarily for source compatibility. They must not be used as evidence of the underlying engine.
- The source currently has no completed, independent all-body angular-error study. No fixed accuracy such as 0.001 degrees is certified.
- Formatting a longitude to four decimal places is not evidence that the astronomical result is accurate to four decimal places.
- A passing internal invariant or build is not an independent ephemeris comparison.

## Coordinate and calculation notes

The planetary path calls `Astronomy.GeoVector(body, time, true)` and then `Astronomy.Ecliptic(vec)`. The code comment identifies this as apparent geocentric ecliptic coordinates with light-time/aberration/nutation options. Before publishing a precise coordinate-frame specification, validate the package API semantics and document the reference/equinox conventions for the exact package version.

The lunar-node path is separate from the planetary-vector path. Mean-node and true-node outputs must be benchmarked separately; the current true-node perturbation formula and fixed speed assignment are approximations, not a measured true-node ephemeris.

The adapter rounds returned longitude, latitude and speed values. These rounded values should be treated as application output values, not as an error bound.

## Required validation before accuracy claims

1. Freeze the astronomy-engine dependency version and document its supported date range.
2. Select independent, source-provenanced reference data with explicit time scale, coordinate frame, apparent/geometric convention and precision.
3. Build fixtures for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto over modern and historical dates.
4. Benchmark mean and true lunar nodes separately.
5. Include sign-boundary, station and retrograde cases; compare unrounded internal values where possible.
6. Report signed and absolute angular error, maximum error, median error and fixture coverage per body.
7. Add house-cusp fixtures separately; planetary position agreement does not validate house algorithms.
8. Only publish a numerical accuracy statement if the measured data, date range, coordinate conventions and error distribution support it.

## UI and reporting policy

- Name the engine “Astronomy Engine-based adapter” until native Swiss Ephemeris is actually integrated.
- Label the verification panel as internal calculation checks unless independent references are being compared.
- Do not show “verified”, “0.001 degree accuracy”, “JPL DE405”, “VSOP87”, or “ELP2000-82” as implementation guarantees without source evidence and a reproducible comparison.
- Clearly distinguish internal invariants, software tests, astronomical reference comparisons and astrological interpretation.
- Astrology interpretations and prediction outputs must not be described as scientifically validated forecasts.

## Compatibility note

The exports `SwissEphemerisEngine`, `SwissPlanetPosition`, and `swissEphemeris` are retained in this correction to avoid a broad breaking rename. A later dedicated migration can introduce truthful names and update all imports in a separately reviewed change.

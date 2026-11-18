# JPL Horizons differential ephemeris benchmark

## Purpose

This suite compares the pinned `astronomy-engine@2.1.19` geocentric planetary direction vectors against frozen vectors returned by the public NASA/JPL Horizons API. The fixture set is intended to catch regressions and gross frame/time/correction mismatches. It is not a full ephemeris certification.

## Reference request

The stored 40 fixtures were retrieved from the JPL Horizons API on 2026-11-18. Each request used:

- `EPHEM_TYPE=VECTORS`
- `CENTER=500@399` (Earth geocentre)
- `TIME_TYPE=UT`
- `REF_PLANE=FRAME`
- `REF_SYSTEM=ICRF`
- `VEC_CORR=LT+S` (light-time and stellar-aberration corrected)
- `OUT_UNITS=AU-D`
- `VEC_TABLE=1` (position-only vector output)
- one discrete epoch in `TLIST`

The target IDs and Horizons source identifiers are recorded with every fixture. Different target-specific JPL solutions are therefore visible rather than hidden.

## Compared implementation

The test calls:

```ts
const time = new Astronomy.AstroTime(date);
const vector = Astronomy.GeoVector(body, time, true);
```

The pinned package's type documentation describes `GeoVector` as an Earth-centred Cartesian vector in the J2000 equatorial frame. It always applies light-time correction; `true` additionally applies aberration correction. Horizons `LT+S` applies down-leg light-time and relativistic stellar aberration.

Horizons ICRF is documented as aligned with the prior FK5/J2000 dynamical system at approximately 0.02 arcseconds, but not identical. The benchmark compares vector **direction only**, not AU distance, because its initial purpose is to measure angular-position differences without conflating separate range modelling.

## Coverage

Four epochs are covered: 1970-01-01 12:00 UT, 2000-01-01 12:00 UT, 2024-01-01 12:00 UT and 2026-11-18 12:00 UT. All epochs are after 1962, avoiding the special pre-1962 UT1 interpretation in the Horizons service.

Ten solar-system bodies are covered at each epoch: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto. That is 40 body/epoch comparisons.

## Acceptance threshold and interpretation

The initial test threshold is 60 arcseconds (1 arcminute), informed by the upstream Astronomy Engine README's stated design accuracy. The threshold is a test gate for these frozen samples only. It does not prove that every date, body, house system, node, ayanamsha, asteroid, topocentric position or historical-time conversion meets the same error bound.

A passing result means only that these 40 vector directions are within the configured threshold. A failed result must be investigated for target identity, epoch parsing, time scale, reference frame, correction convention, package version and true algorithm differences before changing the tolerance. Do not widen the threshold just to make CI green.

## Exclusions

This benchmark does not validate:

- mean or true lunar nodes (they are derived mathematical points, not JPL target bodies);
- houses, Ascendant, MC, house-system fallbacks or angles;
- sidereal ayanamsha conversions or zodiac-sign assignments;
- BaZi solar terms, historical timezone/DST resolution or day/hour pillar conventions;
- asteroids, Chiron, fixed stars or hypothetical points;
- transit event searches, retrograde station timing or astrological interpretations;
- prediction accuracy or scientific validity of astrology.

These require separate independently specified fixture sets and test suites.

## Sources

- NASA/JPL Horizons API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- NASA/JPL Horizons system manual: https://ssd.jpl.nasa.gov/horizons/manual.html
- Astronomy Engine JavaScript/TypeScript API reference: https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md
- Astronomy Engine pinned package type declarations (2.1.19): https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.d.ts
- Astronomy Engine upstream README (stated accuracy target): https://github.com/cosinekitty/astronomy/blob/master/README.md

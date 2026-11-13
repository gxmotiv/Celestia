# Western planetary ephemeris benchmark methodology

Status: **reference-capture harness added; numeric JPL fixture calibration not yet complete**.

This workstream measures Celestia's astronomical coordinates against an external source. A software test passing against Celestia-generated expected values is not an independent ephemeris benchmark.

## Reference provider and query definition

Use NASA/JPL Horizons' public API:

- Endpoint: `https://ssd.jpl.nasa.gov/api/horizons.api`
- API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- System manual: https://ssd.jpl.nasa.gov/horizons/manual.html
- Ephemeris type: `OBSERVER`
- Observer center: `500@399` (Earth geocenter)
- Quantity: `31` (observer-centered ecliptic longitude and latitude)
- Angular units: degrees
- Time type: `UT`; all manifest samples are post-1962 UTC labels, where Horizons defines UT output as UTC
- Calendar: Gregorian
- Time precision: fractional seconds
- Discrete time list: every calendar epoch is individually single-quoted and the quoted values are separated by URL-encoded spaces (`%20`), with `TLIST_TYPE='CAL'`; the downloader test asserts this exact URL-decoded syntax.
- Refraction: disabled with `APPARENT='AIRLESS'`
- Target center IDs: Sun 10, Moon 301, Mercury 199, Venus 299, Mars 499, Jupiter 599, Saturn 699, Uranus 799, Neptune 899, Pluto 999

Quantity 31 is not a geometric J2000 vector. Horizons describes it as apparent observer-centered longitude/latitude in its IAU76/80 ecliptic-of-date frame, corrected for light-time, gravitational deflection and stellar aberration (with atmospheric refraction optional). The API requires the ephemeris type, center, time list and requested quantity to be specified. Do not mix this output with heliocentric longitude, astrometric coordinates, or a J2000 ecliptic vector.

The stored manifest in `data/benchmarks/western-ephemeris-reference.json` specifies six UTC epochs, including a historical modern-era sample, the J2000 calendar date, a leap-day sample, a one-second midnight boundary, and a future sample. The J2000 calendar-date row is intentionally called a *calendar-date sample*, not J2000.0: J2000.0 is a dynamical epoch and must not be conflated with 2000-01-01 12:00 UTC.

## Celestia coordinate convention and known mismatches

Celestia's Western planetary path calls the `astronomy-engine` library through the compatibility facade named `SwissEphemerisEngine`; this is not native Swiss Ephemeris/libswe. Its current apparent geocentric vector calculation applies light-time and stellar-aberration correction, then transforms into Astronomy Engine's true ecliptic-of-date coordinates.

The match is close in intent but not an identical implementation:
- Horizons quantity 31 includes gravitational light deflection; Celestia's current Astronomy Engine call does not document that correction.
- Horizons uses its IAU76/80 ecliptic-of-date realization. Astronomy Engine describes its output as true ecliptic of date; its precession/nutation model is not assumed identical to Horizons.
- Celestia rounds UI-facing planetary positions to 0.0001°. The benchmark method uses the new unrounded coordinate method so rounding does not dominate residuals.
- The longitude residual must be circularly reduced to the shortest signed difference in [-180°, 180°]. Latitude residual is a direct difference.
- Lunar nodes are mathematical orbital points, not the same as a directly observed major-body target. They are intentionally excluded from this ten-body Horizons capture and need a separate documented reference method.
- This comparison is geocentric and does not validate topocentric parallax, houses, Ascendant/MC, or house cusps.

Because the frames and corrections are not byte-for-byte identical, do not choose a hard pass threshold before measuring the residual distribution. First capture the complete raw responses, calculate residuals over every body and epoch, inspect outliers and repeatability, then set per-body longitude/latitude thresholds with a stated engineering rationale. A passing threshold means conformance to the selected benchmark policy, not proof of absolute physical truth.

## Reproduce the capture

Install the repository's pinned dependencies and run from the repository root:

```bash
bun run scripts/fetchJplWesternEphemerisReference.ts --fetch
```

The downloader makes ten sequential requests to JPL (one per body), saves each raw JSON response under `data/benchmarks/raw/`, records its SHA-256 digest, parses the `$$SOE` / `$$EOE` observer-table rows, and writes normalized samples to the reference dataset. It intentionally does not call the live API during CI.

The downloader refuses to overwrite a populated dataset unless `--overwrite` is explicitly supplied. Preserve raw responses and update the retrieval date/digests when refreshing. A network/API error, missing table marker, non-numeric row, or unexpected row count is a hard error.

## Compare captured values

After fixtures are captured:

```bash
bun run scripts/compareJplWesternEphemeris.ts
```

The comparison reports longitude and latitude residuals in arcseconds. Until per-body thresholds have been independently calibrated, rows are labelled `REVIEW` rather than `PASS`. Once thresholds are deliberately entered in `acceptanceThresholdsArcseconds`, a comparison outside either bound is a failure. Add `--strict` to fail while any fixture lacks a calibrated threshold.

The offline CI test is:

```bash
bun run scripts/testWesternReferenceHarness.ts
```

It validates circular angle arithmetic and parser behavior with synthetic table rows only. It does **not** contain or assert JPL ephemeris values and must never be reported as an astronomical accuracy pass.

## Next independent validation gates

1. Capture raw Horizons responses and check that all ten targets return all six requested epochs.
2. Compare all 60 body/epoch observations; investigate coordinate-frame and correction differences before threshold selection.
3. Add a second provider/reference family for lunar nodes only after selecting a clearly defined node convention (mean vs true).
4. Benchmark house cusps, ASC/MC and polar cases separately. Horizons planetary ecliptic quantity 31 is not a house-system reference.
5. Keep live Horizons queries out of ordinary CI. CI should consume immutable, versioned, checksummed reference fixtures once those fixtures have been curated.

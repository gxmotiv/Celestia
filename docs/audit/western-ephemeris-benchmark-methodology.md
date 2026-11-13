# Western planetary ephemeris benchmark methodology

Status: **60 JPL reference observations captured; residual analysis complete; acceptance thresholds not yet calibrated**.

This workstream measures Celestia's astronomical coordinates against an external source. A software test passing against Celestia-generated expected values is not an independent ephemeris benchmark.

## Reference provider and query definition

NASA/JPL Horizons was queried on 13 November 2026. The committed dataset contains 60 real observations (10 targets × 6 UTC epochs) and ten raw API response files. Each normalized observation links to its source response path and SHA-256 digest. The raw-response JSON signature reports version 1.2; the public API documentation currently identifies itself as version 1.3 (2025 June). These are recorded separately in the manifest.

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

Quantity 31 is not a geometric J2000 vector. Horizons defines it as apparent observer-centered longitude/latitude in the Earth ecliptic-of-date frame using its IAU76/80 model, corrected for light-time, gravitational deflection and stellar aberration (with atmospheric refraction optional). The Horizons manual describes IAU76 precession for 1799–2202, IAU80 nutation, and JPL Earth-orientation corrections for modern dates. It also documents DE441 as the basis of planetary barycenter motion data. The API requires the ephemeris type, center, time list and requested quantity to be specified. Do not mix this output with heliocentric longitude, astrometric coordinates, or a J2000 ecliptic vector.

The stored manifest in `data/benchmarks/western-ephemeris-reference.json` specifies six UTC epochs, including a historical modern-era sample, the J2000 calendar date, a leap-day sample, a one-second midnight boundary, and a future sample. The J2000 calendar-date row is intentionally called a *calendar-date sample*, not J2000.0: J2000.0 is a dynamical epoch and must not be conflated with 2000-01-01 12:00 UTC. The captured response headers also report EOP data-based coverage through 2026-11-12 and prediction through 2027-02-07. The 2035-07-01 row lies beyond that prediction interval; the Horizons manual says the last predicted EOP values are held constant outside the available EOP coverage. Keep this long-range stress sample separate from near-term threshold calibration.

## Celestia coordinate convention and known mismatches

Celestia's Western planetary path calls the `astronomy-engine` library through the compatibility facade named `SwissEphemerisEngine`; this is not native Swiss Ephemeris/libswe. Its current apparent geocentric vector calculation applies light-time and stellar-aberration correction, then transforms into Astronomy Engine's true ecliptic-of-date coordinates. Horizons quantity 31 is defined in its Earth ecliptic-of-date IAU76/80 frame; those frame realizations and Earth-orientation corrections must not be assumed identical.

## First captured residuals (descriptive only)

The offline comparison runner evaluated the 60 rows against Celestia's unrounded apparent geocentric ecliptic coordinates. Residuals below are absolute arcseconds. They describe this particular six-epoch sample and the selected coordinate pipelines; they are **not acceptance thresholds**.

| Body | Longitude median / max / RMS | Latitude median / max / RMS |
|---|---:|---:|
| Sun | 0.60″ / 0.61″ / 0.53″ | 0.48″ / 1.12″ / 0.68″ |
| Moon | 2.40″ / 7.48″ / 3.39″ | 0.52″ / 0.96″ / 0.60″ |
| Mercury | 1.29″ / 4.44″ / 2.28″ | 0.89″ / 1.01″ / 0.81″ |
| Venus | 1.97″ / 10.89″ / 6.38″ | 0.97″ / 1.29″ / 0.83″ |
| Mars | 1.06″ / 3.24″ / 1.67″ | 1.10″ / 1.97″ / 1.16″ |
| Jupiter | 4.03″ / 4.13″ / 3.38″ | 1.81″ / 6.24″ / 2.97″ |
| Saturn | 5.12″ / 10.25″ / 6.67″ | 5.51″ / 18.72″ / 8.56″ |
| Uranus | 4.51″ / 11.03″ / 5.65″ | 5.95″ / 17.08″ / 8.10″ |
| Neptune | 11.54″ / 12.14″ / 9.73″ | 9.40″ / 9.55″ / 7.88″ |
| Pluto | 1.36″ / 3.12″ / 1.93″ | 0.60″ / 0.98″ / 0.57″ |

The sample shows small but non-zero residuals, with the largest measured differences among these six dates at 12.14 arcseconds in longitude and 18.72 arcseconds in latitude. Outer-planet residuals are larger than the solar residuals in this sample. Because Horizons and Astronomy Engine do not use identical frame realizations and correction models, these numbers should guide investigation, not be converted directly into universal pass limits. The 2035 sample is additionally affected by the EOP extrapolation note above.

The match is close in intent but not an identical implementation:
- Horizons quantity 31 includes gravitational light deflection; Celestia's current Astronomy Engine call does not document that correction.
- Horizons uses its Earth ecliptic-of-date IAU76/80 realization, with its documented precession, nutation and modern Earth-orientation corrections. Astronomy Engine describes its output as true ecliptic of date; its precession/nutation and frame realization are not assumed identical to Horizons.
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

The downloader makes ten sequential requests to JPL (one per body), saves each raw JSON response under `data/benchmarks/raw/`, records its SHA-256 digest, verifies all six returned timestamps and their order, parses the `$SOE` / `$EOE` observer-table rows, and writes normalized samples to the reference dataset. The branch-scoped capture workflow uploads the raw files and commits the captured fixture set to this isolated research branch. Ordinary verification CI does not query the live API.

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

1. Independently review the archived raw response headers, checksums, and coordinate conventions; confirm target-center coverage and the EOP extrapolation caveat for the 2035 sample.
2. Investigate per-body residual patterns and repeat the sample against a second compatible reference/frame before setting per-body acceptance thresholds.
3. Add an independent node reference family only after selecting a clearly defined node convention (mean vs true); Horizons planetary center quantities do not directly provide the astrological nodes.
4. Benchmark house cusps, ASC/MC and polar cases separately. Horizons planetary ecliptic quantity 31 is not a house-system reference.
5. Keep live Horizons queries out of ordinary verification CI. CI should consume the committed, versioned, checksummed fixtures.

# Common-frame astrometric J2000 cross-check

Status: **18 matched external vector pairs captured and checksummed; Astronomy Engine compared in the same frame; interpretation remains REVIEW**.

## Why this test is needed

The preceding apparent-of-date comparison found that Miriade INPOP19 and JPL Horizons quantity 31 agree closely in longitude but differ in latitude by up to 9.55 arcseconds. A date-by-date rigid-rotation fit across Saturn, Uranus and Neptune explained most of that pattern. This is strong evidence that the apparent-of-date frame conventions are not identical; it is not a reason to apply body-specific offsets.

This follow-on comparison aligns the external references in an inertial J2000 ecliptic vector frame and adds Astronomy Engine's own geocentric vector in that same frame.

## Matched configuration and source semantics

IMCCE Miriade:
- planetary theory: the request selects INPOP; the captured responses identify **INPOP19**;
- observer: 500 (Earth geocenter);
- time scale: UTC;
- ephemeris type: `teph=1` (astrometric J2000);
- coordinate type: `tcoor=2` (rectangular);
- reference plane: `rplane=2` (ecliptic);
- position columns: px, py, pz in AU.

NASA/JPL Horizons:
- target solutions: DE441, as identified by captured Horizons response headers;
- center: `500@399` (Earth geocenter);
- ephemeris type: `VECTORS`;
- reference system: ICRF;
- reference plane: fixed ecliptic of J2000.0;
- vector correction: `VEC_CORR=LT` (light-time corrected, no stellar aberration);
- vector table: `VEC_TABLE=1` (position only);
- output units: AU and days.

The raw JPL response confirms its reference frame is Ecliptic of J2000.0, with the X-Y plane defined by the IAU76 obliquity of 84381.448 arcseconds with respect to ICRF. It labels the output as LT-corrected Cartesian states and says the states include Newtonian down-leg light-time displacement. Miriade labels the output astrometric J2000, ecliptic, geocentric and reports the coordinate system as ec_ICRF with J2000 epoch/equinox.

The comparison is therefore substantially better aligned than the earlier apparent-of-date comparison. Remaining time-tag details matter: JPL labels post-1962 dates UTC when rendered from its internal TDB; the 2035 stress row is marked UT~ because future leap seconds are not known. Miriade's input/output time scale is UTC. Keep 2035 separate from modern-time calibration.

## Data and reproducibility

Captured at **2026-11-13T07:39:49.928Z**:
- Saturn, Uranus, Neptune;
- the same six epochs as the JPL quantity-31 benchmark;
- 18 matched body/epoch pairs;
- three raw Miriade JSON responses and three raw JPL JSON responses;
- six SHA-256 checksums stored in the manifest and verified before comparison.

The offline comparator reports vector-component differences, vector norm, range difference and angular separation using `atan2(|a × b|, a · b)`. It also calculates Astronomy Engine's `GeoVector(body, time, false)` in EQJ, which includes light-time but disables stellar aberration. EQJ is rotated into the fixed J2000 ecliptic using the IAU76 J2000 mean obliquity (84381.448 arcseconds). That is compared against both external references. This is an upstream model diagnostic; the app's normal apparent-of-date chart path uses aberration and true ecliptic-of-date output.

## Observed angular residuals

All values are arcseconds, across the six sampled epochs per body. These are measured samples, not universal accuracy guarantees or thresholds.

| Body | INPOP19 vs JPL DE441 max | Astronomy Engine vs INPOP19 median / max | Astronomy Engine vs JPL DE441 median / max |
|---|---:|---:|---:|
| Saturn | 0.0611″ | 10.7965″ / 19.4699″ | 10.8402″ / 19.4203″ |
| Uranus | 0.2552″ | 7.1283″ / 17.5615″ | 7.1165″ / 17.6305″ |
| Neptune | 0.0756″ | 14.7255″ / 15.3240″ | 14.7732″ / 15.3790″ |

Key distinction:
1. The two independent planetary references agree within **0.2552 arcseconds maximum** in this matched-frame sample.
2. Astronomy Engine's astrometric J2000 vectors differ from both references by approximately **2.8–19.5 arcseconds** in the same six-epoch sample, with nearly identical residuals against INPOP19 and DE441.
3. The previous apparent-of-date latitude spread (up to 9.55 arcseconds between INPOP19 and JPL quantity 31) is a separate frame/convention issue revealed by the earlier rotation diagnostic.

This points to two separate effects: an apparent-of-date frame convention mismatch between the providers, and a real finite-precision difference in Astronomy Engine's planetary model once the vector frames are aligned. The results do not show a JPL-vs-INPOP orbital-model disagreement of 10 arcseconds.

## Interpretation against the upstream model's stated scope

Astronomy Engine's own project documentation says it is designed for angular accuracy within approximately **±1 arcminute** and explains that it truncates VSOP87 series to keep the implementation small and fast. The observed outer-planet differences here (maximum 19.47 arcseconds in this limited sample) are within that stated design envelope. This supports classifying the residuals as consistent with the upstream model's intended precision, not as proof of a broken coordinate conversion. It does not establish that every Celestia chart, body, epoch, house or derived calculation meets that envelope.

No per-body accuracy thresholds have been introduced. All rows remain REVIEW; the reference-to-reference comparison and the Astronomy Engine comparison should remain separate evidence columns. Do not "correct" positions by subtracting fitted residuals or planet-specific offsets.

## Reproduction

- Parser and request tests: `bun run scripts/testAstrometricJ2000Harness.ts`
- Offline comparator, including all six raw-response SHA-256 checks: `bun run scripts/compareAstrometricJ2000References.ts`
- Explicit live refresh only: `bun run scripts/fetchAstrometricJ2000References.ts --fetch --overwrite`

Ordinary verification runs synthetic parser/frame tests. The dedicated research-branch workflow verifies the fixed committed dataset. No production deployment or live-site update is part of this workstream.

## Primary documentation

- IMCCE Miriade `ephemcc` API: https://ssp.imcce.fr/webservices/miriade/api/ephemcc/
- JPL Horizons API parameter definitions: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- Astronomy Engine upstream design/accuracy statement: https://github.com/cosinekitty/astronomy
- Astronomy Engine `GeoVector` / `AstroTime` API documentation: https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md

# Common-frame astrometric J2000 cross-check

Status: request/parser harness and capture automation added; external reference capture pending.

## Why this test is needed

The prior test compared apparent-of-date ecliptic coordinates from Miriade and JPL Horizons quantity 31. Outer-planet longitudes agreed within 0.35 arcseconds, but latitude differences reached 9.55 arcseconds. A date-by-date rigid-rotation diagnostic explained nearly all of that pattern. This warrants checking the two planetary theories in a common inertial frame before attributing the residual to Celestia's engine.

## Matched configuration

IMCCE Miriade:
- theory: INPOP (response records the actual model, expected INPOP19)
- observer: 500, Earth geocenter
- time scale: UTC
- ephemeris type: `teph=1`, astrometric J2000
- coordinate type: `tcoor=2`, rectangular
- reference plane: `rplane=2`, ecliptic

NASA/JPL Horizons:
- center: `500@399`, Earth geocenter
- ephemeris type: `VECTORS`
- reference system: `ICRF`
- reference plane: `ECLIPTIC`, fixed J2000 ecliptic plane
- vector correction: `VEC_CORR=LT`, astrometric light-time correction without stellar aberration
- vector table: `VEC_TABLE=1`, position components
- output units: AU and days
- input time type: UT

Miriade documents teph=1 as astrometric J2000 and rectangular position output in AU. Horizons documents LT vector correction as astrometric light-time-corrected state vectors, distinct from LT+S (which includes stellar aberration). This is a closer common-frame comparison than apparent-of-date outputs, though exact realization details, UTC/UT labeling and returned metadata still need explicit review.

## Scope and metrics

The same six whole-second epochs are used for Saturn, Uranus and Neptune (18 rows). The capture stores three raw Miriade JSON responses and three raw JPL Horizons JSON responses, each with SHA-256. The offline comparator verifies all six checksums before comparing.

For each matched body and epoch it reports:
- ΔX, ΔY, ΔZ in AU;
- Euclidean position-vector difference in AU;
- geocentric range difference in AU;
- angular separation computed using atan2(|a×b|, a·b), in arcseconds.

These are descriptive residuals, not accuracy acceptance thresholds or proof that either model is an absolute truth. INPOP and DE441 are different fitted planetary solutions. The 2035 epoch remains a long-range stress sample and must not be mixed into near-term calibration.

## Reproduction

- Request/parser tests: `bun run scripts/testAstrometricJ2000Harness.ts`
- Offline comparator: `bun run scripts/compareAstrometricJ2000References.ts`
- Explicit recapture: `bun run scripts/fetchAstrometricJ2000References.ts --fetch --overwrite`

Ordinary CI runs synthetic parser tests. External requests run only in the dedicated research-branch workflow. No production deployment or live-site update is included.

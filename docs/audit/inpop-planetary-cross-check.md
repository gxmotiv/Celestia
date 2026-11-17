# Independent outer-planet cross-check: IMCCE INPOP19

Status: **18 external reference rows captured and checksummed; three-way comparison completed; interpretation remains REVIEW**.

## Why a second provider is necessary

The first benchmark compares Celestia's Astronomy Engine implementation with NASA/JPL Horizons. The second provider is IMCCE LTE Miriade with its planetary theory requested as INPOP; the actual responses identify the model as **INPOP19**. This gives a second independent planetary solution for the outer-planet check.

Primary documentation:
- Miriade ephemcc API: https://ssp.imcce.fr/webservices/miriade/api/ephemcc/
- Miriade ephemcc how-to: https://ssp.imcce.fr/webservices/miriade/howto/ephemcc/
- INPOP project: https://www.imcce.fr/recherche/equipes/astronomie-dynamique/inpop/
- JPL Horizons manual: https://ssd.jpl.nasa.gov/horizons/manual.html

## Captured dataset and coordinate metadata

Capture time: **2026-11-13T05:19:16.059Z**. The dataset contains six shared UTC epochs for Saturn, Uranus and Neptune: 18 observations total. Three raw JSON files and their SHA-256 digests are committed alongside the normalized fixture file. Each response explicitly reported:
- Planetary theory: INPOP19
- Time scale: UTC
- Output: rectangular coordinates, position columns px, py, pz in AU
- Observer: Earth geocenter
- Reference frame: apparent (true equator; equinoxe of the date), ecliptic plane
- Coordinate-system metadata: ec_ICRF, epoch/equinox J2000

The Miriade reference_frame and coosys metadata must both be retained. The ec_ICRF J2000 coordinate-system tag is not interchangeable by assumption with the reference-frame label apparent (true equator; equinoxe of the date). JPL Horizons quantity 31 documents its own observer-centered IAU76/80 ecliptic-of-date realization. The providers are not yet proven to implement an identical date-frame realization or identical apparent-place correction pipeline.

## Three-way comparison

For each matched outer-planet/body/epoch tuple, the comparator reports:
1. Astronomy Engine minus IMCCE INPOP19.
2. Astronomy Engine minus JPL Horizons quantity 31.
3. IMCCE INPOP19 minus JPL Horizons quantity 31.

All residuals below are arcseconds. Longitude uses the shortest signed circular difference; latitude uses a direct signed difference. No acceptance thresholds are defined; results remain REVIEW.

| Body | AE−INPOP longitude max | INPOP−JPL longitude max | AE−INPOP latitude max | INPOP−JPL latitude max |
|---|---:|---:|---:|---:|
| Saturn | 10.59″ | 0.35″ | 28.20″ | 9.48″ |
| Uranus | 11.05″ | 0.26″ | 26.08″ | 9.55″ |
| Neptune | 11.87″ | 0.28″ | 12.07″ | 9.50″ |

The INPOP−JPL longitude maximum is at most 0.35″ for these 18 matched rows, whereas latitude differences reach 9.55″. This strongly suggests longitude orbital-model disagreement is not the dominant explanation for the sampled cross-provider latitude spread.

## Common small-rotation diagnostic

The offline comparator fits a first-order three-axis rigid rotation mapping INPOP coordinates toward JPL coordinates separately at each epoch. It uses longitude and latitude residuals from three bodies (six angular measurements) to estimate three rotation parameters, leaving three residual degrees of freedom. This is a compact diagnostic, not a frame transformation applied to the chart engine and not an independent validation of either provider.

| Epoch UTC | Pole rotation magnitude | Z rotation | Fit RMS | Max fit residual |
|---|---:|---:|---:|---:|
| 1987-03-14 | 9.586″ | −0.059″ | 0.011″ | 0.019″ |
| 2000-01-01 | 5.759″ | −0.074″ | 0.013″ | 0.021″ |
| 2024-02-29 | 9.219″ | −0.012″ | 0.046″ | 0.083″ |
| 2026-11-13 | 7.346″ | +0.006″ | 0.062″ | 0.113″ |
| 2035-07-01 | 9.132″ | +0.042″ | 0.104″ | 0.206″ |

The fit explains most of the cross-provider latitude pattern as a common small coordinate rotation at each sampled epoch. The fitted rotation changes with epoch. Because only three outer planets are used (three residual degrees of freedom per epoch), this is a strong diagnostic clue but not proof of the exact cause. The likely investigation area is the time-dependent ecliptic/equator frame realization and apparent-place conventions, not a body-specific correction to Saturn, Uranus or Neptune.

The 2035-07-01 point is a long-range stress sample. The previous JPL capture recorded EOP prediction coverage only through 2027-02-07, with constant last-predicted values thereafter. Do not mix this point into near-term accuracy calibration.

## Integrity and reproduction

The comparator verifies every raw Miriade response SHA-256 digest against the committed dataset manifest before producing residuals. It also validates the INPOP response metadata before trusting the rows.

Run:
- bun run scripts/testInpopWesternEphemerisHarness.ts
- bun run scripts/compareInpopWesternEphemeris.ts

Live data recapture is deliberately separate:
- bun run scripts/fetchInpopWesternEphemerisReference.ts --fetch --overwrite

The branch-scoped capture workflow skips recapture when the committed INPOP dataset already exists; it rechecks the archived raw files and reruns the offline comparison on subsequent code/documentation updates. This avoids accidental replacement of a reproducible fixed dataset on every push.

No production deployment is part of this workstream.

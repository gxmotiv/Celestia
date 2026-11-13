# Independent outer-planet cross-check: IMCCE INPOP

Status: capture automation and offline comparison are being added; measured INPOP results are pending the GitHub Actions run.

## Why a second provider is necessary

The first benchmark compares Celestia's Astronomy Engine implementation with NASA/JPL Horizons. That comparison is valuable but has two important limitations for root-cause analysis: it is one external ephemeris provider, and Horizons quantity 31 uses its own IAU76/80 Earth ecliptic-of-date realization and apparent-place corrections.

The second provider is the IMCCE LTE Miriade positional-ephemeris service, with its planetary theory explicitly set to INPOP. IMCCE documents INPOP as its default planetary theory for planets and lists it separately from JPL DE403/405/406/430/431. The aim is to compare a second dynamical solution against Astronomy Engine and then compare INPOP to the already archived JPL values at identical body/epoch pairs.

Primary documentation:
- Miriade ephemcc API: https://ssp.imcce.fr/webservices/miriade/api/ephemcc/
- Miriade ephemcc how-to: https://ssp.imcce.fr/webservices/miriade/howto/ephemcc/
- INPOP project: https://www.imcce.fr/recherche/equipes/astronomie-dynamique/inpop/

## Fixed request definition

The capture script sends a multipart POST to the official Miriade ephemcc endpoint. It uses the same six UTC epochs already committed in data/benchmarks/western-ephemeris-reference.json; the epoch file is sent as the documented epochs upload field. It queries Saturn, Uranus and Neptune individually to keep response identity and archival checksums unambiguous.

Requested parameters:
- Target: p:Saturn, p:Uranus, p:Neptune
- Theory: INPOP (the exact returned model label is preserved in metadata)
- Observer: 500, the Earth geocenter
- Time scale: UTC
- Ephemeris type: 2, apparent of date
- Coordinate type: 2, rectangular
- Reference plane: 2, ecliptic
- Output: JSON, ISO timestamps

The parser requires the returned metadata to identify an INPOP theory, UTC, rectangular apparent-of-date coordinates, an ecliptic plane, and the geocenter. It derives spherical longitude and latitude from the provider's geocentric rectangular vector and rejects missing, reordered, duplicated or extra epoch rows. Raw response files are archived with SHA-256 digests.

## Three-way comparison

For every outer-planet/body/epoch tuple, the offline comparator reports:
1. Astronomy Engine minus IMCCE INPOP.
2. Astronomy Engine minus the already archived JPL Horizons quantity-31 row.
3. IMCCE INPOP minus the JPL Horizons quantity-31 row.

Longitude uses the shortest signed circular difference; latitude uses a direct signed difference. Each pair is summarized with absolute median, 95th percentile and maximum, plus signed bias and RMS. No acceptance thresholds are set. All rows remain REVIEW.

This is a diagnostic triangulation, not a declaration that either external provider is an absolute ground truth. The requested apparent coordinate modes and ecliptic plane are aligned as far as documented, but reference-frame realizations and apparent-place correction details still need to be checked against the returned metadata and provider documentation. A provider-to-provider residual that is itself large must not be attributed to Celestia alone.

## Interpretation rules

- If Astronomy Engine is close to INPOP but materially farther from JPL, investigate the Horizons frame/correction realization before changing the planetary implementation.
- If Astronomy Engine is close to JPL but materially farther from INPOP, inspect the INPOP model version, time scale, frame and output convention.
- If Astronomy Engine is displaced similarly from both providers while INPOP and JPL agree closely, investigate Celestia's planetary theory implementation and time conversion.
- If INPOP and JPL disagree materially, classify the epoch/body as a reference-model or convention discrepancy and do not use it to calibrate a pass limit.

These are investigation heuristics only; compare the actual signed residual distributions before drawing a conclusion.

## Reproduction

After the branch-scoped capture workflow completes:
- bun run scripts/testInpopWesternEphemerisHarness.ts
- bun run scripts/compareInpopWesternEphemeris.ts

The live capture command is intentionally separate:
- bun run scripts/fetchInpopWesternEphemerisReference.ts --fetch

Ordinary CI uses synthetic parser fixtures and committed benchmark data only; it does not query IMCCE. The capture workflow runs only on the isolated benchmark branch and archives the external responses. No production deployment is part of this workstream.

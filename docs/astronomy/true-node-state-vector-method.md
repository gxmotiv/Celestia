# True lunar node: state-vector implementation and validation status

## Definition

Celestia's selected true-node convention is the ascending intersection of:
1. the osculating geocentric orbital plane of the Moon at the requested instant; and
2. the true ecliptic plane of date (ECT).

Astrodienst's Swiss Ephemeris technical documentation describes the usual true lunar node as the osculating node of the Moon's instantaneous orbital plane intersecting the ecliptic. It distinguishes this from the mean lunar node, which is derived from a separate mean-lunar-theory calculation:
- https://www.astro.com/swisseph/swisseph.htm#2.2.1
- https://www.astro.com/swisseph/swisseph.htm#2.2.2

This document describes Celestia's implementation of that geometric definition. It does **not** claim parity with the native Swiss Ephemeris algorithms.

## State-vector method

The pinned `astronomy-engine@2.1.19` API exposes `GeoMoonState(time)`, returning a geocentric Moon state vector (position in AU and velocity in AU/day) oriented in EQJ, its J2000 equatorial frame:
- https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.d.ts

Given position `r = (x,y,z)` and velocity `v = (vx,vy,vz)`, the orbital angular momentum vector is:

```
h = r × v
hx = y*vz - z*vy
hy = z*vx - x*vz
hz = x*vy - y*vx
```

`h` is the normal vector of the osculating lunar orbital plane. Celestia transforms that vector from EQJ to ECT using `Astronomy.Ecliptic(new Astronomy.Vector(hx, hy, hz, time)).vec`.

In the ECT frame the ecliptic north pole is `k = (0,0,1)`. The ascending-node direction is `n = k × h = (-hy, hx, 0)`. Its ecliptic longitude is:

```
longitude = wrap360(atan2(hx, -hy) * 180 / π)
```

The descending node is exactly 180° from the corresponding ascending node. The existing one-hour central finite-difference estimate is used for longitude speed; it is a numerical derivative and should be revisited with a convergence test.

## Independent JPL state fixtures

`tests/fixtures/jpl-moon-state-vectors.json` contains two frozen geometric Moon states from NASA/JPL Horizons, source DE441:

- 2000-01-01 12:00 TT (JDTT 2451545.0)
- 2024-01-01 12:00 TT (JDTT 2460311.0)

The request settings are:
- Target Moon (301), centre Earth geocentre (500@399)
- `EPHEM_TYPE=VECTORS`
- `TIME_TYPE=TT`
- `REF_PLANE=FRAME`, `REF_SYSTEM=ICRF`
- `VEC_CORR=NONE` (geometric; no light-time/aberration corrections)
- `VEC_TABLE=2` (position and velocity)
- `OUT_UNITS=AU-D`

The JPL reference node is derived from each independent JPL Moon state using the same documented vector geometry and transformed into ECT for comparison. The app result is calculated at the corresponding UTC instant; the TT-to-UTC offsets are stored alongside the fixtures. ICRF is aligned with the historical FK5/J2000 frame to approximately 0.02 arcseconds but is not exactly identical, as documented by JPL.

The initial regression threshold is 180 arcseconds for these two sample epochs. This is a preliminary test gate, not a measured global accuracy claim. It allows the first independent differential test of the pinned Moon model and frame conversion. It must not be widened to conceal a failing result.

## Known limitations

- Only two JPL lunar state fixtures currently exist. More dates and orbital phases are required before marking the true node validated.
- The pinned Astronomy Engine lunar state model is not native JPL DE441; the JPL data is an external reference, not the app's runtime ephemeris.
- The current mean-node polynomial remains a separate approximation and has not been compared with Swiss Ephemeris' Moshier/ELP mean-node implementation.
- The node's reported `distance` field is retained only as a legacy API placeholder. A lunar node is a mathematical point, not a physical body with its own Earth distance.
- Speed convergence, continuity near wrap, and retrograde/direct intervals require further tests.
- This work does not validate houses, ayanamsha, topocentric positions, solar terms, historical timezones, or astrology predictions.

## Next gates

1. Expand JPL state fixtures over more years and lunar phases.
2. Add position/velocity direction and node-longitude error reports.
3. Test the derivative at 15-, 30-, and 60-minute step sizes.
4. Verify angular continuity and speed around 0°/360° and node extrema.
5. Compare mean-node output with an independently defined mean-node reference.
6. Keep both node models explicitly distinguished in calculation traces and user-facing labels.

## References

- NASA/JPL Horizons API: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- NASA/JPL Horizons manual: https://ssd.jpl.nasa.gov/horizons/manual.html
- Astronomy Engine pinned API: https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.d.ts
- Swiss Ephemeris node definitions: https://www.astro.com/swisseph/swisseph.htm#2.2.1 and https://www.astro.com/swisseph/swisseph.htm#2.2.2

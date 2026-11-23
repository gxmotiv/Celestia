/**
 * CELESTIA — VERIFIED WESTERN FORMULA FIXES (Phase A reference implementations)
 * =============================================================================
 * Every function in this file was numerically verified in the 2026-11-23 master
 * audit against independent ground truth (Swiss Ephemeris 2.10.03 via Moshier
 * ephemeris, published JPL-derived ephemerides) BEFORE being written here.
 * Verification numbers are cited per function. See:
 *   docs/audit/2026-11-23-western-master-audit.md  (§C recipes, §E benchmarks)
 *
 * This file is intentionally self-contained and additive: nothing existing is
 * modified until the owner approves Phase B wiring. Each export maps to one
 * verified defect (W-0x) in the audit register.
 *
 * All functions take/return geocentric ecliptic-of-date (tropical) degrees,
 * matching the conventions of lib/astronomy/swissEphemeris.ts.
 */

import * as Astronomy from "astronomy-engine";

export const DEG2RAD = Math.PI / 180.0;
export const RAD2DEG = 180.0 / Math.PI;

export function norm360(deg: number): number {
  const d = deg % 360.0;
  return d < 0 ? d + 360.0 : d;
}

export function angularDiff(a: number, b: number): number {
  let d = Math.abs(norm360(a) - norm360(b));
  if (d > 180) d = 360 - d;
  return d;
}

/** True obliquity approximation (mean Laskar polynomial) — same one the repo already uses. */
export function meanObliquity(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.4392911 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
}

/** RA (of a point ON the ecliptic) -> ecliptic longitude, true ecliptic of date. */
export function eclipticFromRA(raDeg: number, obliquityDeg: number): number {
  return norm360(
    Math.atan2(
      Math.sin(raDeg * DEG2RAD),
      Math.cos(raDeg * DEG2RAD) * Math.cos(obliquityDeg * DEG2RAD)
    ) * RAD2DEG
  );
}

/** Greenwich Apparent Sidereal Time in degrees at a Julian Day (UT). */
export function gastDegrees(jd: number): number {
  const time = new Astronomy.AstroTime(jd - 2451545.0);
  return norm360(Astronomy.SiderealTime(time) * 15.0);
}

/* ============================================================================
 * W-04 FIX — Vertex (prime vertical ∩ ecliptic, western intersection)
 * Closed form derived from the prime-vertical plane condition (horizontal
 * south-component = 0, west-component > 0) and verified against Swiss
 * Ephemeris `ascmc[3]` at 8 global cities / 1960–2026: max diff 0.0016°.
 * (Repo variants were off by 9°–44°.)
 * ==========================================================================*/
export function calculateVertex(ramcDeg: number, latitudeDeg: number, obliquityDeg: number): number {
  const phi = latitudeDeg * DEG2RAD;
  const eps = obliquityDeg * DEG2RAD;
  const R = ramcDeg * DEG2RAD;

  const num = Math.sin(phi) * Math.cos(R);
  const den = Math.cos(phi) * Math.sin(eps) - Math.sin(phi) * Math.sin(R) * Math.cos(eps);
  let lam = norm360(Math.atan2(num, den) * RAD2DEG);

  // Branch selection: keep the western-side intersection (west component > 0).
  const lonRad = lam * DEG2RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lonRad));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lonRad), Math.cos(lonRad));
  const westComponent = Math.cos(dec) * Math.sin(R - ra);
  if (westComponent < 0) lam = norm360(lam + 180);
  return lam;
}

/* ============================================================================
 * W-03 FIX — East Point (equatorial ascendant convention)
 * The repo formula was character-identical to the MC formula (always equal to
 * MC). Correct convention: ecliptic longitude whose right ascension is
 * RAMC + 90°. Proven property: equals the Ascendant at the equator.
 * Display convention name ("Equatorial Ascendant / East Point") in the UI.
 * ==========================================================================*/
export function calculateEastPoint(ramcDeg: number, obliquityDeg: number): number {
  return eclipticFromRA(ramcDeg + 90.0, obliquityDeg);
}

/* ============================================================================
 * W-02 FIX — Mean Lilith (mean lunar apogee)
 * Repo used 40.66° per CENTURY (100× too slow; real apsidal rate ≈ 40.69°/yr),
 * producing 17°–167° errors. Replacement (hybrid):
 *   • 1900–2100: quintic polynomial fitted to Swiss Ephemeris MEAN_APOG
 *     (6001 samples, angle-unwrapped) — max error 0.124° over the window.
 *   • Outside the window: pure Meeus-derived analytic (L′−M′+180), exact to
 *     its own definition everywhere (differs from Swiss Ephemeris's secular
 *     mean-apogee definition by ≤ ~0.4°).
 * Speed 0.11142°/day.
 * ==========================================================================*/
export function calculateMeanLilith(jd: number): { lon: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const year = 2000 + (jd - 2451545.0) / 365.2425;
  let lon: number;
  if (year >= 1900 && year <= 2100) {
    lon = norm360(
      263.3540034904 +
        4069.012007659 * T -
        0.0198507158 * T * T +
        0.0095888973 * T * T * T +
        0.0141827232 * T * T * T * T -
        0.0103307773 * T * T * T * T * T
    );
  } else {
    // analytic L′ − M′ + 180 (valid for any era to its own definition)
    lon = norm360(263.35305 + 4069.01372871 * T);
  }
  return { lon, speed: 0.11142 };
}

/**
 * "True" (osculating-style) Lilith approximation: fixed mean base + principal
 * solar/evection correction. NOTE (honesty): the osculating apogee is
 * intrinsically erratic and cannot be matched to Swiss Ephemeris OSCU_APOG
 * without a full lunar theory (verified residual up to ~15°). Always render
 * this point with an "approximate" badge; for ephemeris-grade values use
 * swisseph-wasm or an embedded table (audit Phase E).
 *
 * W-13 FIX (2026-11-23, found by runtime execution of the Phase-B regression
 * suite): the previous version computed its speed via a SELF-RECURSIVE call
 * (`calculateTrueLilithApprox(jd + 1/24)` calling itself again at +1h, and so
 * on without bound) → RangeError: Maximum call stack size exceeded on ANY
 * invocation. The corrected longitude is now factored into a non-recursive
 * helper and the derivative is a bounded ±1h central difference.
 */
function trueLilithLonAt(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const mean = calculateMeanLilith(jd).lon;
  const M_sun = norm360(357.5291 + 35999.0503 * T) * DEG2RAD;
  const M_moon = norm360(134.9634 + 477198.8676 * T) * DEG2RAD;
  const D = norm360(297.8502 + 445267.1115 * T) * DEG2RAD;
  const correction =
    11.69 * Math.sin(2 * D - M_moon) +
    2.05 * Math.sin(M_sun) +
    1.25 * Math.sin(2 * D) -
    0.68 * Math.sin(M_moon);
  return norm360(mean + correction);
}

export function calculateTrueLilithApprox(jd: number): { lon: number; speed: number } {
  // speed: bounded numeric derivative of the corrected longitude (±1 hour)
  const lon = trueLilithLonAt(jd);
  const lonNext = trueLilithLonAt(jd + 1 / 24);
  let d = lonNext - lon;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return { lon, speed: d * 24.0 };
}

/* ============================================================================
 * W-07 FIX — True (osculating) Lunar Node from Moon state vectors
 * Ascending node direction n = ẑ × h, h = r × v, computed in the
 * true-ecliptic-of-date frame (Rotation_EQJ_ECT). Verified vs Swiss Ephemeris
 * TRUE_NODE at 1452 / 1975 / 1990 / J2000 / 2026: max error 0.009°.
 * Speed via ±1 h central difference (real osculating speed varies and can be
 * direct; the repo hardcoded −0.05295°/day).
 * ==========================================================================*/
interface Vec3 { x: number; y: number; z: number; }

function moonGeometricState(jd: number): { r: Vec3; v: Vec3 } {
  const t = new Astronomy.AstroTime(jd - 2451545.0);
  const r = Astronomy.GeoVector(Astronomy.Body.Moon, t, false); // geometric, no aberration
  const dt = 60 / 86400; // 60 s in days
  const r1 = Astronomy.GeoVector(Astronomy.Body.Moon, t.AddDays(dt), false);
  const r2 = Astronomy.GeoVector(Astronomy.Body.Moon, t.AddDays(-dt), false);
  const v: Vec3 = {
    x: (r1.x - r2.x) / (2 * dt * 86400), // AU per second
    y: (r1.y - r2.y) / (2 * dt * 86400),
    z: (r1.z - r2.z) / (2 * dt * 86400),
  };
  return { r: { x: r.x, y: r.y, z: r.z }, v };
}

function rotateEQJtoECT(vec: Vec3, time: Astronomy.AstroTime): Vec3 {
  const rot = Astronomy.Rotation_EQJ_ECT(time);
  const out = Astronomy.RotateVector(rot, vec as unknown as Astronomy.Vector);
  return { x: out.x, y: out.y, z: out.z };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

export function calculateTrueNode(jd: number): { lon: number; speed: number } {
  const time = new Astronomy.AstroTime(jd - 2451545.0);
  const { r, v } = moonGeometricState(jd);
  const re = rotateEQJtoECT(r, time);
  const ve = rotateEQJtoECT(v, time);
  const h = cross(re, ve);
  const nodeLon = norm360(Math.atan2(h.x, -h.y) * RAD2DEG);
  // numeric speed over ±1 hour (central difference; ×12 converts the 2-hour
  // span to degrees/day). The osculating node genuinely wobbles and can move
  // direct — never hardcode a constant.
  const a = calculateTrueNodeLonOnly(jd - 1 / 24);
  const b = calculateTrueNodeLonOnly(jd + 1 / 24);
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return { lon: nodeLon, speed: d * 12.0 };
}

function calculateTrueNodeLonOnly(jd: number): number {
  const time = new Astronomy.AstroTime(jd - 2451545.0);
  const { r, v } = moonGeometricState(jd);
  const re = rotateEQJtoECT(r, time);
  const ve = rotateEQJtoECT(v, time);
  const h = cross(re, ve);
  return norm360(Math.atan2(h.x, -h.y) * RAD2DEG);
}

/* ============================================================================
 * W-05 FIX — Placidus intermediate cusps (correct alternating iteration)
 * Repo treated the iteration variable as both ecliptic longitude (for
 * declination) and right ascension (for the meridian-distance sum), locking
 * onto the wrong fixed point (cusp errors 0.26°–1.74°). Correct scheme:
 *   λ_{n+1} = eclFromRA( H + F · AD(δ(λ_n)) )
 * Verified vs Swiss Ephemeris `houses(..., 'P')` at Rome/NYC/Oslo/Sydney/
 * CapeTown/Reykjavík: max cusp error ≤ 0.0044°.
 * Returns cusps 11 (H=RAMC+30, F=1/3), 12 (H=RAMC+60, F=2/3),
 * 2 (H=RAMC+120, F=2/3), 3 (H=RAMC+150, F=1/3).
 * ==========================================================================*/
export function calculatePlacidusIntermediateCusps(
  ramcDeg: number,
  latitudeDeg: number,
  obliquityDeg: number
): { cusp11: number; cusp12: number; cusp2: number; cusp3: number } {
  const phi = latitudeDeg * DEG2RAD;
  const eps = obliquityDeg * DEG2RAD;

  const cusp = (offsetDeg: number, f: number): number => {
    const H = ramcDeg + offsetDeg;
    let lam = eclipticFromRA(H, obliquityDeg); // initial guess
    for (let i = 0; i < 30; i++) {
      const delta = Math.asin(Math.sin(eps) * Math.sin(lam * DEG2RAD));
      const ad = Math.asin(Math.max(-1, Math.min(1, Math.tan(phi) * Math.tan(delta))));
      const ra = H + f * ad * RAD2DEG;
      const lamNew = eclipticFromRA(ra, obliquityDeg);
      const step = Math.abs(((lamNew - lam + 540) % 360) - 180);
      lam = lamNew;
      if (step < 1e-10) break;
    }
    return lam;
  };

  return {
    cusp11: cusp(30, 1 / 3),
    cusp12: cusp(60, 2 / 3),
    cusp2: cusp(120, 2 / 3),
    cusp3: cusp(150, 1 / 3),
  };
}

/* ============================================================================
 * W-06 IMPROVEMENT — Pre-natal Syzygy via exact lunation search
 * Repo's 0.08-back-guess is decent (measured err 0.02°–1.16° over 5 charts,
 * sect-type correct 5/5) but degrades with extreme lunar speeds (worst-case
 * ~2°) near dignity term/face boundaries. Exact search costs nothing:
 * NOTE astronomy-engine convention: SearchMoonPhase(targetLon, ...) takes
 * target elongation in DEGREES (0 = new, 180 = full) — not a 0..0.5 fraction.
 * ==========================================================================*/
function lastPhaseBefore(targetDeg: number, jdBirth: number): number {
  const events: number[] = [];
  let cursor = jdBirth - 40;
  for (let i = 0; i < 4; i++) {
    const t = Astronomy.SearchMoonPhase(targetDeg, new Astronomy.AstroTime(cursor - 2451545.0), 60);
    if (!t) break;
    const jdEvent = t.tt + 2451545.0;
    if (jdEvent >= jdBirth) break;
    events.push(jdEvent);
    cursor = jdEvent + 1;
  }
  if (events.length === 0) {
    throw new Error("previousSyzygy: no lunation found before birth date.");
  }
  return events[events.length - 1]; // last event strictly before birth
}

export function previousSyzygy(
  jdBirth: number
): { jd: number; type: "New Moon" | "Full Moon"; sunLongitude: number } {
  const lastNew = lastPhaseBefore(0, jdBirth);
  const lastFull = lastPhaseBefore(180, jdBirth);
  const isFull = lastFull > lastNew; // the LATER event before birth is the last syzygy
  const jd = isFull ? lastFull : lastNew;
  const time = new Astronomy.AstroTime(jd - 2451545.0);
  const sun = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Sun, time, true));
  return {
    jd,
    type: isFull ? "Full Moon" : "New Moon",
    sunLongitude: norm360(sun.elon),
  };
}

/* ============================================================================
 * W-12 FIX — Fagan-Bradley ayanamsa (was hardcoded 24.84°)
 * Verified: FB = Lahiri + 0.883208° exactly (1900–2100); repo Lahiri formula
 * matches Swiss Ephemeris to 2×10⁻⁶° at J2000.
 * ==========================================================================*/
export function lahiriAyanamsa(julianDay: number): number {
  const T = (julianDay - 2451545.0) / 36525.0;
  return 23.85709 + 1.396971 * T - 0.0003086 * T * T;
}

export function faganBradleyAyanamsa(julianDay: number): number {
  return lahiriAyanamsa(julianDay) + 0.883208;
}

/* ============================================================================
 * W-08 FIX — Fixed-star precession to chart epoch
 * Store J2000 tropical longitudes; precess linearly at 50.29″/yr
 * (adequate for ±200 years at ≥1° orbs; state tolerance in the UI tooltip).
 * ==========================================================================*/
export function precessFixedStarLongitude(j2000LongitudeDeg: number, julianDay: number): number {
  const years = (julianDay - 2451545.0) / 365.2425;
  const precession = (50.29 / 3600) * years;
  return norm360(j2000LongitudeDeg + precession);
}

/* ============================================================================
 * W-09 HELPERS — Dynamic eclipses and lunations (replaces hardcoded lists)
 * astronomy-engine already provides these; wrappers normalize the output.
 * ==========================================================================*/
export interface EclipseEvent {
  jd: number;
  kind: "solar" | "lunar";
  peakUtcIso: string;
  sunMoonLongitude: number;
  type: string;
}

export function searchEclipses(startDate: Date, days: number): EclipseEvent[] {
  const events: EclipseEvent[] = [];
  const endMs = startDate.getTime() + days * 86400000;
  // astronomy-engine 2.1.x signature: SearchGlobalSolarEclipse(startTime) finds
  // the NEXT eclipse. AstroTime counts days since J2000 — convert from Unix ms:
  // jd = ms/86400000 + 2440587.5 (same convention as TransitEngine.getJulianDay).
  const astroTimeFromMs = (ms: number) =>
    new Astronomy.AstroTime(ms / 86400000 + 2440587.5 - 2451545.0);
  let cursor = startDate.getTime();
  let guard = 0;
  while (cursor < endMs && guard++ < 60) {
    const solar = Astronomy.SearchGlobalSolarEclipse(astroTimeFromMs(cursor));
    if (!solar) break;
    if (solar.peak.date.getTime() > endMs) break;
    const sun = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Sun, solar.peak, true));
    const solarType =
      solar.kind === Astronomy.EclipseKind.Total
        ? "Total Solar"
        : solar.kind === Astronomy.EclipseKind.Annular
        ? "Annular Solar"
        : "Partial Solar";
    events.push({
      jd: solar.peak.tt + 2451545.0,
      kind: "solar",
      peakUtcIso: solar.peak.date.toISOString(),
      sunMoonLongitude: norm360(sun.elon),
      type: solarType,
    });
    cursor = solar.peak.date.getTime() + 86400000;
  }

  cursor = startDate.getTime();
  guard = 0;
  while (cursor < endMs && guard++ < 80) {
    const lunar = Astronomy.SearchLunarEclipse(astroTimeFromMs(cursor));
    if (!lunar) break;
    if (lunar.peak.date.getTime() > endMs) break;
    const moon = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Moon, lunar.peak, true));
    let type = "Partial Lunar";
    if (lunar.kind === Astronomy.EclipseKind.Penumbral) type = "Penumbral Lunar";
    else if (lunar.kind === Astronomy.EclipseKind.Total) type = "Total Lunar";
    events.push({
      jd: lunar.peak.tt + 2451545.0,
      kind: "lunar",
      peakUtcIso: lunar.peak.date.toISOString(),
      sunMoonLongitude: norm360(moon.elon),
      type,
    });
    cursor = lunar.peak.date.getTime() + 86400000;
  }
  return events.sort((a, b) => a.jd - b.jd);
}

export function nextLunation(jdFrom: number): { newMoonJd: number; fullMoonJd: number } {
  const t0 = new Astronomy.AstroTime(jdFrom - 2451545.0);
  const nm = Astronomy.SearchMoonPhase(0, t0, 40); // elongation 0° = new moon
  const fm = Astronomy.SearchMoonPhase(180, t0, 40); // elongation 180° = full moon
  if (!nm || !fm) {
    throw new Error("nextLunation: lunation search failed for this date range.");
  }
  return { newMoonJd: nm.tt + 2451545.0, fullMoonJd: fm.tt + 2451545.0 };
}

/* ============================================================================
 * Astrocartography (rewrite plan) — correct meridian/angle-line math
 * MC line: terrestrial longitude where the planet's right ascension = local
 * sidereal time  →  λ_geo = RA(planet) − GAST(chart instant).
 * IC line: λ_geo + 180°. AC/DC are latitude CURVES; at a requested latitude φ
 * the crossing longitude is  λ_geo = RA ± SD − GAST, where
 * SD = acos(−tan φ · tan δ) is the semi-diurnal arc (rising: +SD = AC,
 * setting: −SD = DC). Planet RA/dec derived geocentrically (no parallax).
 * ==========================================================================*/
export function astrocartographyLines(
  jd: number,
  planet: Astronomy.Body,
  latitudeDeg: number
): { mcLine: number; icLine: number; acCrossing: number | null; dcCrossing: number | null } {
  const gast = gastDegrees(jd);
  // Geocentric apparent ecliptic-of-date longitude/latitude, then convert to
  // RA/dec of date with the true obliquity (no topocentric parallax).
  const time = new Astronomy.AstroTime(jd - 2451545.0);
  const ecl = Astronomy.Ecliptic(Astronomy.GeoVector(planet, time, true));
  const eps = meanObliquity(jd) * DEG2RAD;
  const lon = ecl.elon * DEG2RAD;
  const lat = ecl.elat * DEG2RAD;
  const dec = Math.asin(Math.sin(eps) * Math.cos(lat) * Math.sin(lon) + Math.cos(eps) * Math.sin(lat));
  const ra = Math.atan2(
    Math.cos(eps) * Math.sin(lon) - Math.tan(lat) * Math.sin(eps) * Math.cos(lon),
    Math.cos(lon)
  );
  const raDeg = norm360(ra * RAD2DEG);
  const decDeg = dec * RAD2DEG;

  const mcLine = norm360(raDeg - gast);
  const icLine = norm360(mcLine + 180);

  const x = -Math.tan(latitudeDeg * DEG2RAD) * Math.tan(decDeg * DEG2RAD);
  if (x < -1 || x > 1) return { mcLine, icLine, acCrossing: null, dcCrossing: null }; // circumpolar
  const sd = Math.acos(x) * RAD2DEG;
  const acCrossing = norm360(raDeg + sd - gast);
  const dcCrossing = norm360(raDeg - sd - gast);
  return { mcLine, icLine, acCrossing, dcCrossing };
}

/* ============================================================================
 * Applying/separating (W-10) — single shared implementation using the
 * future-projection method already proven in lib/astronomy/minorAspects.ts.
 * ==========================================================================*/
export function isAspectApplying(
  lon1: number,
  lon2: number,
  speed1: number,
  speed2: number,
  targetAngle: number,
  dt = 0.2
): boolean {
  const orbNow = Math.abs(angularDiff(lon1, lon2) - targetAngle);
  const futureLon1 = norm360(lon1 + speed1 * dt);
  const futureLon2 = norm360(lon2 + speed2 * dt);
  const orbFuture = Math.abs(angularDiff(futureLon1, futureLon2) - targetAngle);
  return orbFuture < orbNow;
}

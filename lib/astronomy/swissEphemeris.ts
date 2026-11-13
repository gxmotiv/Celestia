/**
 * Compatibility facade for the application's historical Swiss Ephemeris-shaped API.
 * The actual planetary implementation in this repository uses astronomy-engine;
 * it is not the native Swiss Ephemeris/libswe library. See the project audit notes
 * for the underlying model and its validation limits.
 */

import * as Astronomy from "astronomy-engine";
import { calculateEastPointLongitude, calculateVertexLongitude } from "./anglePoints";

export interface SwissPlanetPosition {
  longitude: number;      // Ecliptic longitude in degrees, rounded for display (not an accuracy guarantee)
  latitude: number;       // Ecliptic latitude in degrees (not declination)
  distance: number;       // AU from Earth
  speed: number;          // Degrees per day (retrograde detection)
  isRetrograde: boolean;  // True if retrograde
  sign: string;           // Zodiac sign name
  degree: number;         // 0 to 29.999° in sign
  house: number | null;   // Assigned house number (1-12)
}

/** Selects which ascending lunar node model is used for the Rahu/Ketu pair. */
export type LunarNodeType = "mean" | "true";

export interface SwissAllPlanets {
  sun: SwissPlanetPosition;
  moon: SwissPlanetPosition;
  mercury: SwissPlanetPosition;
  venus: SwissPlanetPosition;
  mars: SwissPlanetPosition;
  jupiter: SwissPlanetPosition;
  saturn: SwissPlanetPosition;
  uranus: SwissPlanetPosition;
  neptune: SwissPlanetPosition;
  pluto: SwissPlanetPosition;
  rahu: SwissPlanetPosition;
  ketu: SwissPlanetPosition;
}

export interface SwissHouseResult {
  ascendant: number;
  midheaven: number;
  houseCusps: number[]; // Array of 12 house cusps (1-indexed semantics: [0..11] or 12 items)
  vertex: number;
  /** Local apparent sidereal time / RAMC in degrees, using the same model as house cusps. */
  localSiderealTime: number;
  /** True obliquity of date in degrees, matching Astronomy Engine GAST. */
  obliquity: number;
  houseSystemUsed: "P" | "W" | "E" | "O";
  equatorialAscendant: number;
}

export interface SwissAspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
  strength: number; // 0 to 1
}

export class SwissEphemerisEngine {
  // Planet IDs matching standard Swiss Ephemeris constants
  public readonly SUN = 0;
  public readonly MOON = 1;
  public readonly MERCURY = 2;
  public readonly VENUS = 3;
  public readonly MARS = 4;
  public readonly JUPITER = 5;
  public readonly SATURN = 6;
  public readonly URANUS = 7;
  public readonly NEPTUNE = 8;
  public readonly PLUTO = 9;
  public readonly MEAN_NODE = 10;
  public readonly TRUE_NODE = 11;

  // Calculation flags
  public readonly FLG_SWIEPH = 2;
  public readonly FLG_SPEED = 256;
  public readonly FLG_SIDEREAL = 65536;

  // Sidereal Ayanamsa modes
  public readonly SIDM_LAHIRI = 1;
  public readonly SIDM_RAMAN = 3;
  public readonly SIDM_KRISHNAMURTI = 5;

  private ephePath: string = "./ephe";
  private sidMode: number = 1;
  public swe: any = null;

  constructor() {
    this.initializeEphemeris();
  }

  public initializeEphemeris(): void {
    this.ephePath = "./ephe";
    this.sidMode = this.SIDM_LAHIRI;

    // Self-contained ephemeris interface consistent between SSR and client
    this.swe = {
      SUN: this.SUN,
      MOON: this.MOON,
      MERCURY: this.MERCURY,
      VENUS: this.VENUS,
      MARS: this.MARS,
      JUPITER: this.JUPITER,
      SATURN: this.SATURN,
      URANUS: this.URANUS,
      NEPTUNE: this.NEPTUNE,
      PLUTO: this.PLUTO,
      MEAN_NODE: this.MEAN_NODE,
      TRUE_NODE: this.TRUE_NODE,
      FLG_SWIEPH: this.FLG_SWIEPH,
      FLG_SPEED: this.FLG_SPEED,
      FLG_SIDEREAL: this.FLG_SIDEREAL,
      SIDM_LAHIRI: this.SIDM_LAHIRI,
      set_ephe_path: (path: string) => { this.ephePath = path; },
      set_sid_mode: (mode: number) => { this.sidMode = mode; },
      julday: (y: number, m: number, d: number, utHour: number) => this.julday(y, m, d, utHour),
    };
  }

  /**
   * Returns the application's polynomial Lahiri/Chitrapaksha-style ayanamsa
   * approximation for a Julian Day. This is not a native Swiss Ephemeris call
   * and is not independently certified as an exact value for every epoch.
   */
  public getAyanamsa(julianDay: number): number {
    if (!Number.isFinite(julianDay)) {
      throw new RangeError("Julian Day must be finite.");
    }
    const T = (julianDay - 2451545.0) / 36525.0;
    // IAE 1989 precession polynomial relative to J2000, applied to this app's
    // Lahiri-style J2000 zero point. Coefficients are arcseconds per century
    // (and higher powers thereof). This is an approximation, not native
    // Swiss Ephemeris SE_SIDM_LAHIRI and does not add a full nutation model.
    const ayanamsaArcseconds =
      85885.53 +
      5029.0966 * T +
      1.11161 * T * T -
      0.000113 * T * T * T;
    return ayanamsaArcseconds / 3600.0;
  }

  /**
   * Unambiguously normalizes a local calendar date and time with a numeric UTC offset (hours)
   * into a standardized UTC calendar instant (year, month, day, decimal hours).
   * Correctly handles negative hours, positive overflow, midnight rollbacks, leap years, and month transitions.
   *
   * Note on Timezones: The offset parameter is a fixed numeric UTC offset in hours.
   * Historical daylight saving time (DST) and regional timezone transitions cannot be inferred
   * from a numeric offset alone; callers must provide the applicable standard/daylight offset for historical dates.
   */
  public normalizeLocalToUTC(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number = 0,
    timezoneOffsetHours: number = 0
  ): { utcYear: number; utcMonth: number; utcDay: number; utcDecimalHour: number } {
    let utcDecimalHour = hour - timezoneOffsetHours + minute / 60.0 + second / 3600.0;
    let utcYear = year;
    let utcMonth = month;
    let utcDay = day;

    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const daysInMonth = (y: number, m: number) => {
      if (m === 2) return isLeapYear(y) ? 29 : 28;
      if (m === 4 || m === 6 || m === 9 || m === 11) return 30;
      return 31;
    };

    while (utcDecimalHour < 0) {
      utcDecimalHour += 24.0;
      utcDay -= 1;
      if (utcDay < 1) {
        utcMonth -= 1;
        if (utcMonth < 1) {
          utcMonth = 12;
          utcYear -= 1;
        }
        utcDay = daysInMonth(utcYear, utcMonth);
      }
    }

    while (utcDecimalHour >= 24.0) {
      utcDecimalHour -= 24.0;
      utcDay += 1;
      const maxDays = daysInMonth(utcYear, utcMonth);
      if (utcDay > maxDays) {
        utcDay = 1;
        utcMonth += 1;
        if (utcMonth > 12) {
          utcMonth = 1;
          utcYear += 1;
        }
      }
    }

    return { utcYear, utcMonth, utcDay, utcDecimalHour };
  }

  /**
   * Constructs a Date object representing the true UTC instant corresponding
   * to a local calendar date, time, and numeric timezone offset.
   * Correctly accounts for timezone offsets, day/month/year boundaries, and leap years.
   */
  public createUTCDate(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number = 0,
    timezoneOffsetHours: number = 0
  ): Date {
    const { utcYear, utcMonth, utcDay, utcDecimalHour } = this.normalizeLocalToUTC(
      year,
      month,
      day,
      hour,
      minute,
      second,
      timezoneOffsetHours
    );
    const totalUtcSeconds = Math.round(utcDecimalHour * 3600);
    const utcHour = Math.floor(totalUtcSeconds / 3600);
    const utcMinute = Math.floor((totalUtcSeconds % 3600) / 60);
    const utcSecond = totalUtcSeconds % 60;
    const date = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute, utcSecond));
    if (utcYear >= 0 && utcYear <= 99) {
      date.setUTCFullYear(utcYear);
    }
    return date;
  }

  /**
   * Calculates Julian Day from normalized UTC calendar components using the standard
   * Meeus algorithm (Astronomical Algorithms, 2nd ed., Chapter 7).
   */
  public juldayFromUTC(year: number, month: number, day: number, utcDecimalHour: number = 0): number {
    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    const decimalDay = day + utcDecimalHour / 24.0;
    const A = Math.floor(y / 100.0);
    const B = 2 - A + Math.floor(A / 4.0);
    return (
      Math.floor(365.25 * (y + 4716)) +
      Math.floor(30.6001 * (m + 1)) +
      decimalDay +
      B -
      1524.5
    );
  }

  /**
   * Internal julday calculation for Swiss Ephemeris compatibility interface:
   * takes calendar date and utHour (which may be negative or >= 24).
   */
  public julday(year: number, month: number, day: number, utHour: number): number {
    const { utcYear, utcMonth, utcDay, utcDecimalHour } = this.normalizeLocalToUTC(
      year,
      month,
      day,
      utHour,
      0,
      0,
      0
    );
    return this.juldayFromUTC(utcYear, utcMonth, utcDay, utcDecimalHour);
  }

  /**
   * Calculate Julian Day from date/time with timezone offset
   */
  public calculateJulianDay(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number = 0,
    timezone: number = 0
  ): number {
    const { utcYear, utcMonth, utcDay, utcDecimalHour } = this.normalizeLocalToUTC(
      year,
      month,
      day,
      hour,
      minute,
      second,
      timezone
    );
    return this.juldayFromUTC(utcYear, utcMonth, utcDay, utcDecimalHour);
  }

  /**
   * Calculate an apparent geocentric position using astronomy-engine.
   * Returned coordinates are rounded to 0.0001°; decimal places do not
   * represent the underlying ephemeris accuracy.
   */
  public calculatePlanetPosition(
    planet: number,
    julianDay: number,
    isSidereal: boolean = false
  ): SwissPlanetPosition {
    const time = new Astronomy.AstroTime(julianDay - 2451545.0);

    let body: Astronomy.Body | null = null;
    switch (planet) {
      case this.SUN: body = Astronomy.Body.Sun; break;
      case this.MOON: body = Astronomy.Body.Moon; break;
      case this.MERCURY: body = Astronomy.Body.Mercury; break;
      case this.VENUS: body = Astronomy.Body.Venus; break;
      case this.MARS: body = Astronomy.Body.Mars; break;
      case this.JUPITER: body = Astronomy.Body.Jupiter; break;
      case this.SATURN: body = Astronomy.Body.Saturn; break;
      case this.URANUS: body = Astronomy.Body.Uranus; break;
      case this.NEPTUNE: body = Astronomy.Body.Neptune; break;
      case this.PLUTO: body = Astronomy.Body.Pluto; break;
      default: body = null;
    }

    let lon = 0;
    let lat = 0;
    let dist = 1;
    let speed = 0;

    if (body !== null) {
      // Request the library's apparent geocentric vector, then transform it to ecliptic coordinates.
      const vec = Astronomy.GeoVector(body, time, true);
      const ecl = Astronomy.Ecliptic(vec);
      lon = (ecl.elon % 360 + 360) % 360;
      lat = ecl.elat;
      dist = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);

      // Speed calculation over 1 hour delta (degrees per day)
      const timeNext = time.AddDays(1 / 24.0);
      const vecNext = Astronomy.GeoVector(body, timeNext, true);
      const eclNext = Astronomy.Ecliptic(vecNext);
      let diff = eclNext.elon - ecl.elon;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      speed = diff * 24.0;
    } else if (planet === this.MEAN_NODE || planet === this.TRUE_NODE) {
      // Mean-node polynomial and this application's approximate true-node
      // periodic corrections. These are not calls to Swiss Ephemeris/libswe.
      const T = (julianDay - 2451545.0) / 36525.0;
      let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;

      if (planet === this.TRUE_NODE) {
        // Periodic perturbations for True Node (evection, variation, solar inequality)
        const sunVec = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
        const sunEcl = Astronomy.Ecliptic(sunVec);
        const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, time, true);
        const moonEcl = Astronomy.Ecliptic(moonVec);
        const D2 = 2 * (moonEcl.elon - sunEcl.elon) * (Math.PI / 180);
        const M = (357.5291 + 35999.05029 * T) * (Math.PI / 180);
        omega += -1.4979 * Math.sin(2 * (moonEcl.elon - omega) * (Math.PI / 180))
                 - 0.1500 * Math.sin(M)
                 - 0.1226 * Math.sin(D2);
      }

      lon = (omega % 360 + 360) % 360;
      speed = -0.05295; // Approximate mean retrograde rate (also used for this true-node approximation)
      dist = 0.00257; // Average lunar distance in AU
    }

    if (isSidereal) {
      const ayanamsa = this.getAyanamsa(julianDay);
      lon = ((lon - ayanamsa) % 360 + 360) % 360;
    }

    // Display/API output is rounded to 0.0001°; this is not a universal accuracy guarantee.
    const round4 = (v: number) => Math.round(v * 10000) / 10000;

    return {
      longitude: round4(lon),
      latitude: round4(lat),
      distance: Math.round(dist * 100000) / 100000,
      speed: round4(speed),
      isRetrograde: speed < 0,
      sign: this.getZodiacSign(lon),
      degree: round4(lon % 30),
      house: null,
    };
  }

  /**
   * Unrounded apparent geocentric tropical solar longitude from astronomy-engine.
   * This is deliberately separate from the rounded display-oriented planet result.
   */
  public getApparentSunLongitude(julianDay: number): number {
    if (!Number.isFinite(julianDay)) {
      throw new RangeError("Julian Day must be finite.");
    }
    const time = new Astronomy.AstroTime(julianDay - 2451545.0);
    const vector = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
    const ecliptic = Astronomy.Ecliptic(vector);
    return ((ecliptic.elon % 360) + 360) % 360;
  }

  /**
   * Unrounded apparent geocentric tropical lunar longitude for event-time solving.
   * The normal planet-position API rounds to 0.0001° for display; return searches
   * must use the underlying longitude to avoid a several-tenths-of-a-second plateau.
   */
  public getApparentMoonLongitude(julianDay: number): number {
    if (!Number.isFinite(julianDay)) {
      throw new RangeError("Julian Day must be finite.");
    }
    const time = new Astronomy.AstroTime(julianDay - 2451545.0);
    const vector = Astronomy.GeoVector(Astronomy.Body.Moon, time, true);
    const ecliptic = Astronomy.Ecliptic(vector);
    return ((ecliptic.elon % 360) + 360) % 360;
  }

  /**
   * Return the ten major planetary positions and one internally consistent
   * Rahu/Ketu pair. Ketu is always exactly 180° from the selected ascending
   * node model; it is never calculated from a different node model.
   *
   * The default preserves the prior chart convention (mean node). Pass "true"
   * to use this engine's approximate true-node formula for both ends.
   */
  public calculateAllPlanets(
    julianDay: number,
    isSidereal: boolean = false,
    nodeType: LunarNodeType = "mean"
  ): SwissAllPlanets {
    if (nodeType !== "mean" && nodeType !== "true") {
      throw new RangeError("Lunar node type must be 'mean' or 'true'.");
    }

    const ascendingNode = this.calculatePlanetPosition(
      nodeType === "mean" ? this.MEAN_NODE : this.TRUE_NODE,
      julianDay,
      isSidereal
    );
    const ketuLongitude = Math.round((((ascendingNode.longitude + 180) % 360) + 360) % 360 * 10000) / 10000;
    const ketu: SwissPlanetPosition = {
      ...ascendingNode,
      longitude: ketuLongitude,
      sign: this.getZodiacSign(ketuLongitude),
      degree: Math.round((ketuLongitude % 30) * 10000) / 10000,
      latitude: 0,
      isRetrograde: ascendingNode.speed < 0,
    };

    return {
      sun: this.calculatePlanetPosition(this.SUN, julianDay, isSidereal),
      moon: this.calculatePlanetPosition(this.MOON, julianDay, isSidereal),
      mercury: this.calculatePlanetPosition(this.MERCURY, julianDay, isSidereal),
      venus: this.calculatePlanetPosition(this.VENUS, julianDay, isSidereal),
      mars: this.calculatePlanetPosition(this.MARS, julianDay, isSidereal),
      jupiter: this.calculatePlanetPosition(this.JUPITER, julianDay, isSidereal),
      saturn: this.calculatePlanetPosition(this.SATURN, julianDay, isSidereal),
      uranus: this.calculatePlanetPosition(this.URANUS, julianDay, isSidereal),
      neptune: this.calculatePlanetPosition(this.NEPTUNE, julianDay, isSidereal),
      pluto: this.calculatePlanetPosition(this.PLUTO, julianDay, isSidereal),
      rahu: ascendingNode,
      ketu,
    };
  }

  /**
   * Calculate astrological houses (Placidus, Equal, Whole Sign)
   */
  public calculateHouses(
    julianDay: number,
    latitude: number,
    longitude: number,
    system: "P" | "W" | "E" | "O" = "P"
  ): SwissHouseResult {
    if (!Number.isFinite(julianDay) || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new RangeError("House calculation requires a finite Julian Day, latitude within ±90°, and longitude within ±180°.");
    }
    const time = new Astronomy.AstroTime(julianDay - 2451545.0);

    // Greenwich Apparent Sidereal Time (GST) in hours
    const gstHours = Astronomy.SiderealTime(time);
    // Right Ascension of Midheaven (RAMC) in degrees
    const ramc = ((gstHours * 15.0 + longitude) % 360.0 + 360.0) % 360.0;

    // SiderealTime() returns Greenwich Apparent Sidereal Time (GAST), whose
    // reference equinox includes nutation. Use the matching true obliquity of
    // date rather than mixing GAST with a mean-obliquity polynomial.
    const earthTilt = Astronomy.e_tilt(time);
    const epsDeg = earthTilt.tobl;
    if (!Number.isFinite(epsDeg)) {
      throw new RangeError("Astronomy Engine returned an invalid true obliquity.");
    }
    const eps = epsDeg * (Math.PI / 180.0);
    const phi = latitude * (Math.PI / 180.0);
    const radRamc = ramc * (Math.PI / 180.0);

    // Midheaven (MC): ecliptic longitude of upper culmination
    let mc = Math.atan2(Math.sin(radRamc), Math.cos(radRamc) * Math.cos(eps)) * (180.0 / Math.PI);
    if (mc < 0) mc += 360.0;

    // Ascendant (ASC): eastern horizon intersection with ecliptic
    let asc = Math.atan2(
      Math.cos(radRamc),
      -Math.sin(radRamc) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps)
    ) * (180.0 / Math.PI);
    if (asc < 0) asc += 360.0;

    const vertex = calculateVertexLongitude(ramc, latitude, epsDeg);
    const equatorialAscendant = calculateEastPointLongitude(ramc, epsDeg);

    // Placidus is undefined at polar-circle latitudes. Use the standard Porphyry
    // quadrant fallback explicitly instead of allowing a trigonometric result to
    // masquerade as a valid Placidus chart.
    let systemUsed: "P" | "W" | "E" | "O" = system === "P" && Math.abs(latitude) >= 66.5622 ? "O" : system;
    const cusps: number[] = new Array(12);

    if (systemUsed === "W") {
      // Whole Sign System: House 1 begins at 0° of Ascendant sign
      const ascSignIdx = Math.floor(asc / 30);
      for (let i = 0; i < 12; i++) {
        cusps[i] = ((ascSignIdx + i) % 12) * 30.0;
      }
    } else if (systemUsed === "E") {
      // Equal House System: 30° divisions starting from ASC
      for (let i = 0; i < 12; i++) {
        cusps[i] = (asc + i * 30.0) % 360.0;
      }
    } else if (systemUsed === "O") {
      // Porphyry: divide each ecliptic quadrant into three equal arcs.
      const ascendant = asc;
      const descendant = (asc + 180.0) % 360.0;
      const ic = (mc + 180.0) % 360.0;
      const forwardArc = (from: number, to: number) => ((to - from) % 360 + 360) % 360;
      const q1 = forwardArc(ascendant, ic);
      const q2 = forwardArc(ic, descendant);
      const q3 = forwardArc(descendant, mc);
      const q4 = forwardArc(mc, ascendant);
      cusps[0] = ascendant;
      cusps[1] = (ascendant + q1 / 3) % 360;
      cusps[2] = (ascendant + 2 * q1 / 3) % 360;
      cusps[3] = ic;
      cusps[4] = (ic + q2 / 3) % 360;
      cusps[5] = (ic + 2 * q2 / 3) % 360;
      cusps[6] = descendant;
      cusps[7] = (descendant + q3 / 3) % 360;
      cusps[8] = (descendant + 2 * q3 / 3) % 360;
      cusps[9] = mc;
      cusps[10] = (mc + q4 / 3) % 360;
      cusps[11] = (mc + 2 * q4 / 3) % 360;
    } else {
      // Placidus House System
      cusps[3] = (mc + 180.0) % 360.0; // 4th house (IC)
      cusps[0] = asc; // 1st house
      cusps[6] = (asc + 180.0) % 360.0; // 7th house (DESC)
      cusps[9] = mc; // 10th house (MC)

      // Calculate Placidus semi-arc cusps (11, 12, 2, 3)
      const calcPlacidusCusp = (f: number, ramcOffset: number): number => {
        let r = (ramc + ramcOffset) * (Math.PI / 180.0);
        for (let iter = 0; iter < 10; iter++) {
          // The iteration variable r is right ascension. Declination must
          // be computed from the corresponding ecliptic longitude, not from
          // right ascension itself. Convert RA -> ecliptic longitude first.
          const eclipticLongitude = Math.atan2(
            Math.sin(r),
            Math.cos(r) * Math.cos(eps)
          );
          const sinDec = Math.sin(eps) * Math.sin(eclipticLongitude);
          const cosDec = Math.sqrt(Math.max(0, 1 - sinDec * sinDec));
          const tanDec = sinDec / Math.max(cosDec, 1e-12);
          const semiArcRatio = Math.asin(Math.max(-1, Math.min(1, Math.tan(phi) * tanDec))) * f;
          r = (ramc + ramcOffset) * (Math.PI / 180.0) + semiArcRatio;
        }
        let cusp = Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(eps)) * (180.0 / Math.PI);
        if (cusp < 0) cusp += 360.0;
        return cusp;
      };

      try {
        cusps[10] = calcPlacidusCusp(1 / 3, 30.0); // 11th house
        cusps[11] = calcPlacidusCusp(2 / 3, 60.0); // 12th house
        cusps[1] = calcPlacidusCusp(2 / 3, 120.0); // 2nd house
        cusps[2] = calcPlacidusCusp(1 / 3, 150.0); // 3rd house

        cusps[4] = (cusps[10] + 180.0) % 360.0; // 5th house
        cusps[5] = (cusps[11] + 180.0) % 360.0; // 6th house
        cusps[7] = (cusps[1] + 180.0) % 360.0;  // 8th house
        cusps[8] = (cusps[2] + 180.0) % 360.0;  // 9th house
      } catch {
        // A numerical Placidus failure must never be reported as Placidus.
        // Use the explicit Porphyry quadrant method and expose that fallback.
        systemUsed = "O";
        const ascendant = asc;
        const descendant = (asc + 180.0) % 360.0;
        const ic = (mc + 180.0) % 360.0;
        const forwardArc = (from: number, to: number) => ((to - from) % 360 + 360) % 360;
        const quadrants = [
          [ascendant, ic],
          [ic, descendant],
          [descendant, mc],
          [mc, ascendant],
        ] as const;
        for (let quadrant = 0; quadrant < 4; quadrant++) {
          const [start, end] = quadrants[quadrant];
          const arc = forwardArc(start, end);
          const base = quadrant * 3;
          cusps[base] = start;
          cusps[base + 1] = (start + arc / 3) % 360;
          cusps[base + 2] = (start + 2 * arc / 3) % 360;
        }
      }
    }

    const hasTwelveFiniteCusps = () =>
      Array.from({ length: 12 }, (_, index) => cusps[index]).every(Number.isFinite);

    if (!hasTwelveFiniteCusps() && systemUsed !== "O") {
      // Math functions return NaN rather than throwing for some invalid
      // semi-arc configurations. Detect that explicitly and resolve using
      // the documented Porphyry quadrant fallback.
      systemUsed = "O";
      const ascendant = asc;
      const descendant = (asc + 180.0) % 360.0;
      const ic = (mc + 180.0) % 360.0;
      const forwardArc = (from: number, to: number) => ((to - from) % 360 + 360) % 360;
      const quadrants = [
        [ascendant, ic],
        [ic, descendant],
        [descendant, mc],
        [mc, ascendant],
      ] as const;
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const [start, end] = quadrants[quadrant];
        const arc = forwardArc(start, end);
        const base = quadrant * 3;
        cusps[base] = start;
        cusps[base + 1] = (start + arc / 3) % 360;
        cusps[base + 2] = (start + 2 * arc / 3) % 360;
      }
    }

    if (!hasTwelveFiniteCusps() || !Number.isFinite(asc) || !Number.isFinite(mc)) {
      throw new RangeError("House calculation could not produce twelve finite cusps and valid angles.");
    }

    const round4 = (v: number) => Math.round(v * 10000) / 10000;

    return {
      ascendant: round4(asc),
      midheaven: round4(mc),
      houseCusps: cusps.map(round4),
      vertex: round4(vertex),
      localSiderealTime: round4(ramc),
      obliquity: round4(epsDeg),
      houseSystemUsed: systemUsed,
      equatorialAscendant: round4(equatorialAscendant),
    };
  }

  /**
   * Calculate astrological aspects between planetary positions
   */
  public calculateAspects(planets: Record<string, SwissPlanetPosition>): SwissAspect[] {
    const aspects: SwissAspect[] = [];
    const aspectOrbs: Record<string, { angle: number; orb: number }> = {
      conjunction: { angle: 0, orb: 8 },
      sextile: { angle: 60, orb: 4 },
      square: { angle: 90, orb: 6 },
      trine: { angle: 120, orb: 6 },
      opposition: { angle: 180, orb: 8 },
    };

    const planetNames = Object.keys(planets);

    for (let i = 0; i < planetNames.length; i++) {
      for (let j = i + 1; j < planetNames.length; j++) {
        const p1Name = planetNames[i];
        const p2Name = planetNames[j];
        const planet1 = planets[p1Name];
        const planet2 = planets[p2Name];

        if (!planet1 || !planet2) continue;

        let angle = Math.abs(planet1.longitude - planet2.longitude);
        const normalizedAngle = angle > 180 ? 360 - angle : angle;

        for (const [aspectType, { angle: targetAngle, orb: maxOrb }] of Object.entries(aspectOrbs)) {
          const difference = Math.abs(normalizedAngle - targetAngle);

          if (difference <= maxOrb) {
            aspects.push({
              planet1: p1Name,
              planet2: p2Name,
              type: aspectType,
              angle: Math.round(normalizedAngle * 100) / 100,
              orb: Math.round(difference * 100) / 100,
              strength: Math.round((1 - difference / maxOrb) * 100) / 100,
            });
            break;
          }
        }
      }
    }

    return aspects.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Helper: Get zodiac sign from longitude
   */
  public getZodiacSign(longitude: number): string {
    const signs = [
      "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
    const norm = (longitude % 360 + 360) % 360;
    return signs[Math.floor(norm / 30)] || "Aries";
  }
}

// Export singleton instance for immediate consumption
export const swissEphemeris = new SwissEphemerisEngine();

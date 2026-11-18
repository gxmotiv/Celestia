/**
 * Astronomy Engine-based astronomical adapter.
 *
 * This module uses the `astronomy-engine` package for planetary vectors and
 * ecliptic coordinates, plus local approximations for lunar nodes and other
 * derived values. It is NOT a native Swiss Ephemeris integration and has not
 * been certified to a fixed angular-accuracy threshold. Returned decimal places
 * describe formatting/resolution only, not measured astronomical accuracy.
 *
 * The historical Swiss-prefixed exports are retained for source compatibility.
 */

import * as Astronomy from "astronomy-engine";

export interface SwissPlanetPosition {
  longitude: number;      // Ecliptic longitude in degrees; accuracy not independently certified
  latitude: number;       // Declination / celestial latitude
  distance: number;       // AU from Earth
  speed: number;          // Degrees per day (retrograde detection)
  isRetrograde: boolean;  // True if retrograde
  sign: string;           // Zodiac sign name
  degree: number;         // 0 to 29.999° in sign
  house: number | null;   // Assigned house number (1-12)
}

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
  /** Mean ascending node (north node); legacy Rahu alias uses this model. */
  meanNorthNode: SwissPlanetPosition;
  /** Mean descending node: exactly opposite the mean ascending node. */
  meanSouthNode: SwissPlanetPosition;
  /** State-vector-derived true ascending node; still provisional against the pinned lunar model. */
  trueNorthNode: SwissPlanetPosition;
  /** True descending node approximation: exactly opposite the true ascending node. */
  trueSouthNode: SwissPlanetPosition;
  /** Backward-compatible alias for meanNorthNode. */
  rahu: SwissPlanetPosition;
  /** Backward-compatible alias for meanSouthNode. */
  ketu: SwissPlanetPosition;
}

export interface SwissHouseResult {
  ascendant: number;
  midheaven: number;
  houseCusps: number[]; // Array of 12 house cusps (1-indexed semantics: [0..11] or 12 items)
  vertex: number;
  houseSystemUsed: "P" | "W" | "E";
  fallbackReason?: string;
}

export interface SwissAspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
  strength: number; // 0 to 1
}

/**
 * @deprecated Historical name retained for compatibility. This is an
 * Astronomy Engine-based adapter, not the Swiss Ephemeris library.
 */
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
   * Calculates the module's Chitra Paksha (Lahiri) ayanamsa approximation for a Julian Day
   */
  public getAyanamsa(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    // IAU Chitra Paksha / Lahiri Ayanamsa: 23°51'25.53" at J2000.0 (23.85709°)
    const ayanamsa = 23.85709 + 1.396971 * T - 0.0003086 * T * T;
    return ayanamsa;
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
   * Calculate a planetary position using the configured Astronomy Engine path.
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
      // Calculate apparent geocentric ecliptic coordinates (including light-time aberration & nutation)
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
      // Mean and true node longitudes use separate models. Speed is derived
      // numerically from the same model rather than assigning the mean-node
      // rate to the oscillating true node.
      lon = this.calculateLunarNodeLongitude(planet, julianDay);
      const halfStepDays = 1 / 48; // 30 minutes on either side (1-hour total span).
      const before = this.calculateLunarNodeLongitude(planet, julianDay - halfStepDays);
      const after = this.calculateLunarNodeLongitude(planet, julianDay + halfStepDays);
      let delta = after - before;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      speed = delta / (2 * halfStepDays);
      dist = 0.00257; // Legacy API placeholder only; lunar nodes have no physical body-distance.
    }

    if (isSidereal) {
      const ayanamsa = this.getAyanamsa(julianDay);
      lon = ((lon - ayanamsa) % 360 + 360) % 360;
    }

    // Round for stable display/output. Decimal places do not establish physical accuracy.
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
   * Calculate the ascending node of the Moon's osculating geocentric orbit.
   *
   * The lunar angular-momentum vector h = r x v is normal to the instantaneous
   * orbital plane. Rotate h from Astronomy Engine's EQJ frame into its true
   * ecliptic-of-date frame. The ascending intersection direction is k x h,
   * where k is the ecliptic north pole (0, 0, 1). Its longitude is atan2(hx, -hy).
   *
   * This is a state-vector calculation, not Swiss Ephemeris. The accuracy of
   * the dependency's lunar state is independently benchmarked only over the
   * frozen JPL samples in tests/fixtures/jpl-moon-state-vectors.json.
   */
  private calculateTrueLunarNodeLongitude(julianDay: number): number {
    const time = new Astronomy.AstroTime(julianDay - 2451545.0);
    const moon = Astronomy.GeoMoonState(time);

    const hx = moon.y * moon.vz - moon.z * moon.vy;
    const hy = moon.z * moon.vx - moon.x * moon.vz;
    const hz = moon.x * moon.vy - moon.y * moon.vx;
    const hMagnitude = Math.hypot(hx, hy, hz);

    if (!Number.isFinite(hMagnitude) || hMagnitude < 1e-18) {
      throw new Error("Cannot calculate the true lunar node: invalid lunar angular-momentum vector.");
    }

    // Ecliptic() rotates an EQJ vector to the true ecliptic of date (ECT).
    // Transforming h as a vector keeps the plane normal in the same frame
    // used to define the ecliptic intersection.
    const hEcliptic = Astronomy.Ecliptic(
      new Astronomy.Vector(hx, hy, hz, time)
    ).vec;

    const nodeLongitude = Math.atan2(hEcliptic.x, -hEcliptic.y) * (180 / Math.PI);
    return ((nodeLongitude % 360) + 360) % 360;
  }

  /**
   * Calculate the mean ascending lunar node using the current local polynomial.
   * This remains a separate approximation and is not claimed to match Swiss
   * Ephemeris' Moshier/ELP-based mean-node calculation.
   */
  private calculateLunarNodeLongitude(planet: number, julianDay: number): number {
    if (planet === this.TRUE_NODE) {
      return this.calculateTrueLunarNodeLongitude(julianDay);
    }

    const T = (julianDay - 2451545.0) / 36525.0;
    const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
    return ((omega % 360) + 360) % 360;
  }

  /**
   * Calculate ALL planets at once (Tropical or Sidereal)
   */
  public calculateAllPlanets(julianDay: number, isSidereal: boolean = false): SwissAllPlanets {
    const meanNorthNode = this.calculatePlanetPosition(this.MEAN_NODE, julianDay, isSidereal);
    const trueNorthNode = this.calculatePlanetPosition(this.TRUE_NODE, julianDay, isSidereal);

    // A lunar nodal axis uses one node model consistently: the descending node
    // is exactly 180° from the corresponding ascending node. Never pair mean
    // Rahu with true Ketu, because both MEAN_NODE and TRUE_NODE are north nodes.
    const makeSouthNode = (northNode: SwissPlanetPosition): SwissPlanetPosition => {
      const longitude = Math.round((((northNode.longitude + 180) % 360 + 360) % 360) * 10000) / 10000;
      return {
        ...northNode,
        longitude,
        sign: this.getZodiacSign(longitude),
        degree: Math.round((longitude % 30) * 10000) / 10000,
        isRetrograde: northNode.speed < 0,
      };
    };

    const meanSouthNode = makeSouthNode(meanNorthNode);
    const trueSouthNode = makeSouthNode(trueNorthNode);

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
      meanNorthNode,
      meanSouthNode,
      trueNorthNode,
      trueSouthNode,
      // Existing API aliases stay mean-node based for deterministic compatibility.
      rahu: meanNorthNode,
      ketu: meanSouthNode,
    };
  }

  /**
   * Calculate astrological houses (Placidus, Equal, Whole Sign)
   */
  public calculateHouses(
    julianDay: number,
    latitude: number,
    longitude: number,
    system: "P" | "W" | "E" = "P"
  ): SwissHouseResult {
    const time = new Astronomy.AstroTime(julianDay - 2451545.0);

    // Greenwich Apparent Sidereal Time (GST) in hours
    const gstHours = Astronomy.SiderealTime(time);
    // Right Ascension of Midheaven (RAMC) in degrees
    const ramc = ((gstHours * 15.0 + longitude) % 360.0 + 360.0) % 360.0;

    // True Obliquity of the Ecliptic with nutation
    const T = (julianDay - 2451545.0) / 36525.0;
    const epsDeg = 23.4392911 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
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

    // Vertex calculation (western electric axis)
    const ramcVertex = (ramc + 180.0) * (Math.PI / 180.0);
    let vertex = Math.atan2(
      Math.cos(ramcVertex),
      -Math.sin(ramcVertex) * Math.cos(eps) + (1 / Math.tan(phi || 0.0001)) * Math.sin(eps)
    ) * (180.0 / Math.PI);
    if (vertex < 0) vertex += 360.0;

    const cusps: number[] = new Array(12);
    let houseSystemUsed: "P" | "W" | "E" = system;
    let fallbackReason: string | undefined;

    const setEqualHouseCusps = () => {
      for (let i = 0; i < 12; i++) {
        cusps[i] = (asc + i * 30.0) % 360.0;
      }
    };

    if (system === "W") {
      // Whole Sign: House 1 begins at 0° of the Ascendant sign.
      const ascSignIdx = Math.floor(asc / 30);
      for (let i = 0; i < 12; i++) {
        cusps[i] = ((ascSignIdx + i) % 12) * 30.0;
      }
    } else if (system === "E") {
      // Equal House: 30° divisions starting from the exact Ascendant degree.
      setEqualHouseCusps();
    } else {
      // Placidus is not reliably defined at polar latitudes. Use a documented
      // Equal-house fallback instead of letting trigonometric results become NaN.
      if (Math.abs(latitude) >= 66) {
        houseSystemUsed = "E";
        fallbackReason =
          "Placidus is not reliably defined at latitudes of 66° or higher; Equal houses were used.";
        setEqualHouseCusps();
      } else {
        cusps[9] = mc; // 10th house
        cusps[3] = (mc + 180.0) % 360.0; // 4th house (IC)
        cusps[0] = asc; // 1st house
        cusps[6] = (asc + 180.0) % 360.0; // 7th house (DESC)

        const calcPlacidusCusp = (f: number, ramcOffset: number): number => {
          let r = (ramc + ramcOffset) * (Math.PI / 180.0);
          for (let iter = 0; iter < 10; iter++) {
            const sinDec = Math.sin(eps) * Math.sin(r);
            const cosDec = Math.cos(Math.asin(Math.max(-1, Math.min(1, sinDec))));
            const tanDec = sinDec / (cosDec || 0.0001);
            const semiArcRatio = Math.asin(
              Math.max(-1, Math.min(1, Math.tan(phi) * tanDec))
            ) * f;
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
          cusps[7] = (cusps[1] + 180.0) % 360.0; // 8th house
          cusps[8] = (cusps[2] + 180.0) % 360.0; // 9th house

          if (!cusps.every((value) => Number.isFinite(value) && value >= 0 && value < 360)) {
            throw new Error("Placidus produced a non-finite house cusp.");
          }
        } catch {
          houseSystemUsed = "E";
          fallbackReason =
            "The Placidus calculation was numerically unstable at this location; Equal houses were used.";
          setEqualHouseCusps();
        }
      }
    }

    const round4 = (v: number) => Math.round(v * 10000) / 10000;

    return {
      ascendant: round4(asc),
      midheaven: round4(mc),
      houseCusps: cusps.map(round4),
      vertex: round4(vertex),
      houseSystemUsed,
      fallbackReason,
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

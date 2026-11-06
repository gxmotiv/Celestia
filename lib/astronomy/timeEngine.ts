/**
 * BaZi local-clock conversion utilities.
 *
 * All inputs are explicit UTC instants. Longitude is east-positive.
 * Equation of Time follows Meeus, Astronomical Algorithms, Chapter 28:
 * EOT = apparent solar time - local mean solar time.
 */
export type BaZiTimeBasis = "civil-clock" | "local-mean-solar" | "local-apparent-solar";

export interface BaZiClockOptions {
  timeBasis: BaZiTimeBasis;
  longitudeDegrees: number;
  /** Required for civil-clock mode; east of UTC is positive. May include seconds. */
  civilUtcOffsetSeconds?: number;
}

export interface BaZiClockResult {
  clockDate: Date;
  timeBasis: BaZiTimeBasis;
  longitudeDegrees: number;
  longitudeCorrectionSeconds: number;
  equationOfTimeMinutes: number;
  civilUtcOffsetSeconds?: number;
}

const DAY_MS = 86_400_000;
const J2000_JD = 2_451_545.0;

function assertValidInstant(instant: Date): void {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw new RangeError("A valid UTC Date instant is required.");
  }
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

/**
 * Meeus Chapter 28 Equation of Time in minutes.
 * Positive means apparent solar time is ahead of mean solar time.
 */
export function equationOfTimeMinutes(utcInstant: Date): number {
  assertValidInstant(utcInstant);
  const jd = utcInstant.getTime() / DAY_MS + 2_440_587.5;
  const T = (jd - J2000_JD) / 36_525;
  const L0 = normalizeDegrees(280.46646 + 36_000.76983 * T + 0.0003032 * T * T);
  const M = normalizeDegrees(357.52911 + 35_999.05029 * T - 0.0001537 * T * T);
  const eccentricity = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const obliquity = 23.439291 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
  const y = Math.tan((obliquity * Math.PI / 180) / 2) ** 2;
  const l0Rad = L0 * Math.PI / 180;
  const mRad = M * Math.PI / 180;
  const eotRadians =
    y * Math.sin(2 * l0Rad)
    - 2 * eccentricity * Math.sin(mRad)
    + 4 * eccentricity * y * Math.sin(mRad) * Math.cos(2 * l0Rad)
    - 0.5 * y * y * Math.sin(4 * l0Rad)
    - 1.25 * eccentricity * eccentricity * Math.sin(2 * mRad);
  return eotRadians * 180 / Math.PI * 4;
}

/**
 * Convert a UTC instant to the selected BaZi clock.
 * Civil mode requires the historically resolved UTC offset supplied by the caller.
 * LMST adds longitude * 4 minutes; LAST additionally adds Meeus EOT.
 */
export function createBaZiClock(
  utcInstant: Date,
  options: BaZiClockOptions
): BaZiClockResult {
  assertValidInstant(utcInstant);
  if (!options || !Number.isFinite(options.longitudeDegrees) ||
      options.longitudeDegrees < -180 || options.longitudeDegrees > 180) {
    throw new RangeError("Longitude must be finite and between -180 and +180 degrees.");
  }

  const longitudeCorrectionSeconds = options.longitudeDegrees * 240;
  const eotMinutes = equationOfTimeMinutes(utcInstant);
  let correctionMs: number;

  if (options.timeBasis === "civil-clock") {
    if (!Number.isFinite(options.civilUtcOffsetSeconds) ||
        Math.abs(options.civilUtcOffsetSeconds as number) > 86_400) {
      throw new RangeError("Civil-clock mode requires a valid resolved UTC offset in seconds.");
    }
    correctionMs = (options.civilUtcOffsetSeconds as number) * 1000;
  } else if (options.timeBasis === "local-mean-solar") {
    correctionMs = longitudeCorrectionSeconds * 1000;
  } else if (options.timeBasis === "local-apparent-solar") {
    correctionMs = (longitudeCorrectionSeconds + eotMinutes * 60) * 1000;
  } else {
    throw new RangeError("Unsupported BaZi time basis.");
  }

  return {
    clockDate: new Date(utcInstant.getTime() + correctionMs),
    timeBasis: options.timeBasis,
    longitudeDegrees: options.longitudeDegrees,
    longitudeCorrectionSeconds,
    equationOfTimeMinutes: eotMinutes,
    ...(options.timeBasis === "civil-clock"
      ? { civilUtcOffsetSeconds: options.civilUtcOffsetSeconds }
      : {}),
  };
}

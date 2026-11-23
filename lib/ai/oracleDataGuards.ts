export interface VerifiedDashaInput {
  birthDate: Date;
  moonLongitude: number;
  moonNakshatra1Indexed: number;
  moonDegreeInNakshatra: number;
  ascendantSign: string;
}

export interface DashaInputCandidate {
  birthDate: unknown;
  birthTime: unknown;
  ascendantSign: unknown;
  moonLongitude: unknown;
  nakshatraIndex: unknown;
  timezoneOffsetHours: unknown;
}

/**
 * Validate every input required by the cockpit's 10-Dasha orchestrator.
 * Missing or malformed birth/chart data returns null; it is never replaced
 * with a guessed date, Moon position, Nakshatra, or Ascendant.
 *
 * The supplied birth-time UTC offset converts local civil time to a real UTC
 * instant. The caller must provide the offset from the chart calculation;
 * this helper never guesses a timezone or historical DST rule.
 */
export function getVerifiedDashaInputs(candidate: DashaInputCandidate): VerifiedDashaInput | null {
  if (typeof candidate.birthDate !== "string" || typeof candidate.birthTime !== "string") return null;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(candidate.birthDate);
  const timeMatch = /^(\d{2}):([0-5]\d)(?::([0-5]\d))?$/.exec(candidate.birthTime);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? "0");
  const timezoneOffsetHours = candidate.timezoneOffsetHours;
  if (
    year < 100 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 ||
    typeof timezoneOffsetHours !== "number" ||
    !Number.isFinite(timezoneOffsetHours) ||
    timezoneOffsetHours < -14 ||
    timezoneOffsetHours > 14
  ) return null;

  const localWallClock = new Date(0);
  localWallClock.setUTCFullYear(year, month - 1, day);
  localWallClock.setUTCHours(hour, minute, second, 0);
  if (
    localWallClock.getUTCFullYear() !== year ||
    localWallClock.getUTCMonth() !== month - 1 ||
    localWallClock.getUTCDate() !== day
  ) return null;

  // The form stores the offset as local time minus UTC (for example, India = +5.5).
  const birthDate = new Date(localWallClock.getTime() - timezoneOffsetHours * 60 * 60 * 1000);
  const moonLongitude = candidate.moonLongitude;
  const nakshatraIndex = candidate.nakshatraIndex;
  const ascendantSign = typeof candidate.ascendantSign === "string" ? candidate.ascendantSign.trim() : "";
  if (
    typeof moonLongitude !== "number" ||
    !Number.isFinite(moonLongitude) ||
    moonLongitude < 0 ||
    moonLongitude >= 360 ||
    typeof nakshatraIndex !== "number" ||
    !Number.isInteger(nakshatraIndex) ||
    nakshatraIndex < 0 ||
    nakshatraIndex > 26 ||
    !ascendantSign
  ) return null;

  const nakshatraSpan = 360 / 27;
  return {
    birthDate,
    moonLongitude,
    moonNakshatra1Indexed: nakshatraIndex + 1,
    moonDegreeInNakshatra: moonLongitude % nakshatraSpan,
    ascendantSign,
  };
}

/** Explicit opt-in is required before chart context is sent to an external AI provider. */
export function hasExternalChartDataConsent(value: unknown): value is true {
  return value === true;
}

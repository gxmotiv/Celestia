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
}

/**
 * Validate every input required by the cockpit's 10-Dasha orchestrator.
 * Missing or malformed birth/chart data returns null; it is never replaced
 * with a guessed date, Moon position, Nakshatra, or Ascendant.
 *
 * Date and time are held as UTC fields so calculations are deterministic
 * across browser/server time zones. This does not infer a historical UTC
 * offset; callers needing absolute instants must provide timezone-aware data.
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
  if (year < 100 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23) return null;

  const birthDate = new Date(0);
  birthDate.setUTCFullYear(year, month - 1, day);
  birthDate.setUTCHours(hour, minute, second, 0);
  if (
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) return null;

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

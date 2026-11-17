/**
 * Parse an HTML time input (HH:mm) without treating midnight as falsy.
 * Legacy callers may still request a fallback, but must inspect usedFallback
 * and must not treat a placeholder as a verified birth time.
 */
export interface BirthClockTime {
  hour: number;
  minute: number;
  usedFallback: boolean;
}

export function parseBirthClockTime(
  value: string,
  fallbackHour = 12,
  fallbackMinute = 0
): BirthClockTime {
  const fallback = (): BirthClockTime => ({
    hour: fallbackHour,
    minute: fallbackMinute,
    usedFallback: true,
  });
  if (typeof value !== "string") return fallback();

  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return fallback();

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback();

  return { hour, minute, usedFallback: false };
}


export interface RelationshipChartTimeReadinessInput {
  birthDate: string;
  birthTime: string;
  timezoneMode: "automatic" | "manual";
  hasResolvedInstant: boolean;
  manualOffsetConfirmed: boolean;
  timezoneOffset: number;
}

/**
 * Relationship reports require a valid local birth date/time and either a
 * resolver-produced UTC instant or an explicitly confirmed in-range offset.
 * This prevents a stale numeric fallback from being presented as a resolved
 * automatic timezone result.
 */
export function isRelationshipChartTimeReady(
  input: RelationshipChartTimeReadinessInput
): boolean {
  const dateMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(input.birthDate);
  if (!dateMatch) return false;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return false;

  const calendarDate = new Date(0);
  calendarDate.setUTCHours(0, 0, 0, 0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) return false;

  if (parseBirthClockTime(input.birthTime).usedFallback) return false;

  if (input.timezoneMode === "automatic") {
    return input.hasResolvedInstant;
  }

  return input.manualOffsetConfirmed &&
    Number.isFinite(input.timezoneOffset) &&
    input.timezoneOffset >= -14 &&
    input.timezoneOffset <= 14;
}

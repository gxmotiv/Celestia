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

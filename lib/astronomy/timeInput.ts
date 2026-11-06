/**
 * Strictly parse an HTML time input (HH:mm) without treating midnight as falsy.
 * Invalid or missing legacy profile values use the documented fallback.
 */
export interface BirthClockTime {
  hour: number;
  minute: number;
}

export function parseBirthClockTime(
  value: string,
  fallbackHour = 12,
  fallbackMinute = 0
): BirthClockTime {
  if (typeof value !== "string") return { hour: fallbackHour, minute: fallbackMinute };
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return { hour: fallbackHour, minute: fallbackMinute };

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }

  return { hour, minute };
}

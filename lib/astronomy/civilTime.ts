/**
 * Convert a local civil birth date/time and a fixed UTC offset into a UTC instant.
 *
 * timezoneOffsetHours follows the app's existing convention: local time = UTC + offset.
 * This deliberately does not infer historical DST or IANA timezone transitions.
 */
export function localCivilDateTimeToUtc(
  dateString: string,
  timeString: string,
  timezoneOffsetHours: number
): Date {
  const dateMatch = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(dateString);
  const timeMatch = /^(\\d{2}):(\\d{2})$/.exec(timeString);

  if (!dateMatch || !timeMatch) {
    throw new RangeError("Birth date must be YYYY-MM-DD and birth time must be HH:mm.");
  }
  if (!Number.isFinite(timezoneOffsetHours) || Math.abs(timezoneOffsetHours) > 14) {
    throw new RangeError("UTC offset must be a finite number between -14 and +14 hours.");
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || hour > 23 || minute > 59) {
    throw new RangeError("Birth date or time contains an out-of-range value.");
  }

  // setUTCFullYear avoids Date.UTC's special handling of years 00–99.
  const localAsUtc = new Date(0);
  localAsUtc.setUTCFullYear(year, month - 1, day);
  localAsUtc.setUTCHours(hour, minute, 0, 0);

  if (
    localAsUtc.getUTCFullYear() !== year ||
    localAsUtc.getUTCMonth() !== month - 1 ||
    localAsUtc.getUTCDate() !== day
  ) {
    throw new RangeError("Birth date is not a valid calendar date.");
  }

  return new Date(localAsUtc.getTime() - timezoneOffsetHours * 60 * 60 * 1000);
}

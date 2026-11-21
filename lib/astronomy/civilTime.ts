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
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeString);

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


export type LocalTimeDisambiguation = "earlier" | "later";

export interface IanaTimeCandidate {
  utcDate: Date;
  /** Historical UTC offset in hours; may include seconds from local-mean-time records. */
  offsetHours: number;
}

export type IanaCivilTimeResolution =
  | { status: "resolved"; utcDate: Date; offsetHours: number; candidates: IanaTimeCandidate[]; wasAmbiguous: boolean }
  | { status: "ambiguous"; candidates: IanaTimeCandidate[] }
  | { status: "nonexistent"; candidates: [] };

/** Build a UTC timestamp without Date.UTC's special handling of years 00–99. */
function civilPartsToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0
): number {
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, day);
  value.setUTCHours(hour, minute, second, 0);
  return value.getTime();
}

function parseCivilInput(dateString: string, timeString: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeString);
  if (!dateMatch || !timeMatch) {
    throw new RangeError("Birth date must be YYYY-MM-DD and birth time must be HH:mm.");
  }

  const [year, month, day, hour, minute] = [
    Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3]),
    Number(timeMatch[1]), Number(timeMatch[2]),
  ];
  if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) {
    throw new RangeError("Birth date or time contains an out-of-range value.");
  }

  const wallClockMs = civilPartsToUtcMs(year, month, day, hour, minute);
  const check = new Date(wallClockMs);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new RangeError("Birth date is not a valid calendar date.");
  }
  return { year, month, day, hour, minute, wallClockMs };
}

function getZonedParts(instantMs: number, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(new Date(instantMs));
  const values: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function sameCivilMinute(
  parts: ReturnType<typeof getZonedParts>,
  civil: ReturnType<typeof parseCivilInput>
): boolean {
  return (
    parts.year === civil.year &&
    parts.month === civil.month &&
    parts.day === civil.day &&
    parts.hour === civil.hour &&
    parts.minute === civil.minute &&
    parts.second === 0
  );
}

/**
 * Resolve a wall-clock time using an IANA time-zone identifier and the runtime's
 * Intl/IANA time-zone database. Gaps are rejected; repeated clock times require
 * an explicit "earlier" or "later" choice instead of silently guessing.
 *
 * This resolves civil-time rules, not the historical reliability of a reported
 * birth time or the political accuracy of every pre-standard-time zone record.
 */
export function resolveIanaCivilDateTime(
  dateString: string,
  timeString: string,
  timeZone: string,
  disambiguation?: LocalTimeDisambiguation
): IanaCivilTimeResolution {
  const civil = parseCivilInput(dateString, timeString);
  if (!timeZone.trim()) throw new RangeError("An IANA time-zone identifier is required.");

  // Validate the identifier early and fail clearly for unsupported/invalid zones.
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone });
  formatter.format(new Date(civil.wallClockMs));

  // Collect all offsets that could apply around the requested local date. Sampling
  // across four days covers both sides of ordinary and date-line transitions.
  const offsets = new Set<number>();
  for (let delta = -48; delta <= 48; delta += 3) {
    const sampleMs = civil.wallClockMs + delta * 60 * 60 * 1000;
    const local = getZonedParts(sampleMs, timeZone);
    const sampleWholeSecond = Math.floor(sampleMs / 1000) * 1000;
    const localAsUtcMs = civilPartsToUtcMs(
      local.year, local.month, local.day, local.hour, local.minute, local.second
    );
    offsets.add(localAsUtcMs - sampleWholeSecond);
  }

  const candidates: IanaTimeCandidate[] = [];
  for (const offsetMs of offsets) {
    const utcMs = civil.wallClockMs - offsetMs;
    const actual = getZonedParts(utcMs, timeZone);
    if (sameCivilMinute(actual, civil)) {
      candidates.push({
        utcDate: new Date(utcMs),
        offsetHours: offsetMs / 3600000,
      });
    }
  }

  candidates.sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime());
  const uniqueCandidates = candidates.filter(
    (candidate, index) =>
      index === 0 || candidate.utcDate.getTime() !== candidates[index - 1].utcDate.getTime()
  );

  if (uniqueCandidates.length === 0) return { status: "nonexistent", candidates: [] };
  if (uniqueCandidates.length === 1) {
    return {
      status: "resolved",
      utcDate: uniqueCandidates[0].utcDate,
      offsetHours: uniqueCandidates[0].offsetHours,
      candidates: uniqueCandidates,
      wasAmbiguous: false,
    };
  }
  if (!disambiguation) return { status: "ambiguous", candidates: uniqueCandidates };

  const chosen = disambiguation === "earlier"
    ? uniqueCandidates[0]
    : uniqueCandidates[uniqueCandidates.length - 1];
  return {
    status: "resolved",
    utcDate: chosen.utcDate,
    offsetHours: chosen.offsetHours,
    candidates: uniqueCandidates,
    wasAmbiguous: true,
  };
}

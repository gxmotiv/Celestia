import {
  calculateWesternChart,
  type WesternChartData,
} from "../astronomy/ephemeris";
import {
  calculateVedicChart,
  type VedicChartData,
} from "../astronomy/vedic";
import {
  calculateNumerologyProfile,
  type NumerologyProfile,
} from "../astronomy/numerology";
import { calculateBaZiProfileFromInstant } from "../astronomy/baziProfileAdapter";
import type { BaZiProfile } from "../astronomy/chinese";
import type { BaZiTimeBasis } from "../astronomy/timeEngine";
import type { BaZiDayBoundaryPolicy } from "../astronomy/baziEngine";
import { swissEphemeris } from "../astronomy/swissEphemeris";
import { parseBirthClockTime } from "../astronomy/timeInput";

export interface OfflineBirthInput {
  fullName: string;
  birthDate: string;
  birthTime: string;
  isTimeUnknown: boolean;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  timezoneOffsetHours: number;
  houseSystem: "Placidus" | "Equal" | "WholeSign";
  baziTimeBasis: BaZiTimeBasis;
  baziDayBoundaryPolicy: BaZiDayBoundaryPolicy;
}

export interface OfflineCalculationResult {
  westernData: WesternChartData;
  vedicData: VedicChartData;
  numerologyData: NumerologyProfile;
  baziData: BaZiProfile;
  birthTimeContext: {
    utcInstant: string;
    offsetHours: number;
    isTimeUnknown: boolean;
    warning: string;
  };
}

/**
 * Local-only version of the same four-system natal calculation pipeline used by
 * app/page.tsx. No fetch, API route, account, or server runtime is required.
 *
 * The caller must provide a UTC offset explicitly. This function does not
 * infer historical time zones from a city name or today's device offset.
 */
export function calculateOfflineAstrology(input: OfflineBirthInput): OfflineCalculationResult {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.birthDate);
  if (!dateMatch) {
    throw new RangeError("Enter a valid birth date in YYYY-MM-DD format.");
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1 ||
    year > 3000 ||
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day
  ) {
    throw new RangeError("Birth date is not a valid supported Gregorian date.");
  }

  let hour: number;
  let minute: number;
  if (input.isTimeUnknown) {
    hour = 12;
    minute = 0;
  } else {
    const parsed = parseBirthClockTime(input.birthTime);
    if (parsed.usedFallback) {
      throw new RangeError("Enter a valid birth time or select 'Birth time unknown'.");
    }
    hour = parsed.hour;
    minute = parsed.minute;
  }

  const offsetHours = Number(input.timezoneOffsetHours);
  if (!Number.isFinite(offsetHours) || offsetHours < -14 || offsetHours > 14) {
    throw new RangeError("UTC offset must be a number between -14 and +14 hours.");
  }

  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError("Latitude must be between -90° and +90°.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError("Longitude must be between -180° and +180°.");
  }

  const birthInstant = swissEphemeris.createUTCDate(
    year, month, day, hour, minute, 0, offsetHours
  );
  if (!Number.isFinite(birthInstant.getTime())) {
    throw new RangeError("Could not convert the supplied local birth time to UTC.");
  }

  // Keep this pipeline aligned with the live website's current calculation flow.
  const westernData = calculateWesternChart(
    year, month, day, hour, minute,
    latitude, longitude, offsetHours, input.houseSystem
  );
  const vedicData = calculateVedicChart(westernData, birthInstant);
  const numerologyData = calculateNumerologyProfile(input.fullName, year, month, day);
  const baziData = calculateBaZiProfileFromInstant(
    birthInstant,
    {
      clock: {
        timeBasis: input.baziTimeBasis,
        longitudeDegrees: longitude,
        civilUtcOffsetSeconds: offsetHours * 3600,
      },
      dayBoundaryPolicy: input.baziDayBoundaryPolicy,
    }
  );

  return {
    westernData,
    vedicData,
    numerologyData,
    baziData,
    birthTimeContext: {
      utcInstant: birthInstant.toISOString(),
      offsetHours,
      isTimeUnknown: input.isTimeUnknown,
      warning: [
        "UTC offset is manually supplied and has not been independently verified as historical civil time.",
        input.isTimeUnknown
          ? "Birth time is unknown; 12:00 is a placeholder, so Ascendant, houses, time-sensitive dashas and BaZi hour pillar are uncertain."
          : "",
      ].filter(Boolean).join(" "),
    },
  };
}

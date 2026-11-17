import * as Astronomy from "astronomy-engine";

export interface KPReaderVIDayLordContext {
  /** Exact UTC birth instant resolved by the shared chart pipeline. */
  birthInstant: Date;
  /** Geographic latitude in degrees, north-positive. */
  latitude: number;
  /** Geographic longitude in degrees, east-positive. */
  longitude: number;
  /** False when the birth clock time is explicitly unknown. */
  birthTimeKnown: boolean;
}

export type KPDayLordStatus =
  | "resolved"
  | "birth-time-unknown"
  | "missing-context"
  | "invalid-context"
  | "sunrise-unavailable"
  | "calculation-error";

export interface KPDayLordResolution {
  status: KPDayLordStatus;
  dayLord: string | null;
  method: "kp-reader-vi-sunrise-to-sunrise-lmt";
  sunriseUtc: string | null;
  localMeanSolarDate: string | null;
  /** Hours between the selected sunrise and the birth instant. */
  sunriseAgeHours: number | null;
  note: string;
}

const WEEKDAY_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
const MAX_LOOKBACK_DAYS = 370;
const MS_PER_DEGREE_OF_LONGITUDE = 4 * 60_000;

function unresolved(
  status: Exclude<KPDayLordStatus, "resolved">,
  note: string
): KPDayLordResolution {
  return {
    status,
    dayLord: null,
    method: "kp-reader-vi-sunrise-to-sunrise-lmt",
    sunriseUtc: null,
    localMeanSolarDate: null,
    sunriseAgeHours: null,
    note,
  };
}

/**
 * Resolve the KP Reader VI natal weekday lord from the last local sunrise
 * preceding the actual UTC birth instant.
 *
 * The sunrise search looks back up to 370 days so the solver can find the
 * preceding annual sunrise at extreme polar latitudes, where the Sun may not
 * rise on most local dates. If no sunrise is found in that interval, the
 * weekday is left unavailable rather than replaced by a UTC/civil weekday.
 *
 * The weekday is derived using longitude-based Local Mean Time (LMT):
 * 4 minutes per degree east of Greenwich. This follows the meridian-based
 * time convention used in the KP Reader 1 casting workflow for historical
 * births and avoids applying modern political time zones/DST to old dates.
 */
export function resolveKPReaderVIDayLord(
  context: KPReaderVIDayLordContext | undefined
): KPDayLordResolution {
  if (!context) {
    return unresolved(
      "missing-context",
      "Natal day lord is unavailable because the exact birth instant and birthplace coordinates were not supplied."
    );
  }

  if (context.birthTimeKnown === false) {
    return unresolved(
      "birth-time-unknown",
      "Natal day lord is not assigned because the birth time is unknown; the noon placeholder cannot establish whether birth was before or after local sunrise."
    );
  }

  const { birthInstant, latitude, longitude } = context;
  if (
    !(birthInstant instanceof Date) ||
    !Number.isFinite(birthInstant.getTime()) ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return unresolved(
      "invalid-context",
      "Natal day lord is unavailable because the birth instant or geographic coordinates are invalid."
    );
  }

  try {
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    const previousSunrise = Astronomy.SearchRiseSet(
      Astronomy.Body.Sun,
      observer,
      +1,
      birthInstant,
      -MAX_LOOKBACK_DAYS
    );

    const sunriseDate = previousSunrise?.date;
    if (
      !(sunriseDate instanceof Date) ||
      !Number.isFinite(sunriseDate.getTime()) ||
      sunriseDate.getTime() > birthInstant.getTime()
    ) {
      return unresolved(
        "sunrise-unavailable",
        "No preceding apparent sunrise was found in the 370-day search window. The engine does not substitute the UTC civil weekday."
      );
    }

    const localMeanSolarInstant = new Date(
      sunriseDate.getTime() + longitude * MS_PER_DEGREE_OF_LONGITUDE
    );
    if (!Number.isFinite(localMeanSolarInstant.getTime())) {
      return unresolved(
        "calculation-error",
        "The local mean-solar date could not be derived from the sunrise and birthplace longitude."
      );
    }

    const dayLord = WEEKDAY_LORDS[localMeanSolarInstant.getUTCDay()];
    const sunriseAgeHours = (birthInstant.getTime() - sunriseDate.getTime()) / 3_600_000;

    return {
      status: "resolved",
      dayLord,
      method: "kp-reader-vi-sunrise-to-sunrise-lmt",
      sunriseUtc: sunriseDate.toISOString(),
      localMeanSolarDate: localMeanSolarInstant.toISOString().slice(0, 10),
      sunriseAgeHours: Math.round(sunriseAgeHours * 100) / 100,
      note:
        "KP Reader VI sunrise-to-sunrise natal day; weekday is taken from longitude-based Local Mean Time (LMT), not the UTC civil date. Sunrise is an astronomical estimate using a standard refraction model; verify births very close to sunrise against a reliable local panchanga.",
    };
  } catch (error) {
    return unresolved(
      "calculation-error",
      "The local sunrise calculation failed: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

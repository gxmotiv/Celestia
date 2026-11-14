/**
 * Traditional Planetary Hours and Day Ruler Calculator
 * Calculates unequal day and night hours based on local sunrise and sunset
 * using the classical Chaldean order of planetary rulership.
 */

export interface PlanetaryHour {
  hourNumber: number; // 1 to 12
  isDayHour: boolean;
  ruler: string;
  rulerSymbol: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  isCurrentBirthHour: boolean;
}

export interface PlanetaryHoursResult {
  dayRuler: string | null;
  dayRulerSymbol: string;
  nightRuler: string | null;
  currentHourRuler: string | null;
  currentHourRulerSymbol: string;
  birthHourNumber: number | null;
  /** Sect classification remains available: polar day = diurnal, polar night = nocturnal. */
  isBirthInDaytime: boolean;
  sunriseTime: string;
  sunsetTime: string;
  dayHourDurationMinutes: number | null;
  nightHourDurationMinutes: number | null;
  solarCondition: "normal" | "polar-day" | "polar-night";
  /** Classical unequal hours are unavailable when the Sun does not cross the horizon. */
  hoursAvailable: boolean;
  availabilityNote: string | null;
  hours: PlanetaryHour[];
}

export const CHALDEAN_ORDER = [
  "Saturn",
  "Jupiter",
  "Mars",
  "Sun",
  "Venus",
  "Mercury",
  "Moon",
] as const;

export const DAY_RULERS = [
  { day: "Sunday", ruler: "Sun", symbol: "☉" },
  { day: "Monday", ruler: "Moon", symbol: "☽" },
  { day: "Tuesday", ruler: "Mars", symbol: "♂" },
  { day: "Wednesday", ruler: "Mercury", symbol: "☿" },
  { day: "Thursday", ruler: "Jupiter", symbol: "♃" },
  { day: "Friday", ruler: "Venus", symbol: "♀" },
  { day: "Saturday", ruler: "Saturn", symbol: "♄" },
] as const;

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mars: "♂",
  Mercury: "☿",
  Jupiter: "♃",
  Venus: "♀",
  Saturn: "♄",
};

export class PlanetaryHoursCalculator {
  /**
   * Approximate apparent sunrise and sunset in local civil-clock hours.
   * Uses the NOAA fractional-year solar declination/equation-of-time model,
   * with longitude (east positive) and the supplied UTC offset.
   * This is a daily approximation, not a precision rise/set ephemeris.
   */
  public calculateSunTimes(
    year: number,
    month: number,
    day: number,
    latitude: number,
    longitude: number = 0,
    timezoneOffsetHours: number = 0
  ): { sunrise: number; sunset: number; solarCondition: "normal" | "polar-day" | "polar-night" } {
    if (![year, month, day, latitude, longitude, timezoneOffsetHours].every(Number.isFinite) ||
        month < 1 || month > 12 || day < 1 || day > 31 ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
        timezoneOffsetHours < -14 || timezoneOffsetHours > 14) {
      throw new RangeError("Planetary hours require a valid date, latitude, longitude and UTC offset.");
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new RangeError("Planetary-hours date is not a valid Gregorian date.");
    }
    const dayOfYear = Math.floor((date.getTime() - Date.UTC(year, 0, 1)) / 86400000) + 1;
    const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
    const gamma = (2 * Math.PI / daysInYear) * (dayOfYear - 1);
    const equationOfTime = 229.18 * (
      0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)
    );
    const declination =
      0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) -
      0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) -
      0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

    const latitudeRadians = latitude * Math.PI / 180;
    const zenithRadians = 90.833 * Math.PI / 180;
    const cosHourAngle = (
      Math.cos(zenithRadians) - Math.sin(latitudeRadians) * Math.sin(declination)
    ) / (Math.cos(latitudeRadians) * Math.cos(declination));
    if (cosHourAngle > 1 || cosHourAngle < -1) {
      // Polar night/day: no ordinary sunrise/sunset exists on this date.
      // Return the limiting interval rather than inventing a rise or set time.
      return cosHourAngle > 1
        ? { sunrise: 12, sunset: 12, solarCondition: "polar-night" }
        : { sunrise: 0, sunset: 24, solarCondition: "polar-day" };
    }

    const hourAngleDegrees = Math.acos(Math.min(1, Math.max(-1, cosHourAngle))) * 180 / Math.PI;
    const solarNoonUtcMinutes = 720 - 4 * longitude - equationOfTime;
    const sunriseLocalMinutes = solarNoonUtcMinutes - 4 * hourAngleDegrees + timezoneOffsetHours * 60;
    const sunsetLocalMinutes = solarNoonUtcMinutes + 4 * hourAngleDegrees + timezoneOffsetHours * 60;
    const normalizeMinutes = (value: number) => ((value % 1440) + 1440) % 1440;
    return {
      sunrise: normalizeMinutes(sunriseLocalMinutes) / 60,
      sunset: normalizeMinutes(sunsetLocalMinutes) / 60,
      solarCondition: "normal",
    };
  }

  public calculate(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    latitude: number,
    longitude: number = 0,
    timezoneOffsetHours: number = 0
  ): PlanetaryHoursResult {
    if (![hour, minute].every(Number.isFinite) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new RangeError("Planetary-hours birth clock must be a valid local HH:mm time.");
    }
    const birthTimeMinutes = hour * 60 + minute;
    const { sunrise, sunset, solarCondition } = this.calculateSunTimes(
      year, month, day, latitude, longitude, timezoneOffsetHours
    );
    if (solarCondition !== "normal") {
      const isPolarDay = solarCondition === "polar-day";
      const availabilityNote = isPolarDay
        ? "Classical unequal planetary hours are unavailable: the Sun does not set on this local date, so there is no sunrise-to-sunset / sunset-to-sunrise division. Sect is retained as diurnal."
        : "Classical unequal planetary hours are unavailable: the Sun does not rise on this local date, so there is no sunrise-to-sunset / sunset-to-sunrise division. Sect is retained as nocturnal.";

      return {
        dayRuler: null,
        dayRulerSymbol: "",
        nightRuler: null,
        currentHourRuler: null,
        currentHourRulerSymbol: "",
        birthHourNumber: null,
        isBirthInDaytime: isPolarDay,
        sunriseTime: isPolarDay ? "No sunset (polar day)" : "No sunrise (polar night)",
        sunsetTime: isPolarDay ? "No sunset (polar day)" : "No sunrise (polar night)",
        dayHourDurationMinutes: null,
        nightHourDurationMinutes: null,
        solarCondition,
        hoursAvailable: false,
        availabilityNote,
        hours: [],
      };
    }

    const sunriseMinutes = Math.round(sunrise * 60);
    const sunsetMinutes = Math.round(sunset * 60);
    const isBeforeSunrise = birthTimeMinutes < sunriseMinutes;
    const dayShift = isBeforeSunrise ? -1440 : 0;
    const dayAnchor = sunriseMinutes + dayShift;
    let sunsetAnchor = sunsetMinutes + dayShift;
    if (solarCondition === "polar-day") {
      sunsetAnchor = dayAnchor + 1440;
    } else if (solarCondition === "polar-night") {
      sunsetAnchor = dayAnchor;
    } else if (sunsetAnchor <= dayAnchor) {
      sunsetAnchor += 1440;
    }
    const birthTimeOnDayline = birthTimeMinutes;
    const isDaytime = birthTimeOnDayline >= dayAnchor && birthTimeOnDayline < sunsetAnchor;

    // The astrological weekday changes at local sunrise, not midnight.
    const calendarDate = new Date(Date.UTC(year, month - 1, day));
    const civilWeekday = calendarDate.getUTCDay();
    const dayOfWeekIndex = (civilWeekday + (isBeforeSunrise ? 6 : 0)) % 7;
    const dayRulerInfo = DAY_RULERS[dayOfWeekIndex];
    const dayRuler = dayRulerInfo.ruler;
    const firstHourIndex = CHALDEAN_ORDER.indexOf(dayRuler as any);
    const dayDuration = Math.max(0, Math.min(1440, sunsetAnchor - dayAnchor));
    const nightDuration = 1440 - dayDuration;
    const dayHourLength = dayDuration / 12;
    const nightHourLength = nightDuration / 12;

    const hours: PlanetaryHour[] = [];
    let currentHourRuler = dayRuler;
    let birthHourNumber = 1;

    for (let i = 0; i < 12; i++) {
      const start = dayAnchor + i * dayHourLength;
      const end = dayAnchor + (i + 1) * dayHourLength;
      const ruler = CHALDEAN_ORDER[(firstHourIndex + i) % 7];
      const isCurrent = isDaytime && birthTimeOnDayline >= start && birthTimeOnDayline < end;
      if (isCurrent) {
        currentHourRuler = ruler;
        birthHourNumber = i + 1;
      }
      hours.push({
        hourNumber: i + 1,
        isDayHour: true,
        ruler,
        rulerSymbol: PLANET_SYMBOLS[ruler] || "",
        startTime: this.formatTimeDecimal(start / 60),
        endTime: this.formatTimeDecimal(end / 60),
        isCurrentBirthHour: isCurrent,
      });
    }

    const firstNightHourIndex = (firstHourIndex + 12) % 7;
    for (let i = 0; i < 12; i++) {
      const start = sunsetAnchor + i * nightHourLength;
      const end = sunsetAnchor + (i + 1) * nightHourLength;
      const ruler = CHALDEAN_ORDER[(firstNightHourIndex + i) % 7];
      const isCurrent = !isDaytime && birthTimeOnDayline >= start && birthTimeOnDayline < end;
      if (isCurrent) {
        currentHourRuler = ruler;
        birthHourNumber = i + 1;
      }
      hours.push({
        hourNumber: i + 1,
        isDayHour: false,
        ruler,
        rulerSymbol: PLANET_SYMBOLS[ruler] || "",
        startTime: this.formatTimeDecimal(start / 60),
        endTime: this.formatTimeDecimal(end / 60),
        isCurrentBirthHour: isCurrent,
      });
    }

    return {
      dayRuler,
      dayRulerSymbol: PLANET_SYMBOLS[dayRuler] || "☉",
      nightRuler: CHALDEAN_ORDER[firstNightHourIndex],
      currentHourRuler,
      currentHourRulerSymbol: PLANET_SYMBOLS[currentHourRuler] || "☉",
      birthHourNumber,
      isBirthInDaytime: isDaytime,
      sunriseTime: this.formatTimeDecimal(dayAnchor / 60),
      sunsetTime: this.formatTimeDecimal(sunsetAnchor / 60),
      dayHourDurationMinutes: Math.round(dayHourLength),
      nightHourDurationMinutes: Math.round(nightHourLength),
      solarCondition,
      hoursAvailable: true,
      availabilityNote: null,
      hours,
    };
  }

  private formatTimeDecimal(decimal: number): string {
    let d = decimal % 24;
    if (d < 0) d += 24;
    const hours = Math.floor(d);
    const minutes = Math.floor((d - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
}

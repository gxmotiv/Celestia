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
  dayRuler: string;
  dayRulerSymbol: string;
  nightRuler: string;
  currentHourRuler: string;
  currentHourRulerSymbol: string;
  birthHourNumber: number;
  isBirthInDaytime: boolean;
  sunriseTime: string;
  sunsetTime: string;
  dayHourDurationMinutes: number;
  nightHourDurationMinutes: number;
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
   * Approximate sunrise and sunset times (in decimal hours 0..24)
   * using solar declination and geographic latitude.
   */
  public calculateSunTimes(
    year: number,
    month: number,
    day: number,
    latitude: number
  ): { sunrise: number; sunset: number } {
    // Day of the year
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfYear = Math.floor((targetDate.getTime() - startOfYear.getTime()) / 86400000) + 1;

    // Approximate solar declination in radians
    const declination = 0.4095 * Math.sin(0.0172 * (dayOfYear - 79.35));
    const latRad = (latitude * Math.PI) / 180.0;

    // Hour angle at sunrise/sunset with standard refraction (-0.833 degrees = -0.0145 rad)
    let cosH = (Math.sin(-0.0145) - Math.sin(latRad) * Math.sin(declination)) /
               (Math.cos(latRad) * Math.cos(declination));

    // Clamp for extreme latitudes
    if (cosH > 1) cosH = 1;
    if (cosH < -1) cosH = -1;

    const H = Math.acos(cosH) * (180.0 / Math.PI) / 15.0; // hours from solar noon

    const solarNoon = 12.0; // Mean solar noon approximation
    const sunrise = Math.max(0, solarNoon - H);
    const sunset = Math.min(24, solarNoon + H);

    return { sunrise, sunset };
  }

  public calculate(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    latitude: number
  ): PlanetaryHoursResult {
    const birthTimeDecimal = hour + minute / 60.0;
    const { sunrise, sunset } = this.calculateSunTimes(year, month, day, latitude);

    // Day of the week: 0 = Sun, 1 = Mon, ..., 6 = Sat
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    // In classical astrology, the astrological day begins at sunrise!
    let dayOfWeekIndex = dateObj.getUTCDay();
    if (birthTimeDecimal < sunrise) {
      // Prior astrological day
      dayOfWeekIndex = (dayOfWeekIndex + 6) % 7;
    }

    const dayRulerInfo = DAY_RULERS[dayOfWeekIndex];
    const dayRuler = dayRulerInfo.ruler;

    // Start index in Chaldean order for the 1st hour of the day
    const firstHourIndex = CHALDEAN_ORDER.indexOf(dayRuler as any);

    const isDaytime = birthTimeDecimal >= sunrise && birthTimeDecimal < sunset;
    const dayDuration = sunset - sunrise;
    const nightDuration = 24.0 - dayDuration;

    const dayHourLength = dayDuration / 12.0;
    const nightHourLength = nightDuration / 12.0;

    const hours: PlanetaryHour[] = [];
    let currentHourRuler = dayRuler;
    let birthHourNumber = 1;

    // 12 Day Hours
    for (let i = 0; i < 12; i++) {
      const hStart = sunrise + i * dayHourLength;
      const hEnd = sunrise + (i + 1) * dayHourLength;
      const rulerIdx = (firstHourIndex + i) % 7;
      const ruler = CHALDEAN_ORDER[rulerIdx];
      const isCurrent = isDaytime && birthTimeDecimal >= hStart && birthTimeDecimal < hEnd;

      if (isCurrent) {
        currentHourRuler = ruler;
        birthHourNumber = i + 1;
      }

      hours.push({
        hourNumber: i + 1,
        isDayHour: true,
        ruler,
        rulerSymbol: PLANET_SYMBOLS[ruler] || "",
        startTime: this.formatTimeDecimal(hStart),
        endTime: this.formatTimeDecimal(hEnd),
        isCurrentBirthHour: isCurrent,
      });
    }

    // 12 Night Hours (continues sequentially in Chaldean order)
    const firstNightHourIndex = (firstHourIndex + 12) % 7;
    for (let i = 0; i < 12; i++) {
      let hStart = sunset + i * nightHourLength;
      let hEnd = sunset + (i + 1) * nightHourLength;
      const rulerIdx = (firstNightHourIndex + i) % 7;
      const ruler = CHALDEAN_ORDER[rulerIdx];

      // Normalized if passing midnight (24:00)
      const hStartNorm = hStart >= 24 ? hStart - 24 : hStart;
      const hEndNorm = hEnd >= 24 ? hEnd - 24 : hEnd;

      let isCurrent = false;
      if (!isDaytime) {
        if (birthTimeDecimal >= sunset) {
          isCurrent = birthTimeDecimal >= hStart && birthTimeDecimal < hEnd;
        } else {
          // Early morning before sunrise
          const normalizedBirth = birthTimeDecimal + 24.0;
          isCurrent = normalizedBirth >= hStart && normalizedBirth < hEnd;
        }
      }

      if (isCurrent) {
        currentHourRuler = ruler;
        birthHourNumber = i + 1;
      }

      hours.push({
        hourNumber: i + 1,
        isDayHour: false,
        ruler,
        rulerSymbol: PLANET_SYMBOLS[ruler] || "",
        startTime: this.formatTimeDecimal(hStartNorm),
        endTime: this.formatTimeDecimal(hEndNorm),
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
      sunriseTime: this.formatTimeDecimal(sunrise),
      sunsetTime: this.formatTimeDecimal(sunset),
      dayHourDurationMinutes: Math.round(dayHourLength * 60),
      nightHourDurationMinutes: Math.round(nightHourLength * 60),
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

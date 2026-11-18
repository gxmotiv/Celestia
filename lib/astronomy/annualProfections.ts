/**
 * Annual Profections (whole-sign, birthday-to-birthday convention).
 *
 * This calculator returns the activated house/sign and its traditional
 * planetary time lord. It does not generate predictions or score outcomes.
 * Dates are calendar dates (YYYY-MM-DD), not timestamps; callers must supply
 * the birth and target dates in the intended local civil calendar.
 */

export interface AnnualProfectionResult {
  method: "Hellenistic annual profections";
  convention: "whole-sign; birthday-to-birthday";
  age: number;
  profectedHouse: number;
  profectedSignIndex: number;
  profectedSign: string;
  timeLord: string;
  birthDate: string;
  targetDate: string;
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

// Traditional seven-planet domicile rulers; modern outer-planet rulerships
// are intentionally excluded from this Hellenistic method.
const TRADITIONAL_RULERS = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
] as const;

function parseCalendarDate(value: string, fieldName: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year >= 0 && year <= 99) date.setUTCFullYear(year);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${fieldName} is not a valid calendar date.`);
  }
  return date;
}

/** Calculate the completed age on a target calendar date. */
export function calculateCompletedAge(birthDate: string, targetDate: string): number {
  const birth = parseCalendarDate(birthDate, "birthDate");
  const target = parseCalendarDate(targetDate, "targetDate");
  if (target.getTime() < birth.getTime()) {
    throw new Error("targetDate cannot be earlier than birthDate.");
  }

  let age = target.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayNotReached =
    target.getUTCMonth() < birth.getUTCMonth() ||
    (target.getUTCMonth() === birth.getUTCMonth() && target.getUTCDate() < birth.getUTCDate());
  if (birthdayNotReached) age -= 1;
  return age;
}

export function calculateAnnualProfection(
  birthDate: string,
  targetDate: string,
  natalAscendantSignIndex: number
): AnnualProfectionResult {
  if (!Number.isInteger(natalAscendantSignIndex) || natalAscendantSignIndex < 0 || natalAscendantSignIndex > 11) {
    throw new Error("natalAscendantSignIndex must be an integer from 0 (Aries) to 11 (Pisces).");
  }

  const age = calculateCompletedAge(birthDate, targetDate);
  const profectedHouse = (age % 12) + 1;
  const profectedSignIndex = (natalAscendantSignIndex + age) % 12;
  const profectedSign = SIGNS[profectedSignIndex];

  return {
    method: "Hellenistic annual profections",
    convention: "whole-sign; birthday-to-birthday",
    age,
    profectedHouse,
    profectedSignIndex,
    profectedSign,
    timeLord: TRADITIONAL_RULERS[profectedSignIndex],
    birthDate,
    targetDate,
  };
}

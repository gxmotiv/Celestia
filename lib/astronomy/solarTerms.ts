/**
 * Solar-term crossing solver using the repository's actual astronomy-engine facade.
 * The facade's native implementation is astronomy-engine, not Swiss Ephemeris.
 * The solver finds crossings of apparent geocentric tropical solar longitude.
 */
import { swissEphemeris } from "./swissEphemeris";

export interface SolarLongitudeCrossing {
  targetLongitude: number;
  instantUtc: Date;
  residualDegrees: number;
  bracketWidthMilliseconds: number;
}

const DAY_MS = 86_400_000;
const SAMPLE_STEP_MS = 6 * 60 * 60 * 1000;
const SOLAR_TERM_LONGITUDES = Array.from({ length: 24 }, (_, index) => index * 15);

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function forwardAngularDifference(from: number, to: number): number {
  return normalizeDegrees(to - from);
}

function unwrappedDifference(longitude: number, referenceLongitude: number): number {
  let difference = longitude - referenceLongitude;
  while (difference < -180) difference += 360;
  while (difference >= 180) difference -= 360;
  return difference;
}

function sunLongitudeAt(instantMs: number): number {
  const jd = instantMs / DAY_MS + 2_440_587.5;
  return swissEphemeris.getApparentSunLongitude(jd);
}

function bisectCrossing(
  startMs: number,
  endMs: number,
  startLongitude: number,
  startUnwrappedLongitude: number,
  targetUnwrapped: number
): SolarLongitudeCrossing {
  let low = startMs;
  let high = endMs;
  const targetInBracket = startLongitude + (targetUnwrapped - startUnwrappedLongitude);
  const evaluate = (instantMs: number) => {
    const longitude = sunLongitudeAt(instantMs);
    return startLongitude + unwrappedDifference(longitude, startLongitude) - targetInBracket;
  };

  let lowValue = evaluate(low);
  let highValue = evaluate(high);
  if (!(lowValue <= 0 && highValue >= 0)) {
    throw new RangeError("The supplied interval does not bracket the requested solar-longitude crossing.");
  }

  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    const value = evaluate(middle);
    if (value >= 0) high = middle;
    else low = middle;
    lowValue = value;
  }

  const instantMs = high;
  const residualDegrees = Math.abs(evaluate(instantMs));
  return {
    targetLongitude: normalizeDegrees(targetUnwrapped),
    instantUtc: new Date(instantMs),
    residualDegrees,
    bracketWidthMilliseconds: high - low,
  };
}

/**
 * Return all 24 apparent solar-longitude crossings in a Gregorian UTC year.
 * Six-hour bracketing is used only to find a sign-changing interval; bisection
 * then narrows the crossing to a one-millisecond time bracket.
 */
export function calculateSolarTermsForUtcYear(year: number): SolarLongitudeCrossing[] {
  if (!Number.isInteger(year) || year < 1800 || year > 2100) {
    throw new RangeError("Solar-term solver supports integer UTC years 1800–2100.");
  }

  const startMs = Date.UTC(year, 0, 1);
  const endMs = Date.UTC(year + 1, 0, 1);
  let previousMs = startMs;
  let previousLongitude = sunLongitudeAt(previousMs);
  let unwrappedLongitude = previousLongitude;
  const crossings: SolarLongitudeCrossing[] = [];

  for (let currentMs = Math.min(previousMs + SAMPLE_STEP_MS, endMs);
       currentMs <= endMs;
       currentMs = Math.min(currentMs + SAMPLE_STEP_MS, endMs)) {
    const currentLongitude = sunLongitudeAt(currentMs);
    const advance = forwardAngularDifference(previousLongitude, currentLongitude);
    if (advance > 5) {
      throw new Error("Unexpected solar longitude jump; refusing to infer a crossing.");
    }
    const nextUnwrapped = unwrappedLongitude + advance;
    const firstBoundary = Math.floor(unwrappedLongitude / 15) + 1;

    for (let boundaryIndex = firstBoundary; boundaryIndex * 15 <= nextUnwrapped + 1e-12; boundaryIndex++) {
      const targetUnwrapped = boundaryIndex * 15;
      crossings.push(
        bisectCrossing(previousMs, currentMs, previousLongitude, unwrappedLongitude, targetUnwrapped)
      );
    }

    previousMs = currentMs;
    previousLongitude = currentLongitude;
    unwrappedLongitude = nextUnwrapped;
    if (currentMs === endMs) break;
  }

  if (crossings.length !== 24) {
    throw new Error("Expected 24 solar-longitude crossings for UTC year " + year + "; found " + crossings.length + ".");
  }

  return crossings.sort((a, b) => a.instantUtc.getTime() - b.instantUtc.getTime());
}

export const SOLAR_TERM_LONGITUDES_DEGREES = SOLAR_TERM_LONGITUDES;

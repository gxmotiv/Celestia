# Phase 1C — Confirmed BaZi Source Findings

**Status:** Read-only source inspection; no calculation behavior changed  
**Base commit inspected:** `466a321712971e92abe646eb5bb93a90a2830a52`  
**Scope:** Main birth-form calculation path and the two BaZi engines

## Executive summary

The main UI's BaZi path is not currently supplied with enough birth-time context to calculate consistently at minute-level or location-sensitive boundaries. There are also two separate BaZi implementations with materially different time and solar-term assumptions. This is a confirmed integration/design defect; the correct replacement policy still requires a documented decision and independent benchmarks.

## Confirmed source observations

### 1. Main UI drops minutes and timezone context before BaZi calculation

File: `app/page.tsx`

The page parses both `hour` and `minute`, and constructs `birthDateObj` using the entered timezone offset for other calculations. However, the BaZi call is:

```ts
const bData = calculateBaZiProfile(year, month, day, hour);
```

The call does not pass `minute`, `formData.timezoneOffset`, latitude, longitude, or the normalized UTC instant.

The receiving function in `lib/astronomy/chinese.ts` accepts only `year, month, day, hour = 12`. Therefore the primary UI BaZi calculation cannot distinguish two births in the same hour, and cannot resolve a civil-time/UTC rollover or longitude-based solar-time convention.

### 2. The primary UI BaZi engine uses approximate calendar-date boundaries

File: `lib/astronomy/chinese.ts`

- `getSolarMonthBranchIndex(month, day)` uses fixed approximate day-of-month cutoffs.
- `calculateYearPillar(year, month, day)` treats dates before February 4 as belonging to the prior solar year.
- These functions do not calculate the actual instant at which the Sun reaches the relevant solar longitude.

This can misclassify births close to a solar-term boundary. The exact affected dates vary by year and time zone.

### 3. Day/hour calculations in the primary UI engine discard minutes

File: `lib/astronomy/chinese.ts`

- `calculateDayPillar(..., hour)` advances the day when `hour >= 23`, without minutes or seconds.
- `calculateHourPillar(..., hour)` selects the two-hour branch from the integer hour.
- The hour-stem calculation depends on the day stem selected by the day-pillar policy.

Minute precision is therefore absent at the API boundary, even though the birth form records `HH:mm`.

### 4. The second BaZi engine uses UTC calendar components

File: `lib/astronomy/baziEngine.ts`

- `CompleteBaZiEngine.calculateDayPillar(date)` reads `getUTCFullYear()`, `getUTCMonth()`, and `getUTCDate()`.
- `calculateHourPillar(date, dayStemIndex)` reads UTC hours and minutes.
- Solar-year and month selection use the Sun's longitude at the supplied Date.

Using UTC is appropriate for representing an instant and evaluating geocentric solar longitude, but UTC clock components are not automatically the birth location's civil clock, LMST, or LAST. Callers must make the intended convention explicit and convert consistently before day/hour pillar assignment.

### 5. The current two engines are not equivalent

The UI calls `calculateBaZiProfile` from `chinese.ts`; the separate `CompleteBaZiEngine` in `baziEngine.ts` is used by other code and tests. They differ in:
- accepted input (date components versus a JavaScript Date),
- solar-month method (fixed calendar cutoffs versus solar longitude),
- clock basis (integer supplied hour versus UTC date components),
- minute precision, and
- boundary handling.

A shared reference test suite and one explicit time-convention contract are needed before consolidation.

### 6. Design-document statement requiring correction

File: `docs/architecture/PHASE_1C_TIMEZONE_AND_BAZI_DESIGN.md`

The document says `chinese.ts` uses `birthDate.getHours()`. That is not what the current source does: the UI passes numeric components to `calculateBaZiProfile(year, month, day, hour)`; the function does not receive a Date object. The design document should not describe that implementation as reading `birthDate.getHours()`.

### 7. J2000 cycle anchor: source comment is inconsistent with executable arithmetic

File: `lib/astronomy/chinese.ts`

The code computes:

```ts
Math.floor((jd + 0.5 + 49) % 60)
```

At JD 2451545.0, this evaluates to cycle index 54, not index 16. The adjacent comment incorrectly says the date was Geng-Chen / index 16. The architecture document and the second engine use index 54 (Wu-Wu). The arithmetic is internally consistent with index 54, but this inspection alone does not establish the historical/calendar reference as authoritative. Keep the anchor classified as requiring independent reference verification.

## Recommended safe next steps

1. Define a single explicit BaZi input contract based on an unambiguous UTC instant plus the recorded civil-time zone/offset and coordinates.
2. Decide, with documented product-owner approval, whether day/hour pillars use civil clock time, LMST, or LAST. Do not silently select one.
3. Define the Zi-hour day-boundary policy explicitly.
4. Use actual solar-term crossing instants for year/month pillar boundaries; do not treat fixed approximate dates as exact.
5. Preserve the existing engines and saved outputs during migration; introduce the new calculation path behind explicit versioning or a comparison mode.
6. Add independent benchmark cases around solar-term crossings, UTC/local midnight, 23:00, 00:00, DST transitions, non-hour offsets, and historical time-zone changes.
7. Correct the inaccurate architecture-document description after reviewing the complete Phase 1C design.

## Not changed in this branch

No calculation code, UI behavior, saved profile data, dependencies, or existing tests have been modified. No claim is made that the app was built or that the astronomical results were independently validated.

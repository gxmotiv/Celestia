# Active Birth-Chart BaZi Solar-Time Follow-up

Status: engineering specification and source audit only. No calculation behavior is changed by this document.

## Scope separation

A separate open pull request (#59, `Fix BaZi Month Pillar branch selection`) addresses the longitude-sector mapping in `CompleteBaZiEngine`, used by BaZi transit features. It explicitly does not change the active natal birth-page path. This follow-up therefore targets the legacy `calculateBaZiProfile()` path only and must not duplicate or overwrite the #59 work.

## Confirmed source observations on main

- `app/page.tsx` imports `calculateBaZiProfile` from `lib/astronomy/chinese.ts`.
- The birth form provides local date, local time (hour and minute), latitude, longitude, and a numeric UTC offset.
- The active call passes year, month, day, and hour. The minute, coordinates, and timezone context are not passed.
- `calculateBaZiProfile(year, month, day, hour = 12)` uses calendar-day cutoffs in `getSolarMonthBranchIndex()` and a February 4 day rule in `calculateYearPillar()`.
- `lib/astronomy/multiSystemBenchmarkTests.ts` also calls `calculateBaZiProfile()`; this means it is inaccurate to say that the function has no tests. The existence of a call site does not establish rigorous boundary or independent-reference coverage.
- `scripts/testBaZiSuite.ts` primarily exercises `CompleteBaZiEngine`, which is a separate calculation implementation.
- `package.json` declares `astronomy-engine`; it does not declare a native `swisseph`/ `sweph` package. A facade filename or comment is not proof of native Swiss Ephemeris use.

## Required design decisions before implementation

1. Define the calendar and time-scale contract for birth input:
   - local civil date/time entered by the user;
   - IANA timezone identifier and historical timezone database behavior, or an explicitly limited fixed-offset mode;
   - conversion to a single UTC instant;
   - explicit handling when birth time is unknown.
2. Define the BaZi solar-time convention independently of the timezone conversion:
   - civil clock time, Local Mean Solar Time (LMST), or Local Apparent Solar Time (LAST);
   - do not silently change the existing convention;
   - document longitude sign and equation-of-time treatment.
3. Define day-boundary policy (midnight versus 23:00 Zi-hour rollover) and keep it separately configurable/documented.
4. Calculate Year Pillar transition at the actual Li Chun instant, not a fixed February date.
5. Calculate Month Pillar transitions at the actual 12 Jie instants, not fixed calendar-day cutoffs.
6. Preserve existing saved-profile compatibility and provide an explicit legacy interpretation/version marker if results change.

## Independent reference and validation requirements

- Use an authoritative published solar-term timestamp source (for example, Hong Kong Observatory annual solar-term tables) for a bounded set of years.
- Record each fixture's source URL, source publication/version, displayed time zone, exact timestamp precision, and conversion to UTC.
- Compare the implementation against the reference after accounting for the reference time zone and stated time scale. Do not assume a displayed civil timestamp is TT or UT1.
- Include dates immediately before, exactly at, and immediately after Li Chun and each Jie transition.
- Include leap days, year rollovers, historical timezone changes, fractional offsets, and dates near local midnight.
- Assert the complete four pillars for independently sourced fixtures, not only that an output is non-empty.
- Add explicit tests for missing/unknown birth time; never treat a noon placeholder as a known birth instant.
- Keep longitude-to-branch unit tests separate from astronomical date-to-instant tests. A mocked solar longitude validates sector mapping only, not ephemeris accuracy.

## Candidate ephemeris

The existing dependency `astronomy-engine` exposes solar-position calculations and may be evaluated as a zero-cost candidate. Before adopting it:
- inspect the exact installed version's API and coordinate/time-scale definitions;
- determine whether its apparent/geocentric ecliptic longitude matches the chosen solar-term definition;
- solve each target longitude with a bracketed root finder over a UTC/astronomical time interval;
- quantify residual angular error and timestamp difference against independent fixtures;
- document supported date range and known precision limits.

Do not call the result "Swiss Ephemeris" unless a genuine Swiss Ephemeris implementation is installed and actually used.

## Acceptance criteria for the implementation PR

- The active birth page passes validated minute-level birth instant and required time/location context to the BaZi engine.
- The engine has an explicit time-scale and solar-time contract.
- Year and Month Pillars switch at calculated solar-term instants.
- Independent reference fixtures pass within a declared tolerance justified by the reference precision.
- Tests cover all 12 Jie, Li Chun, before/at/after behavior, year rollover, historical timezone cases, and unknown birth time.
- Existing saved profiles remain readable.
- CI runs the dedicated active-path suite and reports the exact command and result.
- No production deployment occurs as part of the PR.

## Non-goals

- This document does not assert that every existing BaZi chart is wrong.
- It does not assert that `CompleteBaZiEngine` is more accurate than the legacy active path.
- It does not claim native Swiss Ephemeris integration.
- It does not choose LMST, LAST, civil time, or a Zi-hour convention on behalf of the product owner.

# CELESTIA — PHASE 1C ARCHITECTURAL SPECIFICATION: HISTORICAL TIMEZONES & BAZI SOLAR-TIME ENGINE

Status: Staged Architectural Specification & Research Synthesis (Pre-Implementation Gate)
Author: Software Architecture & Computational Astronomy Audit
Scope: Historical Timezone Resolution, Equation of Time, BaZi Time Conventions, and Day-Boundary Policy

---

## 1. CATEGORY A: VERIFIED ARITHMETIC

The following mathematical definitions and derivations have been verified for internal consistency:

### 1.1 Meeus Equation of Time (Chapter 28)
- Input: Julian Centuries from J2000.0 (T)
  T = (JD - 2451545.0) / 36525.0
- Geometric Mean Longitude of Sun (L0, in degrees):
  L0 = 280.46646 + 36000.76983*T + 0.0003032*(T^2)
- Mean Anomaly of Sun (M, in degrees):
  M = 357.52911 + 35999.05029*T - 0.0001537*(T^2)
- Eccentricity of Earth's Orbit (e):
  e = 0.016708634 - 0.000042037*T - 0.0000001267*(T^2)
- Mean Obliquity of Ecliptic (eps, in degrees):
  eps = 23.439291 - 0.0130042*T - 0.00000016*(T^2) + 0.000000504*(T^3)
- Obliquity Factor (y):
  y = tan(eps / 2)^2
- Equation of Time in radians (E_rad):
  E_rad = y*sin(2*L0) - 2*e*sin(M) + 4*e*y*sin(M)*cos(2*L0) - 0.5*(y^2)*sin(4*L0) - 1.25*(e^2)*sin(2*M)
- Conversion to minutes (E_minutes):
  E_minutes = E_rad * (180 / pi) * 4   (conversion multiplier: 229.183118)
- Sign Convention:
  EOT = Apparent Solar Time - Mean Solar Time
  LAST = LMST + EOT

### 1.2 Corrected 2024 Benchmark Values (at 12:00:00 UTC)
- February 11, 2024: -14.23 minutes (-14m 14s)
- May 14, 2024: +3.64 minutes (+3m 38s)
- July 26, 2024: -6.55 minutes (-6m 33s)
- November 03, 2024: +16.49 minutes (+16m 29s)

### 1.3 Sexagenary Day-Pillar Modulo-60 Arithmetic
- Formula from arbitrary epoch anchor:
  cycleIndex = (anchorIndex + elapsedDays) mod 60
- Given anchor: J2000.0 (2000-01-01 12:00:00 UTC) = Index 54 (Wu-Wu, 戊午)
- March 15, 2024 (8,840 elapsed solar days):
  (54 + 8840) mod 60 = 8894 mod 60 = 14 -> Wu-Yin (戊寅)
- May 15, 2024 (8,901 elapsed solar days):
  (54 + 8901) mod 60 = 8955 mod 60 = 15 -> Ji-Mao (己卯)

### 1.4 Shortest-Arc Circular Longitude Averaging
- Midpoint longitude between lonA and lonB:
  dLon = lonB - lonA
  if dLon > 180: dLon -= 360
  if dLon < -180: dLon += 360
  midLon = lonA + dLon / 2
  Deterministic eastward tie-break enforced for exact antipodes (|lonA - lonB| = 180).

---

## 2. CATEGORY B: SOURCE-CODE OBSERVATIONS

The following characteristics are verified directly from existing code in the repository:

1. **Dual BaZi Calculation Engines (ISSUE-10):**
   - `lib/astronomy/chinese.ts`: Computes Four Pillars (`calculateBaZi`) using Civil Local Clock Time (`birthDate.getHours()`). Does not apply geographic longitude correction or Equation of Time.
   - `lib/astronomy/baziEngine.ts`: Converts input date to UTC date components (`getUTCDate()`, `getUTCHours()`) before evaluating solar terms and pillars.
   - Impact: A birth in San Francisco (UTC-8) at 02:00 local time evaluates on day D in `chinese.ts`, but on day D-1 or D+1 in `baziEngine.ts` due to UTC rollover.
2. **Davison Relationship Engine (`lib/astronomy/relationshipEngine.ts`):**
   - Supports numeric `timezoneOffset` in input. Computes UTC midpoint instant and LMT midpoint date (`midpointLmt`), preserving legacy `midpointDate`.
3. **Geocoding API Route (`app/api/geocode/route.ts`):**
   - Forward and reverse geocoding proxy using Geoapify with built-in offline city dataset fallback. Reads `process.env.GEOAPIFY_API_KEY`. Contains no hardcoded fallback keys.

---

## 3. CATEGORY C: PROVISIONAL ENGINEERING DECISIONS

The following conventions are selected as provisional product-owner defaults for Celestia. They are design and architectural choices for software consistency, NOT universally established traditional astrology laws:

### 3.1 BaZi Time Convention Hierarchy
- **Provisional Default:** Local Mean Solar Time (LMST)
  Formula: LMST = UTC_instant + (longitude * 240 seconds)
  Rationale: Balances astronomical solar position against computational reliability and avoids clock-time daylight-saving distortions.
- **Selectable Alternative 1:** Local Apparent Solar Time (LAST)
  Formula: LAST = LMST + EOT(UTC_instant)
  Applies the Meeus Chapter 28 Equation of Time. Recommended for traditional purists aligning with sundial noon.
- **Selectable Alternative 2:** Civil Local Clock Time
  Uses the civil clock time recorded on the birth certificate without geographic longitude correction.
- **Persistence Rule:** The selected time convention must be explicitly recorded in saved profile metadata. User profiles previously calculated must not have their convention silently mutated.

### 3.2 Day-Boundary Policy
- **Provisional Default:** Pure Zi (23:00 local cutoff)
  Day pillar rolls over at 23:00. The entire 2-hour window 23:00–01:00 belongs to the next day's Day Master.
- **Selectable Alternative:** Early / Late Zi (Midnight 00:00 cutoff)
  Late Zi (23:00–00:00): Current calendar day pillar, Rat hour pillar.
  Early Zi (00:00–01:00): Next calendar day pillar, Rat hour pillar.
- **Critical Distinction:** Both policies are widely used across historical and contemporary Chinese schools. Celestia provides Pure Zi as the default while enabling user toggle with explicit impact disclosure on the Day Master, Ten Gods, and Luck Pillars.

### 3.3 Zi-Hour Truth Table
Reference: Base Day D with Stem S(d), Branch B(d). Next Day D+1 with Stem S(d+1), Branch B(d+1).
Hour stem is determined by Five Rats formula based on the effective Day Stem.

| Timestamp | Pure Zi Day Pillar | Pure Zi Hour Pillar | Early/Late Zi Day Pillar | Early/Late Zi Hour Pillar |
| :--- | :--- | :--- | :--- | :--- |
| 22:59:59 | Day D (S_d, B_d) | Hai (12th Branch) | Day D (S_d, B_d) | Hai (12th Branch) |
| 23:00:00 | Day D+1 (S_d+1, B_d+1) | Zi (1st Branch, stem via S_d+1) | Day D (S_d, B_d) | Late Zi (stem via S_d) |
| 23:30:00 | Day D+1 (S_d+1, B_d+1) | Zi (1st Branch, stem via S_d+1) | Day D (S_d, B_d) | Late Zi (stem via S_d) |
| 23:59:59 | Day D+1 (S_d+1, B_d+1) | Zi (1st Branch, stem via S_d+1) | Day D (S_d, B_d) | Late Zi (stem via S_d) |
| 00:00:00 | Day D+1 (S_d+1, B_d+1) | Zi (1st Branch, stem via S_d+1) | Day D+1 (S_d+1, B_d+1) | Early Zi (stem via S_d+1) |
| 00:30:00 | Day D+1 (S_d+1, B_d+1) | Zi (1st Branch, stem via S_d+1) | Day D+1 (S_d+1, B_d+1) | Early Zi (stem via S_d+1) |
| 01:00:00 | Day D+1 (S_d+1, B_d+1) | Chou (2nd Branch, stem via S_d+1) | Day D+1 (S_d+1, B_d+1) | Chou (2nd Branch, stem via S_d+1) |

---

## 4. CATEGORY D: UNVERIFIED HISTORICAL & ASTRONOMICAL CLAIMS

The following elements must remain strictly classified as UNVERIFIED pending primary archival evidence:

1. **J2000.0 Day-Pillar Anchor (Index 54 = Wu-Wu, 戊午):**
   - While internally consistent with standard modern astronomical software, this anchor has NOT been independently cross-verified against primary Chinese dynastic records, the official calendar tables of the Purple Mountain Observatory, or physical ephemeris almanacs from the Chinese Academy of Sciences in this environment.
   - Classification: MATHEMATICALLY DERIVED / MODEL CONSISTENT — UNCONFIRMED AGAINST PRIMARY HISTORICAL TEXTS.
2. **Historical Timezone Transitions (Pre-1970):**
   - Paris transitions (+561 seconds LMT until 1891-03-15; PMT until 1911-03-09; WET/CET German occupation shifts in 1940).
   - New York transitions (-17762 seconds LMT until 1883-11-18 Standard Railway Time; 1918 Standard Time Act).
   - Nepal 1986 transition (+05:30 to +05:45).
   - Lord Howe Island 30-minute DST shifts.
   - Classification: DERIVED FROM RUNTIME ICU / IANA TZDATA — UNCONFIRMED AGAINST OFFICIAL LEGAL GAZETTES.

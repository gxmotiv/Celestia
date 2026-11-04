CELESTIA MASTER AUDIT — PROJECT HISTORY, PHASE 1C TIMEZONE GATE, CALCULATION VALIDATION, SECURITY, RUNTIME, AND COMPLETE ROADMAP

0. Your role and mission

Act as a senior software architect, TypeScript/Next.js engineer, astronomy and time-conversion specialist, mathematical software auditor, security reviewer, QA engineer, and technical research analyst.

You are auditing my existing project, Celestia.

This is not merely a request to implement a historical-timezone resolver. It is a request to preserve the context of our previous discussions, re-examine existing findings against the real repository, identify the most serious unresolved defects, and create a reliable plan for improving the entire application.

My primary objective is:

Calculation correctness and trustworthiness first; reliable implementation second; user experience and new features after that.

Celestia is intended to be a deep astrology application, with traditional astrology calculations and a separate prediction-research platform. It should distinguish astronomical calculations, calendar and timezone conversions, traditional astrological rules, heuristic interpretations, and experimental predictions instead of presenting them as equally reliable facts.

Do not assume that an existing feature works just because it exists in the interface, a test passes, or a previous AI agent claimed to have implemented it.

1. Essential rules

1.1 Inspect before acting

For this entire assignment:

- Use read-only inspection.
- Do not modify or create project files.
- Do not install dependencies, change package versions, run migrations, delete files, overwrite data, commit changes, push changes, or open pull requests.
- Do not start destructive commands.
- Do not silently change the project's architecture.
- Do not claim that you tested a browser, API, astronomical result, or historical fact unless you actually did so.
- Do not treat previous AI reports as independently verified evidence.
- Never state that a task is finished merely because you have designed a solution.

The current phase is an audit and planning gate. I will separately approve implementation after reviewing your findings.

1.2 Evidence discipline

Classify important findings as one of these:

1. Verified from current source code — include the relevant path, function, and line numbers where available.
2. Verified by an executed test — provide the command, actual result, and whether it passed.
3. Runtime observation — report exactly what the environment returned without overstating what it proves.
4. Independently source-verified fact — cite the authoritative source and explain what it establishes.
5. Previously reported but not independently confirmed — identify the earlier report and leave it unverified until checked.
6. Inference or hypothesis — explain the reasoning and what remains to prove.
7. Unknown or blocked — describe the missing evidence and the safest next step.

If you cannot access the repository, state that immediately. Do not invent source code, file contents, test results, line numbers, or commits.

1.3 My operating constraints

- The budget is ₹0.
- Prefer existing tools and free/open-source solutions.
- Do not introduce paid APIs, subscriptions, surprise billing, mandatory proprietary services, or new dependencies without explicit approval.
- Avoid solutions that need unnecessary computational resources.
- Keep explanations clear, direct, and understandable to a beginner.
- Prioritize fixing the most consequential problems rather than adding features for the sake of feature count.

Do not ask me to repeat facts already supplied in this context. Ask a question only when a specific missing decision genuinely prevents a safe conclusion. Otherwise, document the limitation and continue the read-only audit.

---

2. Project context and previously reported architecture

Earlier project inspections described the following environment. These are historical reports, not guaranteed current values. Check the actual repository before relying on them.

- Next.js 15.x, React 19, Node.js 22.x.
- "astronomy-engine" version 2.1.19 was previously reported.
- A wrapper named "SwissEphemerisEngine" was used around astronomy functionality.
- A facade named "swissEphemeris" was involved in date normalization and astronomical calculations.
- The application reportedly includes Vedic and Western astrology, D1–D60 divisional charts, several dasha systems, KP astrology, BaZi, numerology, relationship charts, PDFs, and additional chart and interpretation features.
- The project has included a Gemini-powered route or integration.
- Saved profiles were reportedly stored in browser "localStorage", including birth details.
- Some previous tests reportedly included 108 verification assertions, but their exact nature and current status must be inspected rather than assumed.
- The build environment has previously encountered memory pressure. A reported production build succeeded using "NODE_OPTIONS="--max-old-space-size=1536" npm run build", while an ordinary build was reportedly killed during a low-memory run with a development server active.

Different earlier conversations reported slightly different dependency versions. Read "package.json", lockfiles, Next.js configuration, TypeScript configuration, and the current source. The actual repository is the source of truth.

Critical astronomy distinction

A facade named "SwissEphemerisEngine" is not necessarily native Swiss Ephemeris.

Verify the actual underlying calculation engine, algorithms, coordinate conventions, reference frames, ephemerides, time scales, and house calculations. Document exactly what the application implements.

Do not describe the project as using native Swiss Ephemeris/libswe unless the actual dependency and call path support that claim.

---

3. Phase 1B — Davison relationship chart work

A previous AI report described these changes or intended changes:

- "lib/astronomy/ephemeris.ts": "calculateWesternChart" gained an optional seconds argument.
- "lib/astronomy/relationshipEngine.ts": "DavisonPersonInput.timezoneOffset?: number" was introduced or updated.
- Local birth times were converted to UTC using "normalizeLocalToUTC".
- A midpoint UTC instant was calculated.
- The geographic longitude midpoint used shortest-arc circular averaging, with a deterministic eastward tie-break for exact antipodes.
- The latitude midpoint was calculated arithmetically and clamped to the range −90° through +90°.
- Results included fields such as "midpointDateUtc", "midpointLmt", and "lmtOffsetHours", while preserving a "midpointDate" field.
- "components/RelationshipAstrologyView.tsx" reportedly passed timezone offsets and displayed UTC/LMT information.
- "app/page.tsx" reportedly passed the primary timezone offset.
- "scripts/testRelationshipChartsSuite.ts" was reportedly added.
- "tsconfig.json" was adjusted to exclude backup files.
- A PDF route reportedly converted a Buffer into a "Uint8Array".

Required audit

Inspect the actual current versions of all these files. Establish which changes exist, whether they work, and whether their behavior matches the intended calculation.

Verify, among other things:

- Circular midpoint calculations around the ±180° longitude boundary.
- Exact antipodal behavior.
- Latitude validation and clamping policy.
- Correct interpretation of local birth time versus UTC.
- The location used by the chart.
- The handling of UTC midnight and calendar-date rollover.
- Consistency between legacy and newer fields.
- The seconds argument through the complete ephemeris pipeline.
- PDF output correctness and compatibility.
- Whether any existing relationship-chart tests merely test structure instead of independent astronomical results.

Previous reports said that no independent, published Davison chart benchmark had been used to verify planetary degrees and house cusps. Determine whether this remains true.

Do not use passing internal tests as the only proof that the underlying astronomical results are correct.

Previously reported Davison example

One prior runtime report used these inputs:

- Person A: London, 20 May 1990, 14:30, numeric offset +1.
- Person B: Tokyo, 10 November 1992, 08:15, numeric offset +9.

The reported result was:

- Midpoint UTC: "1991-08-15T18:22:30.000Z".
- Midpoint LMT: "1991-08-15 23:01:32 LMT", approximately UTC+04:39.
- Midpoint location: approximately 43.59° N, 69.76° E.
- Reported Western chart positions: Sun 22°25′ Leo, Moon 5°47′ Scorpio.

These values are prior-agent outputs, not independently certified benchmark results. Reproduce them only if the current code is available, and separately assess their correctness using a clearly documented reference method.

Historical-offset limitation

The Davison implementation previously relied on numeric timezone offsets supplied by the caller. This may be appropriate for a lower-level calculation API, but the correctness of the offset supplied by the UI must be audited separately.

Do not confuse “the midpoint mathematics is deterministic” with “both birth instants have historically correct timezone offsets.”

---

4. Phase 1B — Runtime smoke-test findings that must not be lost

A previous smoke test reportedly found:

- "curl -I http://localhost:3000/" returned HTTP 200.
- The returned HTML contained Next.js page content, but also contained a Next.js 404 message or 404-related content.
- The agent nevertheless characterized the application as responsive or working, which was not established by that observation.
- A graphical browser was not available to conduct a real interactive UI test.
- "/api/geocode?q=Paris" reportedly returned a Paris result with "tz: 1", associated with Geoapify data.
- A remote AI Studio URL returned HTTP 302 to "__cookie_check.html". This established that a redirect was observed, not that the endpoint was publicly usable or that authentication and AI inference worked.
- A development server process had reportedly remained active during part of the test.

Required audit

Investigate this discrepancy as a distinct issue:

1. Check the actual route definitions, middleware, rewrites, filesystem routes, and Next.js configuration.
2. Confirm which process and application returned the response.
3. Request the page and inspect the HTTP status, headers, page title, rendered text, and actual route output.
4. Determine whether the HTML's 404 content is genuine, stale output, a development artifact, or unrelated embedded content.
5. Test appropriate routes individually where safe.
6. Separate an HTTP response test, a server-rendered HTML test, a browser interaction test, and a deployment smoke test.
7. Do not claim the UI is fully tested unless an actual interaction test was completed.

Create a reproducible diagnostic plan if the environment cannot execute a particular test.

---

5. Phase 1B.2 — Earlier timezone and midpoint edge-case testing

A previous report described the following experiments:

1. Identical Tokyo inputs on 10 May 2024 at 03:00, offset +9, reportedly produced "199"-style conversion behavior consistent with UTC 18:00 on the previous day in the reported 2024 case, and LMT of approximately 03:18:36 at UTC+09:19. Recompute directly from source rather than trusting this summary.
2. Identical Honolulu inputs on 10 May 2024 at 21:00, offset −10, reportedly converted to UTC 07:00 the following day, with local mean time around UTC−10:31.
3. London winter/summer offsets were exercised.
4. A London daylight-saving boundary example reportedly yielded "2024-03-31T01:00:00.000Z".
5. A Mumbai/New York example reportedly yielded midpoint UTC "2024-01-01T11:45:00.000Z".
6. A seconds test used 12:00:15 and 12:00:45 to obtain a midpoint at 12:00:30 UTC.
7. An identical Delhi input reportedly converted to "1995-06-25T04:00:00.000Z", with LMT approximately UTC+05:09.
8. Longitudes +179° and −179° reportedly produced a circular midpoint of 180° E.
9. Longitudes −90° and +89.999° reportedly produced a midpoint near zero.

The previous agent also reported 500 repeated calculations yielding bit-for-bit deterministic results.

These are not proof of overall correctness. Determinism is valuable, but a deterministic wrong answer remains wrong. Inspect the test data and calculation paths and independently recompute the important cases.

Check the exact input values and ensure that rounding, formatting, timezone rules, and the application code do not change the values between input and calculation.

---

6. Phase 1C — Current historical-timezone audit gate

The latest proposed work is a historical-timezone resolver.

The goal is to prevent a birth-time form from using a fixed standard-time offset when the selected date should have a daylight-saving or other historical offset. It must handle unusual offsets and explicitly represent ambiguous and nonexistent local times.

6.1 Findings from the previous research report

The prior agent tested Node.js 22.x "Intl.DateTimeFormat", including "longOffset" or "shortOffset", and reported observations such as:

- London winter and summer offsets.
- New York winter and summer offsets.
- UK wartime double summer time in 1944.
- Historical New York local-time offsets including seconds.
- Nepal's 1986 transition.
- Lord Howe Island's half-hour daylight-saving transition.
- Amsterdam historical local-time limitations.
- A large calendar-date change in Samoa in 2011.
- Ambiguous and nonexistent local clock times around modern DST transitions.

These observations show what that execution environment returned. Historical correctness must be independently substantiated where it is important.

6.2 Earlier candidate-discovery proposal

The initial approach sampled timezone offsets every three hours across a local-time search window.

The later proposal replaced this with a claimed 50-hour window and nine boundary-oriented probes. The tests reportedly discovered:

- London spring transition: GMT+00:00 and GMT+01:00.
- London autumn transition: GMT+01:00 and GMT+00:00.
- New York spring transition: GMT−05:00 and GMT−04:00.
- New York autumn transition: GMT−04:00 and GMT−05:00.
- Lord Howe: GMT+10:30 and GMT+11:00.
- Kathmandu: GMT+05:30 and GMT+05:45.
- Samoa: GMT−10:00 and GMT+14:00.

The report then called the method boundary-safe and mathematically rigorous.

Do not automatically accept that conclusion. Sparse samples can miss transitions occurring between probes. A 50-hour horizon may bound the search region under specified assumptions without guaranteeing the discovery of every distinct offset in that region.

Audit the precise claim. Explain the difference between empirical coverage and a mathematical guarantee. If reliable full transition discovery cannot be guaranteed using the available APIs, make the limitation explicit.

6.3 Local-time conversion requirements

The final resolver should distinguish at least these cases:

- "resolved": exactly one valid UTC instant is established under the supported rules.
- "ambiguous": two or more UTC instants correspond to the supplied local time.
- "nonexistent": no UTC instant round-trips to the supplied local wall time.
- "unsupported": the resolver cannot establish a sufficiently reliable result.

Candidate validity should be established by mapping candidate instants back into the selected timezone and checking that the local calendar date and clock time match the input. Define how seconds and milliseconds are handled.

Validate all input fields, including:

- Invalid calendar dates.
- Invalid times.
- Missing timezone identifiers.
- Invalid IANA timezone identifiers.
- Unsupported date ranges or database limitations.
- UTC date rollover.
- Dates at which local times are ambiguous or nonexistent.
- Non-hour changes and date-line changes.
- Browser/runtime timezone database differences.

Do not silently choose one candidate for an ambiguous time. Do not silently fabricate a UTC instant for a nonexistent time.

A local clock time that never occurred in a city cannot become historically verified simply because a user typed a numeric offset.

6.4 Candidate offsets and timezone database

Determine what the actual Node.js/ICU runtime, browser runtime, and available dependencies guarantee.

Do not assume that a modern browser and the development Node runtime use identical timezone database versions.

If you can find a robust, free, legally usable method for reliable transition discovery, evaluate it without installing or changing dependencies. Do not add a new package during this audit.

Consider whether local-date candidate generation can be performed safely using a defensible algorithm based on valid UTC round-trips and established timezone rules. Explain any limits rather than hiding them.

Do not approximate a timezone using "longitude / 15" or rounded longitude and then label the result historically accurate. Such a fallback must be clearly identified as an approximation, or the result must be marked unsupported until the user supplies a valid correction.

6.5 Proposed resolver contract

A previous report proposed an interface resembling the following. Treat this as a draft, not a mandated design:

export interface UtcCandidate {
  utcInstant: string;
  utcEpochMs: number;
  offsetHours: number;
  offsetFormatted: string;
  timezoneAbbr: string;
}

export interface HistoricalTimezoneInput {
  birthDate: string;
  birthTime: string;
  ianaTimezone?: string;
  manualOffsetOverride?: number;
}

export interface HistoricalTimezoneResult {
  status:
    | "resolved"
    | "ambiguous"
    | "nonexistent"
    | "unsupported";
  primaryCandidate?: UtcCandidate;
  candidates?: UtcCandidate[];
  probedOffsets?: number[];
  advisoryMessage?: string;
  isManualOverride: boolean;
}

Critically evaluate whether this interface clearly represents:

- Input validation failures.
- The timezone identifier and its provenance.
- Manual numeric override.
- Multiple valid candidates.
- User-selected ambiguity resolution.
- Nonexistent-time policy.
- Approximation and confidence.
- Historical verification status.
- The exact offset, including seconds, when needed.
- Saved-profile compatibility.

Suggest a safer precise contract before implementation. Do not unnecessarily overengineer it.

6.6 Manual override and UI-state discipline

The previous report correctly identified three different concepts that must not be merged:

A. Manual numeric offset override

A user explicitly locks a numeric offset. Automatic date, city, and timezone changes must not silently overwrite that lock. A clear reset action should restore automatic resolution. The UI must identify that the offset was user-supplied rather than automatically verified.

B. Ambiguous local time

Two or more UTC candidates are valid. The user should see the choices, including the UTC instant and relevant offset, and explicitly select one. A change to the relevant input should invalidate a selection if it no longer matches the new input.

C. Nonexistent local time

No valid UTC instant matches the supplied local wall time in that timezone. Warn the user and block ordinary verified chart generation unless the input is corrected or a clearly labeled and documented resolution policy is explicitly selected.

Keep these states and their provenance distinct. Never mark a manual choice as independently historically verified solely because the user chose it.

Inspect actual event handlers and state transitions. Assess whether asynchronous operations, component remounts, profile loading, city selection, date changes, or form normalization could overwrite user data.

6.7 Saved-profile compatibility

Earlier profiles reportedly contain fields such as:

{
  fullName,
  birthDate,
  birthTime,
  latitude,
  longitude,
  timezoneOffset
}

A proposed new optional field is "ianaTimezone".

Inspect the real persistence schema and migrations, if any. Existing profiles without the optional field should not be silently reinterpreted or assigned an invented timezone.

Determine how to preserve prior behavior transparently, how to identify old profiles with an offset but no IANA zone, and how automatic resolution should be enabled or disabled for those profiles.

6.8 Historical verification and wording

Previous research raised issues surrounding:

- UK Double Summer Time during World War II.
- Historical timekeeping in New York.
- Amsterdam municipal local mean time.
- The UK standardization period.
- Nepal's historical quarter-hour change.
- Pre-standardization local solar time.

Runtime "Intl" output is not sufficient to prove each historical fact.

Research reliable external sources where necessary and cite them. Distinguish legal timekeeping history from the timezone database's approximation or recorded data. Do not issue blanket claims such as “100% accurate” or “all dates are reliable” without strong evidence.

The user interface should distinguish database-resolved values, independently verified historical data, approximate values, and user-supplied corrections. Prefer specific warnings over confidence badges that imply more certainty than is justified.

6.9 Exact end-to-end precision audit

A previous report stated that offset seconds survive the complete calculation path through:

- "relationshipEngine.ts"
- "normalizeLocalToUTC" in "swissEphemeris.ts"
- "calculateWesternChart" in "ephemeris.ts"
- Julian Day conversion
- Houses, GMST, RAMC, and planetary calculations.

The report also cited a UI input using "step="0.5"" in "components/RelationshipAstrologyView.tsx", and proposed changing it to "step="any"" in both that file and "app/page.tsx".

Verify the actual current code.

Follow real values from the form through every conversion into the astronomical calculation. Check whether seconds, milliseconds, offsets with seconds, UTC rollover, midpoint arithmetic, Julian Day, and final chart calculations preserve the intended instant.

Do not assert “zero truncation” or “exact sub-second precision” based solely on an arithmetic argument. Use defined tolerances and executed tests.

---

7. Tests and baseline results from previous reports

An earlier AI report claimed that all ten existing suites passed, totaling 269 tests:

Suite| Previously reported count
"testAstrologySuite.ts"| 30
"testBaZiSuite.ts"| 17
"testGeocodeSuite.ts"| 32
"testMinorAspectsSuite.ts"| 29
"testNavamsaSuite.ts"| 22
"testNumerologySuite.ts"| 51
"testRelationshipChartsSuite.ts"| 18
"testUtcJulianDaySuite.ts"| 21
"testVedicTimezoneSuite.ts"| 18
"testVimshottariAntardashaSuite.ts"| 31
Total| 269

The previous report also claimed that TypeScript, lint, and the production build passed under the stated low-memory conditions.

These results are historical claims, not the current audit's test results. Inspect the scripts, confirm whether all suites still exist, and identify their actual execution commands. Do not alter or install anything to make the tests run.

Required new timezone test cases

At minimum, plan tests for:

1. London winter, unique valid offset.
2. London summer, unique valid offset.
3. New York winter and summer.
4. London spring gap.
5. London autumn overlap.
6. New York spring gap.
7. New York autumn overlap.
8. A non-hour transition such as Lord Howe.
9. A historical offset containing seconds, if the runtime provides a suitable representation.
10. Nepal's historical change, with verified date and expected interpretation.
11. UTC calendar-date rollover.
12. Invalid dates and invalid time values.
13. Invalid or missing IANA timezone identifiers.
14. An existing saved profile without an IANA timezone.
15. Manual offset override surviving date and city changes.
16. A user changing date/time after choosing an ambiguous candidate.
17. A nonexistent time blocking ordinary verified calculations.
18. Seconds in local input.
19. Midpoint milliseconds and rounding tolerance.
20. Confirmation that the final UTC instant reaches the actual ephemeris call unchanged within an explicitly defined tolerance.
21. Tests for the boundaries and limitations of candidate discovery.
22. Approximation and unsupported-state behavior.

Do not hardcode expected values merely because a previous AI printed them. Establish expected values from trustworthy data and independently reasoned conversions.

---

8. Wider unresolved Celestia audit — do not lose these items

Timezone work is only one stream of this project. Maintain the full issue backlog below.

8.1 Astronomical calculation engine and correctness

Audit:

- The real astronomy engine and dependencies.
- The "SwissEphemerisEngine" and "swissEphemeris" wrappers.
- Julian Day and UTC conversion.
- Time scales and applicable assumptions.
- Planetary longitude and coordinate conventions.
- Tropical versus sidereal calculations.
- Ayanamsha and related settings.
- House systems and house-cusp calculations.
- Geographic coordinate and latitude handling.
- Precision and rounding.
- Divisional chart calculations.
- Any boundary cases around signs, nakshatras, divisional-chart transitions, and date changes.

Establish a method for independent benchmarking against trustworthy astronomical reference data. Identify which chart calculations can be validated first and define tolerances.

A passing internal test suite does not by itself establish numerical correctness.

8.2 D1–D60 and traditional astrology

Inspect the claimed supported divisional charts. Verify their formulas, sign assignments, longitude handling, boundary behavior, and applicable traditions.

Separate implementation correctness from traditional-school disagreements. Where multiple conventions exist, identify the convention implemented and test it consistently. Do not describe all traditions as equivalent.

Also inspect dasha systems and their date boundaries. Prior reports mentioned multiple dasha systems, including Vimshottari antardasha. Do not assume feature completeness without source inspection and targeted tests.

8.3 KP astrology and percentages

A previous audit raised concern that some KP percentages may be heuristic.

Inspect the actual formulas, data sources, weighting, and labels. Determine whether each percentage is:

- An established deterministic calculation.
- A configurable heuristic.
- An empirical model.
- A display-only score without a defensible probability interpretation.

Do not call a heuristic percentage a validated probability. Recommend honest UI terminology and documentation.

8.4 Polar latitude and house-system fallback

A previous report warned that Placidus house calculation may have a polar-latitude fallback without a user-facing warning.

Verify the actual implementation and determine:

- Where the house calculation fails or becomes unsuitable.
- What fallback is used.
- Whether it changes the requested house system.
- Whether chart data reveals the fallback.
- Whether the user is warned.
- Whether the behavior is tested at high latitudes and boundary cases.

Do not silently substitute a different house system while presenting the output as if the requested method succeeded.

8.5 Saved-profile privacy and security

A previous audit reported that "celestia_saved_profiles" was stored in unencrypted "localStorage".

Confirm the actual key, stored fields, data flows, and current status. Assess:

- Whether full names and birth details are persisted.
- Whether sensitive information appears in logs, URLs, errors, or analytics.
- Whether user data is exposed to third-party calls.
- Whether API routes validate input and handle failures safely.
- Whether browser storage and any export or backup features have clear privacy implications.

Do not claim that encrypting client-side data protects it against every threat. Explain the threat model and practical limitations.

Do not delete or migrate existing data during the audit.

8.6 APIs and geocoding

Inspect geocoding, timezone determination, AI integration, PDF generation, and other API routes.

Check request validation, response contracts, rate limits where applicable, error messages, secret handling, redirects, provider failures, offline behavior, and whether results are silently replaced with approximations.

For geocoding, distinguish a city's current timezone offset from the offset applicable on a historical birth date.

No paid service may become mandatory without explicit permission.

8.7 Runtime, deployment, and UI

Continue investigating the prior HTTP 200/404 discrepancy.

Audit the important screens and forms for:

- Form-state synchronization.
- Errors that the UI hides.
- Loading or stale-state problems.
- Data persistence.
- Mobile layout and usability.
- Invalid inputs and boundary cases.
- Error recovery and accessibility.
- Actual browser functionality versus server response claims.

Where graphical browser testing is unavailable, clearly state which UI behaviors remain untested.

8.8 Relationship and other chart systems

Do not focus solely on Davison charts. Inspect relationship-chart features and other implemented systems, including BaZi, numerology, and PDFs.

Check whether calculations and displayed interpretations are traceable to defined methods and test cases. Look for duplicated calculations, incompatible conventions, date/time handling inconsistencies, and data transformations that lose precision.

8.9 AI and prediction-research layer

Celestia has been described as having an AI integration or Gemini-powered route and a separate prediction-research goal.

Inspect the actual implementation and determine what is operational, experimental, unavailable, or merely planned. Do not claim a third-party AI endpoint works because a redirect succeeded.

Keep deterministic calculations separate from AI-generated interpretations. AI must not silently replace calculated astronomical values with generated estimates.

For the research platform, recommend a reproducible methodology: clearly defined prediction questions, fixed evaluation criteria, leakage prevention, baseline comparisons, recorded failures, sample-size limitations, and honest reporting of results. Do not claim predictive validity merely because an interpretation sounds convincing.

8.10 Backups and repository hygiene

Inspect "tsconfig.json", excluded backup files, scripts, unused modules, duplicate code, and generated artifacts.

Do not delete or reformat files during this audit. Identify potentially unsafe or misleading exclusions and recommend cleanup only after understanding their purpose.

---

9. Proposed historical-timezone files — inspect before recommending changes

Earlier reports proposed the following modifications:

File| Previously proposed purpose
"lib/astronomy/historicalTimezone.ts"| New timezone resolver
"lib/astronomy/cities.ts"| Add optional IANA timezone identifiers to city data
"components/RelationshipAstrologyView.tsx"| Partner birth-time handling and user-visible resolution states
"app/page.tsx"| Primary birth-time handling and user-visible resolution states
"scripts/testHistoricalTimezoneSuite.ts"| Historical-timezone regression suite

The reports also mentioned:

- "lib/astronomy/relationshipEngine.ts"
- "lib/astronomy/ephemeris.ts"
- "swissEphemeris.ts" or its actual current path
- Existing timezone and Julian Day test suites
- Saved-profile serialization and loading code
- "app/api/geocode/route.ts"

These are candidates to inspect, not instructions to edit. Confirm whether each path and functionality still exists in the current repository. Report any necessary files that were missed.

---

10. How to conduct the audit efficiently

Use risk-based ordering.

Priority 1 — Time and calculation integrity

Inspect historical timezone conversion, UTC/local-time consistency, date rollover, ephemeris precision, and Davison midpoint calculations.

Priority 2 — Incorrect or misleading results

Investigate the HTTP 200/404 discrepancy, independent astronomical benchmarks, polar house-system fallbacks, KP percentages, and other known calculation concerns.

Priority 3 — Data safety and reliability

Audit profile storage, API validation, configuration, geocoding, AI connectivity claims, and runtime failures.

Priority 4 — Broader feature coverage

Review remaining chart systems, tests, mobile UI, PDF outputs, project architecture, and opportunities to simplify without breaking existing behavior.

The goal is not to produce the longest possible list of speculative issues. Prioritize findings according to likely correctness impact, evidence, user impact, and repair risk.

Do not replace this audit with a new-feature implementation.

---

11. Required report format

Return a complete, organized report with the following sections.

A. Executive summary

State the current condition of the project based on actual evidence. Identify the most serious verified defects, highest-risk unknowns, and strongest parts of the existing implementation.

Do not give a vague overall score without defining what it measures.

B. Current repository facts

Report verified framework/dependency versions, repository structure relevant to the audit, available scripts, actual test suites, and current Git changes if you can safely inspect them.

Explicitly distinguish present facts from older reported versions and results.

C. Historical-timezone Phase 1C gate

Include:

- Candidate-discovery correctness.
- Gaps and ambiguities.
- Historical timezone limitations.
- Manual override state design.
- Saved-profile compatibility.
- Precision and midpoint tracing.
- UI warnings and error states.
- Proposed resolver contract.
- Tests required.
- Exact remaining blockers.

Finish this section with one of:

- "PHASE 1C: READY FOR IMPLEMENTATION"
- "PHASE 1C: NOT READY"

Explain why. Do not approve the phase based on confidence alone.

D. Wider Celestia issue register

Create an ordered issue table with:

- Unique ID.
- Severity: critical/high/medium/low.
- Category.
- Exact affected file/function, if verified.
- Evidence.
- Actual or potential user impact.
- Reproduction or verification method.
- Confidence level.
- Suggested fix.
- Dependencies and regression risks.
- Whether implementation requires approval.

Do not label an unconfirmed hypothesis a confirmed bug.

E. Test and validation matrix

For every relevant existing suite, record:

- Whether it exists.
- Its exact command.
- Whether it was executed in this session.
- Actual pass/fail result, if executed.
- Coverage gaps.
- Proposed additional tests.

Do not inherit the previously reported 269 passing tests as current results without executing them.

F. Independent astronomy benchmark plan

Specify trustworthy reference sources, input fixtures, supported date range, coordinate conventions, time-scale assumptions, numerical tolerances, and how the expected results will be reproduced.

Clearly separate a reference that was actually consulted from one merely recommended for later verification.

G. Security, privacy, and API review

Report verified findings, threat models, limitations, and safe no-cost recommendations.

H. Prioritized master roadmap

Provide a dependency-aware sequence of future phases, explaining why each phase comes before the next. Include the historical timezone work, calculation benchmarks, runtime issue, privacy, and other earlier findings.

Do not assume the timezone resolver must be the only immediate priority if the source reveals a more serious correctness defect.

I. Exact next approval decision

Finish with:

1. The specific work that is ready.
2. The work that must be postponed.
3. The smallest safe next implementation unit.
4. Required acceptance criteria.
5. Any decision genuinely needed from me.

---

12. Final safeguards

- The repository, not previous AI summaries, determines the current implementation.
- Previous reports are valuable leads, not unquestionable truth.
- A deterministic test is not automatically an accurate test.
- A passing TypeScript check is not proof of runtime correctness.
- An HTTP 200 response is not proof that a page works.
- An offset shown by a timezone library is not independent proof of historical accuracy.
- A user-supplied value is not automatically a verified value.
- A heuristic score is not a validated probability.
- A feature listed in the UI is not proof that the feature is complete.
- A proposed change is not a completed change.
- Do not claim to have edited, built, tested, or deployed anything unless you actually did so.
- Report failed experiments and contradictory evidence instead of hiding them.
- If the audit is too large to finish in one run, return the verified findings, mark the remaining sections incomplete, and provide a precise continuation plan without claiming that the full audit is complete.
- Preserve the full unresolved issue register so later phases do not forget issues found in earlier conversations.

Current authorization: READ-ONLY AUDIT AND PLANNING ONLY. No implementation until I explicitly approve it.

Begin by examining the current repository and confirming which historical claims still match the source code. Then investigate Phase 1C and the wider backlog under the rules above.
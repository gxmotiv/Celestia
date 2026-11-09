# Celestia live repository and release audit — 2026-11-09

## Executive status

This is a source, GitHub Actions, artifact, and configuration audit. It is not a complete independent astronomical certification or physical-device acceptance test.

- Website: PR #13 is merged into the Cloudflare deployment branch, but the newest deployment is not verified. The most recent push deployment build job did not start a runner (runner_id 0, no steps); an earlier push run passed the OpenNext dry-run but its deployment job failed. A successful manual deployment exists only for an older commit from 2026-11-06.
- Android: the v0.2.0 debug prerelease exists and its successful build artifact was inspected. The APKs contain the offline HTML workspace and bundled calculation JavaScript. They are debug-signed, not production-signed, and have not been installed on a physical phone in this audit.
- CI: commit f6a746381493125d17469179a134bb52959869dc passed 25/25 jobs on 2026-11-08: 22 calculation/regression suites, ESLint, production build, and Android APK build. The newer PR #14 checks on 2026-11-09 failed before any job ran: 25/25 jobs had runner_id 0 and zero steps. These are runner-startup failures, not failing test assertions.
- Accuracy: the application uses astronomy-engine behind a legacy-named SwissEphemeris facade. It does not call native Swiss Ephemeris/libswe through that facade. Internal tests are regression checks, not proof of global astronomical or predictive accuracy.

## Exact evidence reviewed

### GitHub and deployment

- PR #13, “Repair Celestia website delivery, Android startup, and calculation integrity”, was merged on 2026-11-08 into deploy/cloudflare-workers-free. The merge commit was a62e9c94d28072ad2805bf6b9d10ac756a6d9784.
- Workflow commit 06bb02da3737828ce19153ff40c8e3b98509ff77 restored the explicit manual-deploy input condition. The change is committed but its workflow has not yet completed a successful run.
- Cloudflare run 42473543307 on commit 30db09f passed the OpenNext build and Worker dry-run job; the separate deployment job failed. Logs for the failed deployment job were not available from the inspected connector response.
- Cloudflare push run 42548604115 and its retry failed at job startup: GitHub reported runner_id 0 and no steps. The public workers.dev URL could not be independently inspected from this execution environment, so no live-site version or visual appearance is claimed.
- Manual deployment run 42251864334 succeeded on the older commit df69e446acef541400b5ffbf45624a33a976b9b3 on 2026-11-06. It does not prove that the merged 2026-11-08/09 code is live.

### Android release artifact

- Successful verification workflow run 42472767559 built commit f6a746381493125d17469179a134bb52959869dc. All 25 jobs succeeded, including the Android job and its artifact upload.
- The corresponding artifact 13614167314 was downloaded and inspected. Each APK is 1,334,002 bytes and contains assets/offline/index.html (23,727 bytes) and assets/offline/celestia-offline.js (319,727 bytes).
- Android Gradle configuration declares application version 0.2.0 / versionCode 2, minSdk 23, compileSdk 35, and split output names for arm64-v8a and armeabi-v7a.
- Both APK files have the identical SHA-256 digest d4eca034bb613c6ad3426da31b2aa1eb062cd56960dad1af2fccce172b0d4240. The inspected APK contents have no lib/ native-library directory. The app is currently a Java/WebView wrapper with bundled web assets, so the two named ABI artifacts are byte-identical rather than architecture-specific binaries.
- The older diagnostic artifact from run 42231055492 contains two 10,338-byte APKs with no offline assets. Do not distribute or install that diagnostic artifact as the offline-capable release. It is distinct from the v0.2.0 release.
- The v0.2.0 APKs are debug-signed. Install as a fresh app; an existing debug build may have a different signing key. No physical Redmi/Android device test is claimed.

### Calculation engine and limits

- The repository contains separate Western, Vedic, KP, BaZi, numerology, transit, relationship, historical-timezone, and PDF modules, plus 22 automated regression-suite scripts.
- The file lib/astronomy/swissEphemeris.ts imports astronomy-engine. The name is a compatibility facade, not evidence that native Swiss Ephemeris is used. Astronomy Engine documents an approximately ±1 arcminute design target for its supported planetary calculations; this upstream target is not a Celestia-wide certificate for custom houses, ayanamsa, nodes, asteroids, solar terms, or all supported epochs.
- The repository's 2026-11-06 accuracy audit already records high-priority unclosed work: independent planetary-position reference vectors, explicit UTC/UT1/TT/Delta-T handling, house-cusp and high-latitude comparisons, independent Lahiri/ayanamsa validation, true-node comparison, and multi-year solar-term reference comparisons.
- The same audit marks D1-D60 boundary/tradition validation, all dasha conventions, KP sub-lord and percentage semantics, synastry/composite/Davison logic, numerology conventions, PDF parity, and saved-profile/privacy behavior as partial or requiring audit.
- Historical timezone resolution must remain qualified. IANA states that its database is not authoritative for all past local times and that pre-1970 coverage is incomplete. A resolved IANA result is not proof that an exact historical birth clock time is known.
- Swiss Ephemeris documentation distinguishes planetary calculations using ET/TT or UT input and house calculations using UT; IERS documentation identifies TT as the time argument for IAU 2000A precession/nutation and distinguishes UT1 for Earth-rotation work. These contracts should be documented and tested end-to-end before precision claims are made.

## UI and UX review

- The application uses a dark navy / slate visual system with amber accents, chart-specific panels, horizontal tradition navigation, and responsive Tailwind utility classes. This is a source-level review only; a live screenshot and phone viewport test were not possible while the deployment was unverified.
- The initial page loads a Leonardo da Vinci chart with the profile editor collapsed. The new PR #14 patch labels this starter chart as SAMPLE until the user submits or selects a profile.
- PR #14 also synchronizes the open birth form when a saved profile is selected and prevents stale city-search responses from overwriting newer results.
- The verification panel previously described its internal checks as “Empirical verification”. PR #14 changes this to internal calculation checks and adds a notice that passing selected assertions does not certify absolute astronomical accuracy or predictive validity.
- Remaining UI acceptance work: test the birth form and profile manager at narrow phone widths; keyboard-operate all clickable controls; inspect focus visibility and color contrast; verify empty/invalid/ambiguous timezone states; confirm navigation, chart resizing, printing/PDF, and offline fallback in a real browser and on a physical Android device.

## Offline scope

The inspected v0.2.0 release notes define offline mode as local Western, Vedic, headline numerology, BaZi natal calculations, and on-device profiles. AI/live research, external geocoding/timezone lookup, cloud sync, relationship matching, transits, KP, and several advanced panels are not full offline features. Do not advertise full website parity offline.

## Remaining priority gates

1. Restore GitHub Actions job startup and rerun PR #14. A runner_id of 0 with no steps is not a test result.
2. Obtain a successful Cloudflare build, deploy, and post-deploy HTTP/HTML smoke check on the current deployment branch. Then verify the live version and a mobile screenshot.
3. Independently benchmark Sun, Moon, planets, time scales, house cusps, sidereal longitudes, true/mean nodes, and solar-term instants against explicitly configured reference data (for example, JPL Horizons and documented Swiss Ephemeris APIs). Save the exact center, frame, time scale, apparent/astrometric settings, epoch, and tolerance for every vector.
4. Audit each D1-D60 varga, each dasha and year-length convention, KP boundaries/scores, relationship midpoint conventions, all numerology traditions, and PDF/on-screen value parity against documented worked examples.
5. Complete browser and physical-device testing, including offline airplane-mode operation, saved-profile persistence/deletion/export, accessibility, and Android 12 installation.
6. Keep AI provider/API-key work separate until requested. Do not put provider secrets in client-side code or the APK.

## External reference standards

- Astronomy Engine project documentation: https://github.com/cosinekitty/astronomy
- Swiss Ephemeris API/programming documentation: https://www.astro.com/swisseph/swephprg.htm
- Swiss Ephemeris time-scale and house API documentation: https://www.astro.com/swisseph-download/doc/swisseph.pdf
- IERS time argument for Earth-orientation products: https://www.iers.org/iers/en/service/faqs/thenewiauresolutions/timeargumentforusingiersproducts-104-157
- NASA/JPL Horizons API parameters: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- IANA timezone database theory and historical limitations: https://www.iana.org/time-zones/theory

## Scope statement

This document records what was directly inspected and what remains unverified. Passing CI means the selected code and test cases passed; it does not prove every chart, historical epoch, tradition, interpretation, medical claim, or prediction is correct.

## PR #14 follow-up source changes

The draft PR `fix/celestia-ux-integrity-audit` adds these reviewed changes on top of the deployment branch:

- Saved-profile selection now synchronizes the open BirthForm editor, and the city geocoder ignores stale responses from older search requests.
- The built-in Leonardo da Vinci starter chart is explicitly marked as a sample until the user submits or selects a profile.
- The Verification Center describes its 108 assertions as internal checks, not empirical certification. Its system-filter cards are keyboard-operable and show a visible focus indicator.
- The medical-astrology panel was changed from clinical-sounding “vulnerable systems”, organ-risk priority labels, and preventive-treatment advice to historical body symbolism only. It no longer suggests supplements, detoxes, medication, or treatment. The UI states that astrology cannot diagnose, screen for, predict, or prevent illness and must not replace qualified medical care.
- A new `scripts/testMedicalAstrologySymbolismSuite.ts` contains 10 assertions for the symbolic, non-diagnostic report contract. It has been added to `.github/workflows/verify.yml`. This test has not yet run successfully because current GitHub Actions jobs are failing before runner assignment.

Latest PR #14 checks observed during this audit (2026-11-09) still show `runner_id: 0` and zero execution steps for all matrix jobs. Do not describe those checks as source-code test failures or as a pass. PR #14 remains a draft and has not been merged.


### House reference-frame consistency follow-up

A source trace found that `calculateHouses()` previously paired `Astronomy.SiderealTime()` (Greenwich Apparent Sidereal Time, GAST) with a separate mean-obliquity polynomial. Those inputs describe different equinox/reference frames. Astronomy Engine's own API exposes `e_tilt(time).tobl` (true obliquity), and its maintainer's ascendant/Midheaven example uses that value with apparent sidereal time. The house code now uses the same engine's true obliquity for its MC, Ascendant, Vertex and Placidus semi-arc geometry.

A new `scripts/testHouseFrameConsistencySuite.ts` checks the MC and Ascendant equations against GAST and Astronomy Engine true obliquity at three sample epochs/locations (six regression assertions). This is a frame-consistency test; it is not an independent comparison of all 12 Placidus cusps against Swiss Ephemeris or USNO reference vectors. High-latitude behavior and a complete house-system benchmark remain open.

The Astronomy Engine 2.1.19 TypeScript declaration was checked directly: `e_tilt(time: AstroTime): EarthTiltInfo` is present in the version pinned by the repository. The package documents GAST separately from UT1/UTC and TT; the library approximates UT1 and UTC as equal for its design target, which is not a replacement for explicit high-precision time-scale treatment.


### Vedic divisional-chart scope and dignity follow-up

The current divisional-chart configuration contains the 16 classical Shodashavarga charts (D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60). This is a traditional 16-chart set spanning D1 through D60, not an implementation of every possible numbered varga. The Vedic chart selector now says this explicitly.

A dignity-label review found that the divisional-chart Sun classification omitted Cancer (Moon-ruled) and Pisces (Jupiter-ruled) from the Sun's natural-friend signs. Those two cases are now labeled Friendly. A new `scripts/testDivisionalDignitySuite.ts` checks Cancer, Pisces, a neutral Mercury-ruled Virgo case, and the configured 16-chart Shodashavarga count (four assertions). The natural relationship table is aligned to the Sun's friends Moon, Mars and Jupiter; it is still a simplified sign-lord dignity label and does not compute the complete five-fold temporary/compound friendship for each chart.

### Profiles, geocoding and PDF-export follow-up

- Saved-profile rows are now separate native buttons for selecting and deleting, with accessible labels and visible keyboard focus. The saved-profile loader filters malformed records without deleting or rewriting the original local-storage value. Storage write failures are surfaced to the user rather than silently reporting a successful save.
- Birth-place geocoding now rejects malformed coordinate strings rather than parsing numeric prefixes, enforces a 160-character forward-query limit, clears timeout timers after fetch success or failure, and drops provider results with missing, non-numeric, or out-of-range coordinates. The old provider mapping could convert missing latitude/longitude to 0,0; that fallback has been removed.
- The server PDF route previously read nested fields that do not exist in the current Vedic, numerology and BaZi data types. It could return HTTP 200 while printing N/A for valid values and prevent the client-side dossier fallback. The route now maps the actual chart schema: Vedic Moon Rasi/Nakshatra strings, numeric numerology fields, BaZi zodiac animal and four pillar names, Western planet positions and cusps. It also applies request-size limits, sanitized attachment filenames, non-cacheable responses and an explicit interpretive/non-medical disclosure.
- PDF timezone metadata now distinguishes IANA mode from manually supplied or legacy numeric offsets. It does not label a standard offset as a historically verified, date-specific offset.
- Added geocoding tests for malformed coordinates, overlong queries and invalid provider coordinates. Added PDF-generation tests for valid PDF response, PDF signature, invalid JSON and oversized input handling (six assertions). The verification matrix now contains 26 suites plus lint, production build and Android APK build (29 jobs total).
- The PDF and geocoding suites, along with the other PR #14 changes, have not yet completed on a GitHub runner. Current Actions results still fail before runner assignment (null runner ID and zero steps); these are not source-level pass results.
### Full dossier PDF UX follow-up

- The PrintModal's Download Full PDF action previously accepted the PDFKit endpoint's short summary as a successful full-report download. The endpoint now maps the real chart data structures for its own concise summary use, but the full-report button now renders the actual multi-section PrintDossier component instead.
- The HTML-to-canvas renderer now expands clipping/scroll ancestors in html2canvas-pro's cloned DOM before capture, so a scrollable preview is not intentionally limited to the visible window. The UI no longer describes this rasterized capture as vector output; its scale is capped at 1.25 to limit memory pressure on mobile devices.
- The Medical Astrology subtab is now labeled Medical Symbolism, matching its non-diagnostic historical content.
- The report cover no longer calls itself an Official Archival Dossier; it is labeled a Personal Archival Natal Dossier.
- Important limit: html2canvas-pro reconstructs a DOM-based visual representation rather than producing a true vector rendering of every DOM element. PDF appearance still needs visual inspection in a real desktop browser and Android WebView, especially for long reports, charts, page boundaries, and narrow screens.
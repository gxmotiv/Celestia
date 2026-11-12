# Celestia

Live web app: https://celestia.gagandeep-hwr.workers.dev/

## Android APKs

Celestia includes an Android WebView wrapper with two modes:

- **Online mode:** opens the full live Celestia website when Android reports a validated internet connection.
- **Offline mode:** opens the calculator bundled inside the APK when there is no validated connection or the live website fails to load.

The bundled offline workspace currently runs the same local calculation modules as the web app for:

- Western tropical natal chart
- Vedic sidereal natal chart and Vimshottari Mahadasha summary
- Numerology
- Chinese BaZi Four Pillars

Offline profiles are stored only in the Android app's local WebView storage. They are not uploaded or synchronized. Clearing app data or uninstalling the app can remove them.

### Offline limitations

- The offline birth form requires a manually supplied UTC offset. It does not infer historical daylight-saving or legal-time changes from a city name. Check the offset that applied at the birth place and date.
- When birth time is unknown, 12:00 is used only as an explicit placeholder; time-sensitive results must be treated as uncertain.
- AI readings, live research, external geocoding/time-zone lookup, cloud synchronization and other online-only pages still require internet.
- The offline workspace is a local core-calculation mode, not yet a full offline copy of every advanced website panel.
- The calculation engine uses the repository's astronomy-engine-backed compatibility facade. It is not native Swiss Ephemeris/libswe; offline availability does not increase astronomical accuracy.

### Download

The Android build workflow creates ARM32 and ARM64 APKs and publishes them as GitHub prerelease assets after pushes to deploy/cloudflare-workers-free.

[Download Android APKs from GitHub Releases](https://github.com/gxmotiv/Celestia/releases)

A 30-day copy is also uploaded as a GitHub Actions artifact:

[Open Celestia Android Actions](https://github.com/gxmotiv/Celestia/actions/workflows/android-build.yml)

### Signing

These are debug-signed test APKs. They are suitable for installation/testing, but the runner-generated debug signing key is not a permanent release key. Before distributing production updates, configure one stable private release keystore through GitHub Actions secrets and sign every release with that same key. Never commit a production keystore or its passwords to the repository.

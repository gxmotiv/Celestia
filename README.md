# Celestia

Live web app: https://celestia.gagandeep-hwr.workers.dev/

## Android APKs

Celestia includes an Android WebView wrapper that opens the live Celestia website.

- **ARM64 (64-bit):** `app-arm64-v8a-debug.apk`
- **ARM32 (32-bit):** `app-armeabi-v7a-debug.apk`

### Build APKs

The GitHub Actions workflow is configured to build both APK variants and upload them as a 30-day artifact. Once a run succeeds:

1. Open the **Actions** tab.
2. Select **Celestia Android APKs**.
3. Open the latest successful run.
4. Download `celestia-android-apks` from the **Artifacts** section.

[Open GitHub Actions](https://github.com/gxmotiv/Celestia/actions/workflows/android-build.yml) · [GitHub Releases](https://github.com/gxmotiv/Celestia/releases)

### Important signing note

The workflow creates debug-signed test APKs. They are suitable for installation/testing, but the runner-generated debug signing key is not a permanent release key. Before distributing production updates, configure one stable private release keystore through GitHub Actions secrets and sign every release with that same key. Never commit a production keystore or its passwords to the repository.

The Android wrapper needs an internet connection to load the live website. Astrology calculations and other app features remain provided by the website; this wrapper does not make them offline.

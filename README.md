# Celestia

Live web app: https://celestia.gagandeep-hwr.workers.dev/

## Android APKs

Celestia includes an Android WebView wrapper that opens the live Celestia website.

- **ARM64 (64-bit):** `app-arm64-v8a-debug.apk`
- **ARM32 (32-bit):** `app-armeabi-v7a-debug.apk`

### Build APKs

1. Open the **Actions** tab.
2. Select **Celestia Android APKs**.
3. Choose **Run workflow**.
4. Keep **publish_release** set to false to build test APK artifacts only. Set it to true to create a prerelease containing the APKs.
5. Download the two APKs from the run's **Artifacts** section, or from the GitHub Releases page if you published a prerelease.

[Open GitHub Actions](https://github.com/gxmotiv/Celestia/actions/workflows/android-apk.yml) · [GitHub Releases](https://github.com/gxmotiv/Celestia/releases)

### Important signing note

The current workflow creates debug-signed test APKs. They are suitable for installation/testing, but the runner-generated debug signing key is not a permanent release key. Before distributing production updates, configure one stable private release keystore through GitHub Actions secrets and sign every release with that same key. Never commit a production keystore or its passwords to the repository.

The Android wrapper needs an internet connection to load the live website. Astrology calculations and other app features remain provided by the website; this wrapper does not make them offline.

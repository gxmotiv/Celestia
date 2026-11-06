# Celestia

Live web app: https://celestia.gagandeep-hwr.workers.dev/

## Android APKs

Celestia includes an Android WebView wrapper that opens the live Celestia website.

- **ARM64 (64-bit):** `app-arm64-v8a-debug.apk`
- **ARM32 (32-bit):** `app-armeabi-v7a-debug.apk`

### Download

The Android build workflow creates both APKs and publishes them as GitHub prerelease assets. Open **GitHub Releases** and choose the latest **Celestia Android** prerelease:

[Download Android APKs from GitHub Releases](https://github.com/gxmotiv/Celestia/releases)

A copy is also uploaded as a 30-day GitHub Actions artifact:

[Open Celestia Android Actions](https://github.com/gxmotiv/Celestia/actions/workflows/android-build.yml)

### Important signing and network notes

These are debug-signed test APKs. They are suitable for installation/testing, but the runner-generated debug signing key is not a permanent release key. Before distributing production updates, configure one stable private release keystore through GitHub Actions secrets and sign every release with that same key. Never commit a production keystore or its passwords to the repository.

The Android wrapper needs an internet connection to load the live website. Astrology calculations and other app features remain provided by the website; this wrapper does not make them offline.

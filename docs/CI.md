# Continuous integration

FrontRow targets two CI tiers:

1. **Free, contributor-friendly** — runs on every PR, no secrets required.
2. **Cloud labs (opt-in)** — runs against Sauce Labs, BrowserStack, or Maestro Cloud when secrets are configured.

## Tier 1: free PR checks

`.github/workflows/ci.yml` runs on every `pull_request` and `push` to `main`:

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`

These are fast (≤ 1 minute) and catch the bulk of regressions.

## Tier 2: cloud labs (opt-in)

These workflows only execute when the corresponding repository secret exists, so a fork without credentials simply skips them.

### Maestro Cloud

`.github/workflows/maestro.yml` runs the entire `tests/maestro/` flow set on Maestro Cloud against an uploaded build. Trigger via:

- A tag push (`git tag v0.1.0 && git push --tags`)
- The **Run workflow** button in the Actions tab

Requires:

- `MAESTRO_CLOUD_API_KEY` — from https://app.mobile.dev
- One of `IOS_BUILD_URL` / `ANDROID_BUILD_URL` — a binary the cloud can install. You can build these in a parallel job (`expo build` / `expo run:android --variant release` then upload), or supply a fixed URL.

### Sauce Labs (planned)

A `.github/workflows/sauce.yml` is planned that runs `tests/appium/` on Sauce Labs real devices. Will require:

- `SAUCE_USERNAME`
- `SAUCE_ACCESS_KEY`

### BrowserStack (planned)

A `.github/workflows/browserstack.yml` is planned for the same Appium suite. Will require:

- `BROWSERSTACK_USERNAME`
- `BROWSERSTACK_ACCESS_KEY`

## Building binaries

For cloud lab runs you'll usually need a `.app` (iOS simulator) or `.apk` (Android). Locally:

```bash
# Debug build for simulator/emulator
npx expo run:ios --no-bundler
npx expo run:android --no-bundler --variant release
```

For release builds suitable for real devices, use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview
```

EAS isn't required for CI; you can also build inside a workflow runner using Xcode / Gradle directly.

# Appium (WebdriverIO + TypeScript) tests

Cross-platform UI tests for FrontRow on iOS and Android. testIDs in `src/testIds.ts` are surfaced as accessibility identifiers on both platforms, so the same selectors work on both.

## Setup

```bash
cd tests/appium
npm install                   # installs Appium + WebdriverIO into this folder only
npx appium driver install xcuitest      # iOS
npx appium driver install uiautomator2  # Android
```

## Build a binary first

WebdriverIO needs an installable app to drive. Build one with Expo:

```bash
# from the repo root
npx expo run:ios --no-install
npx expo run:android --no-install
```

This produces `ios/build/Build/Products/Debug-iphonesimulator/FrontRow.app` and `android/app/build/outputs/apk/debug/app-debug.apk`. The configs default to those paths; override with `IOS_APP_PATH` / `ANDROID_APK_PATH` if you want.

## Run

```bash
# iOS simulator (boot one first via Xcode or `xcrun simctl boot ...`)
IOS_DEVICE='iPhone 15' IOS_VERSION='17.5' npm run ios

# Android emulator (boot one first via Android Studio or `emulator -avd ...`)
ANDROID_DEVICE='Pixel_6' ANDROID_VERSION='14' npm run android
```

## Convention

- One `*.spec.ts` per feature.
- Use `helpers.ts` for selector lookups: `byId('eventDetail.buyButton')` resolves to `~eventDetail.buyButton`, which works on both platforms because we wire `testID` into accessibility identifiers.
- Avoid hard-coded waits; use `waitForId(...)`.

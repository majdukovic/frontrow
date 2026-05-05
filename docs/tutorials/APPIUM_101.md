# Appium 101

Appium is the cross-platform veteran of mobile UI automation. FrontRow ships a WebdriverIO + TypeScript setup under `tests/appium/`.

## Setup

```bash
cd tests/appium
npm install
npx appium driver install xcuitest
npx appium driver install uiautomator2
```

## Build the app once

WebdriverIO drives an installable build. Generate one from the repo root:

```bash
npx expo run:ios --no-bundler        # iOS simulator
npx expo run:android --no-bundler    # Android emulator/device
```

These produce the binaries the configs default to:

- `ios/build/Build/Products/Debug-iphonesimulator/FrontRow.app`
- `android/app/build/outputs/apk/debug/app-debug.apk`

## Run the smoke spec

```bash
# Boot a simulator/emulator, then:
cd tests/appium
IOS_DEVICE='iPhone 15' IOS_VERSION='17.5' npm run ios
# or
ANDROID_DEVICE='Pixel_6' ANDROID_VERSION='14' npm run android
```

## Anatomy of a spec

```ts
import { browser } from '@wdio/globals';
import { waitForId, tapId, typeIntoId } from './helpers';

describe('Login', () => {
  it('signs in with the demo account', async () => {
    await waitForId('screen.events');
    await browser.$('~Profile').click();
    await tapId('profile.signInButton');
    await typeIntoId('login.emailInput', 'demo@frontrow.app');
    await typeIntoId('login.passwordInput', 'demo1234');
    await tapId('profile.signInButton');
    await waitForId('profile.signOutButton');
  });
});
```

Key points:

- `~<id>` is the **accessibility id** selector — works on both iOS and Android because FrontRow wires `testID` into accessibility identifiers everywhere.
- `helpers.ts` wraps the common patterns: `byId`, `waitForId`, `tapId`, `typeIntoId`.
- Avoid `XPath` selectors. They're slow and brittle; the `~<id>` approach is the correct first choice for FrontRow.

## Cross-platform helpers

When iOS and Android need different selectors (rare in FrontRow), switch on the platform:

```ts
import { isAndroid } from './helpers';

const tabSelector = (await isAndroid())
  ? 'android=new UiSelector().description("Profile")'
  : '~Profile';
```

In FrontRow this is almost never needed because every interactive element has a `testID`.

## Where to look next

- `tests/appium/specs/` — copy `login.spec.ts` as a starting point.
- WebdriverIO's [API docs](https://webdriver.io/docs/api).
- Cloud labs (Sauce, BrowserStack): see `docs/CI.md` for the planned wiring.

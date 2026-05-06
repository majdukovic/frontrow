# Native showcase

A pair of hand-rolled native screens — one Swift `UIViewController`, one
Kotlin `Activity` — bridged into the React Native shell so QA can
exercise authentic native targets with Espresso (Android) and XCUITest
(iOS). The whole point: prove that the same `testID` contract used by
the JS-driven screens carries over to native code.

An **Expo config plugin** at `plugins/with-native-showcase.js` copies
these files into `ios/` and `android/` on every `expo prebuild` and
wires them into the host projects (Xcode target membership,
AndroidManifest activity, MainApplication package registration). That
means the files survive `--clean` and stay in lockstep with whatever
the prebuild pipeline emits.

The "manual wiring" instructions below are kept as a reference for
what the plugin does under the hood, in case you want to apply the
changes by hand or audit the plugin's output.

## What's in here

```
native-showcase/
├── ios/
│   ├── FrontRowNativeDemoViewController.swift   # the screen
│   └── FrontRowNativeDemoModule.swift           # RCTBridgeModule wrapper
├── android/com/frontrow/nativedemo/
│   ├── NativeDemoActivity.kt                    # the screen
│   ├── NativeDemoModule.kt                      # ReactContextBaseJavaModule
│   └── NativeDemoPackage.kt                     # ReactPackage registration
└── tests/
    ├── espresso/NativeDemoActivityTest.kt       # Espresso target
    └── xcuitest/NativeDemoTests.swift           # XCUITest target
```

## How testIDs map to native code

| Layer        | RN testID prop | Native attribute                                  |
| ------------ | -------------- | ------------------------------------------------- |
| iOS (UIKit)  | n/a            | `accessibilityIdentifier`                         |
| Android view | n/a            | `contentDescription` (or `setTag` with view-id)   |

The native code in this directory sets those attributes manually so the
XCUITest queries (`app.buttons["nativeDemo.incrementButton"]`) and
Espresso matchers (`onView(withContentDescription("nativeDemo.title"))`)
match the same string used in `src/testIds.ts`.

## Wiring it up — iOS

1. Drag `ios/FrontRowNativeDemoViewController.swift` and
   `ios/FrontRowNativeDemoModule.swift` into the Xcode project under the
   `FrontRow` group.
2. Add the bridge declaration to `ios/FrontRow/FrontRow-Bridging-Header.h`:
   ```objc
   #import <React/RCTBridgeModule.h>
   ```
3. Append the module declaration in either a new `.m` file or via
   `@objc` exposure (already on the Swift class). React Native's
   autolink picks it up via `RCT_EXTERN_METHOD`.
4. Add the test target file `tests/xcuitest/NativeDemoTests.swift` to
   the existing `FrontRowUITests` target (Xcode → Edit Scheme → Test).
5. The config plugin handles all of the above on prebuild. The manual
   steps are for understanding/debugging only — running them by hand
   on top of the plugin would create duplicate entries.

## Wiring it up — Android

1. Copy the `com/frontrow/nativedemo/` tree into
   `android/app/src/main/java/`.
2. Register the package in `android/app/src/main/java/app/frontrow/qa/MainApplication.kt`:
   ```kotlin
   override fun getPackages(): List<ReactPackage> {
     val packages = PackageList(this).packages
     packages.add(NativeDemoPackage())
     return packages
   }
   ```
3. Add `<activity android:name="com.frontrow.nativedemo.NativeDemoActivity" />`
   inside `<application>` in `android/app/src/main/AndroidManifest.xml`.
4. Drop `NativeDemoActivityTest.kt` into
   `android/app/src/androidTest/java/com/frontrow/nativedemo/`.
5. Run `./gradlew connectedAndroidTest` from `android/`.

## How to call it from RN

Once wired, expose the module from JS:

```ts
import { NativeModules, Platform } from 'react-native';

export function openNativeDemo(): void {
  if (NativeModules.FrontRowNativeDemo?.open) {
    NativeModules.FrontRowNativeDemo.open();
  } else if (__DEV__) {
    console.warn('FrontRowNativeDemo is not registered on this platform.');
  }
}
```

Then add a button to `DebugScreen.tsx`:

```tsx
<Row
  testID="debug.openNativeDemo"
  label="Open native demo"
  onPress={openNativeDemo}
/>
```

The XCUITest scaffold (`testNativeDemoOpens_AndIncrementUpdatesCounter`)
already targets the `debug.openNativeDemo` testID, so the test goes
green the moment the wiring is complete.

## How the plugin works

`plugins/with-native-showcase.js` runs on every `expo prebuild` and:

1. **iOS file copy** (`withDangerousMod`): copies `ios/*.swift` into
   `ios/FrontRow/`.
2. **iOS Xcode membership** (`withXcodeProject`): adds the copied
   files to the FrontRow target so they actually compile.
3. **Android file copy** (`withDangerousMod`): copies the
   `com/frontrow/nativedemo/` package tree into
   `android/app/src/main/java/`.
4. **Android manifest** (`withAndroidManifest`): appends
   `<activity android:name="com.frontrow.nativedemo.NativeDemoActivity" />`
   inside `<application>`.
5. **Android package registration** (`withMainApplication`): inserts
   the import + `packages.add(NativeDemoPackage())` into
   `MainApplication.kt`.

All steps are idempotent — re-running prebuild on already-modified
files is a no-op rather than producing duplicates.

The plugin is registered in `app.json` as
`"./plugins/with-native-showcase"`.

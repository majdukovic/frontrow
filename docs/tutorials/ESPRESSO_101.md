# Espresso 101

Espresso is Google's first-party Android UI test framework. Tests run inside the app process under the JVM, which means they're fast and reliable but Android-only.

For FrontRow we use Espresso to demonstrate **native Android testing against a React Native UI**. testIDs in `src/testIds.ts` are exposed as Android `resource-id` values, so Espresso matches them with `withResourceName(...)`.

## Setup

You need:

- Android Studio (or just the SDK + Gradle)
- An emulator or device connected via `adb`
- FrontRow built once with `npx expo run:android`

Copy the test templates into the standard instrumentation folder:

```bash
mkdir -p android/app/src/androidTest/java/app/frontrow/qa
cp tests/espresso/*.kt android/app/src/androidTest/java/app/frontrow/qa/
```

## Run the smoke test

```bash
cd android
./gradlew :app:connectedAndroidTest
```

Gradle builds a test APK, installs it alongside the FrontRow APK on the connected device, and runs the test class.

## Anatomy of a test

```kotlin
@RunWith(AndroidJUnit4::class)
class SmokeEspressoTest {
  @get:Rule
  val activityRule = ActivityScenarioRule(ReactActivity::class.java)

  @Test
  fun appLaunches_eventsTabIsVisible() {
    onView(withResourceName("screen.events")).check(matches(isDisplayed()))
  }
}
```

Key points:

- `ActivityScenarioRule` launches the React Native activity. FrontRow's main activity extends `ReactActivity`.
- `withResourceName("screen.events")` matches against the React Native View's `nativeID`, which RN sets from the `testID` prop.
- Espresso has its own assertion DSL: `matches(isDisplayed())`, `matches(withText("..."))`, etc.

## Common matchers

```kotlin
withResourceName("eventDetail.buyButton")    // testID
withText("Buy")                                // visible text
withContentDescription("Buy ticket")           // accessibilityLabel
allOf(withResourceName("..."), isDisplayed())  // composing
```

## Driving the app

Espresso has a fluent API: find a view, perform an action.

```kotlin
onView(withResourceName("eventDetail.buyButton")).perform(click())
onView(withResourceName("login.emailInput")).perform(typeText("demo@frontrow.app"))
```

## Where Espresso shines vs. Maestro/Appium

- It's 5–10× faster than Appium because there's no WebDriver protocol.
- It runs in-process, so you can read the app's internal state in tests if you need to.

## Where Espresso falls short

- Android only.
- You need a working Android Studio toolchain.
- Tests share a JVM with the app, so a crash in the app crashes the test run.

## Where to look next

- Google's [Espresso cheat sheet](https://developer.android.com/training/testing/espresso/cheat-sheet).
- `tests/espresso/SmokeEspressoTest.kt` as a starting point.
- For multi-step flows, look at Espresso's `IdlingResource` to wait on async work.

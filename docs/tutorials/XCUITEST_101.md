# XCUITest 101

XCUITest is Apple's first-party iOS UI test framework. Tests run out-of-process and drive the app via the accessibility tree, which means **every `testID` we set on a React Native component shows up as an `accessibilityIdentifier` to XCUITest**.

## Setup

You need:

- Xcode 15+
- A booted iOS Simulator (or device)
- FrontRow built once with `npx expo run:ios`

Add a UI Test target to the Xcode project (one-time):

1. Open `ios/FrontRow.xcworkspace`.
2. **File → New → Target… → UI Testing Bundle.** Name it `FrontRowUITests`.
3. Replace the auto-generated `FrontRowUITests.swift` with the template at `tests/xcuitest/FrontRowUITests.swift`.

## Run the smoke test

From Xcode: **Product → Test (⌘U)**.

From the command line:

```bash
cd ios
xcodebuild test \
  -workspace FrontRow.xcworkspace \
  -scheme FrontRow \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  -only-testing:FrontRowUITests
```

## Anatomy of a test

```swift
final class FrontRowUITests: XCTestCase {
  override func setUpWithError() throws {
    continueAfterFailure = false
  }

  func testAppLaunches_EventsScreenIsVisible() throws {
    let app = XCUIApplication()
    app.launch()

    let events = app.otherElements["screen.events"]
    XCTAssertTrue(events.waitForExistence(timeout: 10))
  }
}
```

Key points:

- `XCUIApplication()` is your handle to the running app. `app.launch()` cold-starts it.
- Element queries are typed by role: `app.buttons[...]`, `app.staticTexts[...]`, `app.otherElements[...]`. The string is the `accessibilityIdentifier`, which is our `testID`.
- `waitForExistence(timeout:)` is XCUITest's idiomatic implicit wait.

## Common queries

```swift
app.buttons["eventDetail.buyButton"]                 // any button
app.textFields["login.emailInput"]                   // visible text field
app.secureTextFields["login.passwordInput"]          // password field
app.tabBars.buttons["Profile"]                       // tab bar entry by label
app.alerts.element.buttons["OK"]                     // system alert
```

For React Native non-button interactive elements (e.g. the bottom-sheet container) use `otherElements["the.id"]`.

## Driving the app

```swift
app.buttons["profile.signInButton"].tap()

let email = app.textFields["login.emailInput"]
email.tap()
email.typeText("demo@frontrow.app")
```

## Where XCUITest shines

- iOS-only, but very stable and faster than Appium.
- Tight integration with Xcode (recording, debugging, time-travel).
- Free with Xcode.

## Where XCUITest falls short

- iOS only.
- The element query DSL is loose: misspelled identifiers don't fail at compile time.
- Cross-target sharing of helpers is awkward without a Swift Package.

## Where to look next

- Apple's [User Interface Tests documentation](https://developer.apple.com/documentation/xctest/user_interface_tests).
- `tests/xcuitest/FrontRowUITests.swift` as a starting point.
- Look at `app.debugDescription` printed via `print(app.debugDescription)` in a test to inspect the accessibility tree at runtime.

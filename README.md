# FrontRow

> An open-source mobile app explicitly designed as a **QA automation training playground**.

FrontRow is a concert & events ticketing app for iOS and Android, built so that QA engineers can practice mobile test automation against a realistic-looking app that ships with stable accessibility identifiers, a fully-featured debug menu, deterministic seed data, and a complete set of hooks for every device-only capability that browsers can't reach.

It's the kind of app you'd clone, run on a simulator in under five minutes, and then use to learn — or teach — Maestro, Appium, Espresso, and XCUITest, all targeting the same identifiers.

## Why this exists

- The widely-used Sauce Labs `my-demo-app-rn` was deprecated in May 2024.
- Existing open-source samples cover login + cart and stop there.
- Nothing systematically exercises date control, location mocking, IAP simulation, purchase restoration, microphone, haptic feedback, biometric auth, push, deep-link-to-anywhere, and seedable scenarios all in one place.

FrontRow fills that gap. MIT-licensed, fork-friendly, no backend required.

## Quick start

Requires Node 20+ and either Xcode or Android Studio.

```bash
git clone <this repo>
cd frontrow
npm install
npm run ios       # or: npm run android
```

That's it. No backend to run, no accounts to create, no secrets to configure.

> Some Phase 5+ capabilities (MMKV, real local notifications) require a development build. The standard `npm run ios` / `npm run android` covers that — Expo Go alone is not enough once `expo prebuild` has run.

## What's inside

- **React Native + Expo (prebuilt)** — single TypeScript codebase, native iOS and Android projects committed.
- **Local-first** — all data lives in MMKV, seeded from JSON fixtures, no backend.
- **Stable test IDs** — central registry in `src/testIds.ts`. testIDs become `accessibilityIdentifier` on iOS and `resource-id` on Android, so Maestro / Appium / Espresso / XCUITest all hit the same selectors. A custom ESLint rule (`frontrow/require-testid`) flags interactive elements that ship without one.
- **QA Debug Menu** — Build info · Jump-to-screen · Device-capability demos · Seed scenarios · Time travel · Force error (4xx / 5xx / timeout / offline) · Network delay · Locale override · Replay onboarding · Fake push · Crash · IAP outcome control · Analytics event log · Reset.
- **Deep-link contract** — every public deep link documented in [docs/DEEPLINKS.md](docs/DEEPLINKS.md), including `frontrow://debug/seed/<scenario>` to put the app into a known state from a single `launchApp` directive.
- **Mock IAP** — products, receipts, restore-purchases, with QA-controlled outcomes (success, decline, cancel, pending) — see [docs/tutorials/SCENARIOS_AS_FIXTURES.md](docs/tutorials/SCENARIOS_AS_FIXTURES.md).
- **Device capability demos** — camera, microphone, location, biometric, haptics, calendar, share, notifications. Each has a dedicated screen with stable testIDs.
- **Realistic product surfaces** — onboarding pager · search with debounce + genre + favorites filters · paginated infinite scroll · star-rated reviews · ticket detail with QR + cancel + transfer · saved payment methods CRUD · edit-profile with dirty-state guard · forgot-password (email → OTP → reset) · offline banner — every feature ships with at least one Maestro flow.

## Test frameworks

| Framework                 | Lives in          | Tutorial                                       |
| ------------------------- | ----------------- | ---------------------------------------------- |
| Maestro                   | `tests/maestro/`  | [Maestro 101](docs/tutorials/MAESTRO_101.md)   |
| Appium (WebdriverIO + TS) | `tests/appium/`   | [Appium 101](docs/tutorials/APPIUM_101.md)     |
| Espresso (Android)        | `tests/espresso/` | [Espresso 101](docs/tutorials/ESPRESSO_101.md) |
| XCUITest (iOS)            | `tests/xcuitest/` | [XCUITest 101](docs/tutorials/XCUITEST_101.md) |

A flow is a flow regardless of framework. Look at `tests/maestro/auth/login.yaml` and `tests/appium/specs/login.spec.ts` side by side — they target identical test IDs.

## Documentation map

- [docs/DEEPLINKS.md](docs/DEEPLINKS.md) — full deep-link contract.
- [docs/DEBUG_MENU.md](docs/DEBUG_MENU.md) — every QA Debug Menu action.
- [docs/SCENARIOS.md](docs/SCENARIOS.md) — seed scenario catalog.
- [docs/TEST_IDS.md](docs/TEST_IDS.md) — testID conventions and lint rules.
- [docs/A11Y.md](docs/A11Y.md) — accessibility checklist.
- [docs/NATIVE_TESTING.md](docs/NATIVE_TESTING.md) — how testIDs map to native identifiers.
- [docs/CI.md](docs/CI.md) — CI strategy (free PR checks + opt-in cloud labs).
- [docs/tutorials/](docs/tutorials/) — framework-by-framework walkthroughs.

## Roadmap

| Phase | Scope                                                                                     | Status |
| ----- | ----------------------------------------------------------------------------------------- | ------ |
| 0     | Repo skeleton, toolchain, CI, navigation                                                  | ✓      |
| 1     | Mock API + persistence + core flows + first Maestro flows                                 | ✓      |
| 2     | QA Debug Menu + hermetic mode + deep-link-to-anywhere                                     | ✓      |
| 3     | Device capability demos (camera, mic, location, biometric, haptic, calendar, share, push) | ✓      |
| 4     | Mock IAP (success, decline, cancel, restore, refund)                                      | ✓      |
| 5     | `expo prebuild`, MMKV migration, Espresso + XCUITest scaffolding                          | ✓      |
| 6     | Appium WebdriverIO suite + Maestro Cloud CI                                               | ✓      |
| 7     | Tutorials, scenario recipes, README polish                                                | ✓      |
| 8     | Realistic product surfaces (onboarding, favorites, ticket transfer, payment methods, etc.) | ✓      |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues, scenario ideas, and tutorials are all welcome.

## License

[MIT](LICENSE).

# Competitive analysis

A side-by-side look at FrontRow against two reference sets:

1. **Real concert/event ticketing apps** — to ground the product surface
   in something a QA engineer would actually recognize as a "ticketing
   app," and to flag domain features we'd want to fake before claiming
   a realistic training corpus.
2. **Public test/demo apps on GitHub** — to compare instrumentation,
   determinism, and the testability primitives FrontRow ships against
   the apps that QA tooling vendors and OSS communities point at as
   reference targets.

The goal isn't feature parity with shipping products. FrontRow is a
training and tooling target; we want a surface broad enough that QA
engineers can practice realistic flows, deterministic enough that those
practice runs are reliable, and instrumented enough that the same flow
written against FrontRow teaches techniques that transfer to a real
codebase.

---

## Part 1 — vs real ticketing apps

Apps surveyed (functional surface only, no code/network inspection):
**DICE**, **Ticketmaster**, **AXS**, **SeatGeek**, **Bandsintown**,
**Songkick**, **Resident Advisor (RA)**, **Eventbrite**.

### What we already match

| Surface                          | FrontRow | Notes |
| -------------------------------- | -------- | ----- |
| Browse events list               | ✅        | `EventsScreen` with search + genre filters + sort |
| Event detail with hero image     | ✅        | `EventDetailScreen` |
| Buy ticket flow                  | ✅        | `BuyTicketScreen` with quantity stepper, tier picker, promo codes |
| Saved/owned tickets list         | ✅        | `MyTicketsScreen` with status filter chips |
| QR code on owned ticket          | ✅        | `TicketDetailScreen` renders QR + payload |
| Cancel ticket                    | ✅        | With confirmation dialog |
| Transfer ticket                  | ✅        | Email-based transfer with validation |
| Sign in / sign up                | ✅        | `LoginScreen` + email + password |
| Forgot password → OTP → reset    | ✅        | Full recovery chain wired to deep links |
| Profile + edit profile           | ✅        | Avatar, display name, bio with char count |
| Push inbox / notifications       | ✅        | `InboxScreen` with unread state, mark all read |
| Settings (language, appearance)  | ✅        | en/ja/de + light/dark/system |
| Payment methods CRUD             | ✅        | List + add + set default + delete |
| Reviews + ratings                | ✅        | Image attachment, character count, rating input |
| Following artists                | ✅        | `FollowingScreen` with unfollow |
| Onboarding carousel              | ✅        | Skip + paginated dots |
| Offline banner                   | ✅        | Toggleable from QA store |
| Recently viewed strip            | ✅        | Persisted via MMKV |
| Inbox badges                     | ✅        | Computed from notifications cache |

### Surfaces we deliberately don't simulate

These are common in real apps but expensive to fake convincingly,
and the value/test ratio is low. Documenting why we *don't* have them
matters as much as what we do have:

| Missing surface          | Why we skipped it |
| ------------------------ | ----------------- |
| Map/venue picker         | Real-map UI is a separate testing problem (gestures, tile loading) — out of scope until we want to teach map-specific harnesses |
| Seat selection (SVG map) | Same — venue-shape SVGs are bespoke per app; a generic version teaches nothing |
| Stripe/Apple Pay sheet   | Native payment sheets are vendor-controlled; we fake the result instead |
| Live event streaming     | Out of scope; no QA harness for video QoE in this project |
| Social feed              | Bandsintown/Songkick have feeds; we model the *interesting* social bits (follow/unfollow, reviews) without the feed itself |
| Friend graph + invites   | Doubles the data model with no new test technique |
| Calendar integration     | Native calendar permissions are an OS-level affordance, not an app one |
| Share sheet              | Same — OS sheet, not interesting from the app's testability angle |
| Wallet card add (Apple/Google) | Vendor-owned UI; faking it is uninteresting |

### Surfaces worth adding next (high QA learning value)

Ranked by what a QA engineer would learn that they couldn't learn from
the existing surface:

1. **Waitlist for sold-out events** — teaches polling, optimistic state,
   notification opt-in.
2. **Promo-code abuse path** — applying the same code twice, applying
   then removing, expiry behavior. We have promo apply/remove; we don't
   yet model "code already used" as a failure trigger.
3. **Group purchase** — multiple tickets in one transaction with
   per-attendee names. Teaches multi-row form validation and reordering.
4. **Refund flow** (vs cancel) — partial refund with a fee deduction,
   pending state, then resolved. Distinct from the cancel-and-credit we
   already model.
5. **Pull-to-refresh** on lists where the underlying clock has advanced
   (events past doors-time roll into "happening now"). We have time
   travel; we don't yet wire pull-to-refresh consistently.
6. **In-app browser for terms/privacy** — we have a webview screen
   surface but no failure trigger for "webview won't load." Useful for
   teaching webview test harnesses.
7. **Search empty state with suggested events** — currently empty state
   is plain; real apps cross-sell here.
8. **Geolocation prompt → location-aware list** — the failure trigger
   exists; we don't yet have a screen that actually requests location
   so testers can practice the deny → reprompt path.

### Domain detail polish we're missing

Small, cheap wins:

- **Ticket-tier badges with sold-out per tier** (we have show-level sold
  out only).
- **Doors vs start time** distinction in event detail copy. We track
  both fields but don't render `doorsAt` separately.
- **Currency formatting** for non-USD events. Locale switch should
  flip currency too — currently we hardcode `USD` formatting.
- **Multi-day festival** representation — event has a start date but
  no notion of multi-day. RA and Songkick handle this well.
- **Genre tag chips on event detail** — we render genre as a string,
  not a chip; chips are more interactive and a better test target.
- **"You have a ticket" badge on event detail** if the user already
  owns a ticket. Nice cross-cache test target.

---

## Part 2 — vs GitHub demo/test apps

Apps surveyed:

- **saucelabs/my-demo-app-rn** — Sauce Labs' canonical RN demo
- **saucelabs/sample-app-mobile** — older native iOS/Android demo
- **webdriverio/native-demo-app** — the Appium/WebdriverIO reference
- **appium/appium-boilerplate** — sample tests + targets
- **wix/Detox** demo apps
- **microsoft/appcenter-test-mobile-test-samples**
- **kobiton/sample-apps**
- **callstack/react-native-paper-example**
- **expo/examples**

### What FrontRow does that the others don't

These are the things I'd point a candidate at if they wanted to learn
testability patterns *beyond* the basic Sauce/WDIO demos:

1. **Centralized testID registry** (`src/testIds.ts`) — every demo app
   I looked at hard-codes `accessibilityLabel` strings inline. Ours is
   a single source of truth shared between JS, snapshot tests, Maestro
   flows, and the native showcase scaffolds. Catch-renames-at-compile
   beats catch-renames-via-flaky-test.

2. **ESLint plugin enforcing the testID contract** — `no-hardcoded-testids`,
   `require-testid-on-pressable`. None of the demo apps I surveyed enforce
   their testID convention via lint. WDIO's demo has *suggestions* in a
   README; ours has a flat-config plugin you can drop in.

3. **Failure trigger system** — 7 deterministic failure modes, each a
   one-line toggle. The Sauce demo has a buggy "Login failed" path
   triggered by a magic credential; ours composes (push + payment +
   review can all be on at once), persists, and is reachable via deep
   link, debug menu, and store API. **No public demo app I found models
   this many failure modes.**

4. **Scenario seeding** — pristine, normal, sold-out, post-event,
   refunded, fraud-flagged. The Sauce demo has *one* state. WDIO's has
   none — you log in and that's the demo. Reproducible scenarios are
   table stakes for repeatable QA training.

5. **Time travel** — `now()` is stubbed by a debug input. Lets testers
   practice "what does this list look like the day after the show?"
   without changing the device clock. Nobody else does this.

6. **Deterministic network stubs with QA-controlled latency and error
   injection** — others mock the network at the test layer (Detox,
   WDIO). We mock at the *app* layer with state knobs, so the same app
   binary supports many test profiles without rebuilds.

7. **Locale switching as a first-class debug toggle** — en/ja/de live;
   the surface re-renders without restart. Most demo apps are English
   only.

8. **Accessibility-label sweep** (`docs/A11Y.md`) — explicit
   convention + audit. WDIO's demo has accessibility but doesn't
   *teach* it.

9. **Debug menu as a test-affordance hub** — scenarios, time travel,
   trigger toggles, force-error toggle, fake push, crash button,
   replay onboarding, all in one screen. Sauce/WDIO have nothing
   equivalent; their "menu" is the OS sign-in screen.

10. **Native showcase scaffold** — a wirable Swift/Kotlin pair with
    XCUITest + Espresso targets. The Sauce *native* sample has this,
    but their RN demo doesn't bridge to it. We're the only one I've
    seen that makes the JS↔native testID handoff explicit.

11. **Maestro + Detox + Jest** in one repo with a shared testID
    contract. Most demos pick one harness. Ours treats the harness as
    a parameter and the testID as the invariant.

12. **Component snapshot tests** for visual regression scaffolding —
    `src/components/__tests__/snapshots.test.tsx`. Cheap "did the tree
    change?" gate before any pixel-diff harness gets wired.

13. **Hook unit tests** — `useUnreadNotificationCount`, hydrated
    stores, deep-link scenario hook. The other demos test only at
    UI/E2E layer; we model "unit-test this hook in isolation, then
    again at integration."

### What the others do that we should consider

1. **Dynamic device-farm config** — Sauce's demo ships with a
   `saucectl` config that runs the same suite across an iOS+Android
   matrix. We have `cloud/sauce.yaml` but our matrix is small. Worth
   expanding once we want to demo cross-platform fan-out.

2. **Biometric login** — WDIO's demo shows Face ID / Touch ID prompt
   so testers can practice OS permission auto-acceptance. We don't
   model biometrics. Could add as a failure-triggerable surface
   (`biometricUnavailable`).

3. **Network condition presets** — WDIO has "fast 3G," "slow 3G,"
   "offline" as named presets. We have a free-form ms input on the
   debug menu. Named presets are easier to teach.

4. **Drag-and-drop / swipe-to-delete** — RN Paper's example app has
   gesture-rich rows. Our myTickets list could grow swipe actions
   (cancel via swipe). Teaches gesture-aware test harnesses.

5. **Native modal vs JS modal** — the demos differentiate between
   `Modal` and OS-native sheet. We use JS modals throughout. A native
   action-sheet path would teach the difference between testing JS
   modals (RNTL handles them) and native sheets (need device-level
   matchers).

6. **Deeplink coverage matrix in CI** — the Detox demo ships a doc
   listing every link and the test that proves it. We have
   `docs/DEEPLINKS.md` but not the matrix-as-test-input tie-in.
   Cheap to add.

7. **Crash + ANR reporting integration** — Sauce's demo has a
   "crash now" button wired to Sauce's crash collector for them to
   demo aggregation. Our crash button just throws. Could wire it to
   Sentry-in-mock-mode for a richer demo.

8. **Realtime/Pusher demo** — none of the surveyed apps had a
   websocket demo. This is a gap *in the OSS demo space* — we could
   add one and stand out.

### Things we shouldn't copy

- **Login-required-to-do-anything paywalls** (Sauce's demo) make
  every flow start the same way. We deliberately allow guest browse;
  it's more realistic and the auth recovery chain is a *separate*
  flow, not a gatekeeper.
- **Hardcoded test data with no resets** (most demos). Once you
  delete a "for sale" item in their demo, it's gone for the next
  candidate. Our reset button + scenario seeding fixes this.
- **English-only labels** (most demos). Restricts who can practice.

---

## Summary

FrontRow's strength relative to public demo apps is **how much state
the app exposes for tests to drive deterministically** — failure
triggers, scenarios, time travel, network knobs, debug menu — and how
much **type-safety the testID contract has** at lint and compile time.
The surface area is comparable to a "lite" version of DICE or
Bandsintown for the flows that matter for QA training (browse → buy →
own → use → cancel/transfer; auth recovery; settings; reviews) and
deliberately skips the surfaces (maps, seat charts, payment sheets,
streaming) where realistic emulation is expensive and adds little
testing technique.

If we wanted one feature to add next, the highest-leverage option is
**named network condition presets + a biometric/permission failure
mode** (rounds out a category we already lead in) followed by
**swipe-to-delete on tickets** (introduces gesture-aware testing
patterns we don't currently teach).

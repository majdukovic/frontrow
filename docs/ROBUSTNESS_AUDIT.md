# Robustness audit — what shipped + what remains

Snapshot of the audit pass that followed the Phase 9 merge. Captures the
issues that surfaced and how they were addressed, so a future contributor
can see the reasoning rather than just the diff.

## Findings + fixes shipped

### 1. Hero card hijacked existing `events.item.<id>` testIDs

The hero card moved `items[0]` out of the FlatList and rendered it with its
own testID (`events.heroCard`). Every existing flow (`events/browse`,
`tickets/buy`, `events/favorites`, …) that taps `events.item.evt_001` would
have broken on the next run because evt_001 is the first event by date_asc
and lives in the hero now.

**Fix:** Hero card's Pressable uses `events.item.<event.id>` as its primary
testID. The wrapper `<View>` keeps `events.heroCard` for tests that
specifically want to assert the featured-card layout. Best of both worlds —
existing flows are unchanged; new flows can target the hero treatment.

### 2. mockState bled across Maestro flows

`launchApp: clearState: true` wipes MMKV but not the in-memory `mockState`.
A flow that transferred a ticket, deleted a payment method, or followed an
artist left residue for the next flow.

**Fix:** New deep link `frontrow://debug/reset` in `useDeepLinkScenario`
calls `resetMockState()` and resets the QA scenario. Flows that need a
known starting fixture can `openLink: frontrow://debug/reset` after
`launchApp`. Also fixed `resetMockState()` to deep-clone seed data — it
was shallow-copying, so `resetPassword` / `transferTicket` were mutating
the seed objects and breaking subsequent test setups.

### 3. No render-error safety net

A render error anywhere below `<NavigationContainer>` would crash the
whole tree silently in release builds.

**Fix:** New `<ErrorBoundary>` component wraps the app shell. Renders a
fallback with an icon + message + "Try again" button (testID
`app.errorBoundary` + `app.errorBoundary.reload`). Reports to the analytics
event log so tests can assert `errorBoundary.caught`.

### 4. ESLint caught testID gaps but not a11y gaps

We had `frontrow/require-testid` warning on interactive components without
testIDs. There was no equivalent rule for `accessibilityLabel`, even
though every `Pressable` should have one for screen readers and label-only
locators.

**Fix:** New `frontrow/require-a11y-label` rule in `eslint-rules/`. Same
component set as `require-testid`. Surfaced 9 gaps across BuyTicket,
EventsListScreen, FollowingScreen, InboxScreen, MyTicketsListScreen,
LoginScreen, and PaymentMethodsScreen — all fixed.

### 5. Section headings weren't marked as headers

`<Text>` with bold styling was used for section titles ("Lineup", "Refund
policy", "Recently viewed", empty-state titles). Without
`accessibilityRole="header"`, screen-reader users couldn't navigate by
heading.

**Fix:** Added `accessibilityRole="header"` to section titles in
`EmptyState`, `RecentlyViewedStrip`, `EventDetailScreen` (lineup + refund),
and `ErrorBoundary`.

### 6. No automated test of the in-process service layer

Maestro flows are slow and tied to a device. The cheapest win for catching
regressions early is unit tests against the in-process services — they
already encode invariants like Luhn validation, refund-policy enforcement,
sold-out tier handling, and email validation for transfers.

**Fix:** Jest set up via `jest-expo` preset. Suite of 76 tests under
`src/**/__tests__/**/*.test.(ts|tsx)` covering:

- Service layer: `auth`, `tickets`, `paymentMethods`, `events`, `favorites`,
  `artists`, `notifications`
- Components: `EventListItem`, `EmptyState`, `QrCode`
- Utilities: `formatPrice`

Mocked `react-native-mmkv` with an in-memory map (the real Nitro module
doesn't load in Jest). Wired into CI as a separate `unit-tests` job in
`.github/workflows/ci.yml` so PRs are gated before merge to main.

### 7. Smoke suite separate from full Maestro suite

The full Maestro run is 20+ flows now. Anything that needs to gate a
release is overkill — but the existing scripts ran everything.

**Fix:** New `scripts/smoke.sh android|ios` runs five critical flows:
launch, browse, login, buy, ticket-detail-cancel. Exposed as `npm run
smoke:android` / `smoke:ios`. Use it as the merge gate; full suite for
nightly + manual.

## Known limits, deliberately deferred

- **Dark mode** — `theme.colors.x` is consumed as a static import across
  the entire codebase. Retrofitting to a hook-based dynamic palette
  touches every screen and is a separate phase.
- **NetInfo for real offline detection** — current offline banner is
  driven by the QA force-error mode. A real implementation would add the
  `@react-native-community/netinfo` native pod. Not blocking anything
  test-wise: the visible UX surface is identical.
- **Fontfaces preload** — Ionicons trigger an act() warning during Jest
  because the icon-font setState fires inside async font loading. Cosmetic
  test noise, not a real correctness issue.

## Process gates

- Local pre-merge: `npm run typecheck && npm run lint && npm run test`
- CI: `static-checks` + `unit-tests` jobs run on every PR to main
- Smoke test (manual or on demand): `npm run smoke:android` /
  `npm run smoke:ios` — run against a built app
- Full Maestro suite: nightly + on-demand via existing
  `scripts/maestro.sh`

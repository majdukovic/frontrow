# QA Debug Menu

The Debug tab is the central control surface for hermetic testing.

## Opening the menu

- **Tab bar**: tap the **Debug** tab.
- **Deep link**: `frontrow://debug`.
- **Apply scenario via deep link**: `frontrow://debug/seed/<scenario_id>` — applied on app launch or while running.

## What's here

### Build

Read-only info: app name, version + build number, platform + OS version, Expo SDK, env (development/production). Surfaces the values you need when triaging across builds.

### Jump to screen

One-tap navigation to every top-level screen in the app. Useful when you want to verify a screen renders without driving a full flow.

### Scenarios

Tapping a scenario applies it immediately and invalidates all React Query caches so the UI re-renders against the new state. Currently shipped:

| ID                | Description                             |
| ----------------- | --------------------------------------- |
| `happy_path`      | Demo user with one upcoming ticket.     |
| `empty_state`     | No data anywhere; logged-out user.      |
| `expired_tickets` | All tickets in the past (status: used). |
| `refund_pending`  | Active ticket has a pending refund.     |
| `many_events`     | 200+ events for list-perf testing.      |
| `error_state`     | Companion to "Force error" toggle.      |
| `slow_network`    | Companion to "Delay" preset.            |
| `offline`         | Cached data only.                       |

### Time travel

Sets `useQaStore.timeOffsetMs`. Anywhere the app needs "now," it goes through `now()` from `src/state/qa.ts` so this offset takes effect. Presets cover Now, +1h, +1d, +1w, +1mo.

### Network

- **Force error** — next API call (per service function) throws `ApiClientError(400|500|408)` from `applyQaForcedError()`.
- **Delay** — every service function awaits `applyQaDelay()` for the chosen ms before resolving.

### Locale

Override the i18next/Intl locale for the session. Empty input restores device default.

### Notifications & crashes

- **Fire fake push** — Phase 2 ships an Alert simulation. Phase 3 swaps this for `expo-notifications` local push.
- **Trigger crash** — throws asynchronously to exercise crash reporters.

### Reset

Wipes all local AsyncStorage, clears the auth session, resets QA settings, and clears React Query cache.

### Analytics events

In-memory event log of `track(name, props)` calls (latest 200). Lets you write tests like _"tapping Buy fires `ticket.purchase.intent`"_.

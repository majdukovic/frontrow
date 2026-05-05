# Scenarios as test fixtures

A "scenario" in FrontRow is a named seed-data state. Use scenarios in place of brittle, multi-step setup chains: instead of _"sign in, buy a ticket, time-travel forward, refund it"_, you set the `refund_pending` scenario and start your test from that exact state.

## The scenario contract

Each scenario lives at `src/mocks/seed/scenarios/registry.ts` and exports an `apply()` function that hydrates `mockState` to a target shape. Every scenario:

1. Calls `resetMockState()` first, so it's deterministic regardless of prior state.
2. Mutates `mockState.events`, `mockState.users`, `mockState.tickets` to the target.
3. Optionally sets QA Debug fields too (e.g. `error_state` companions to the `forceError` toggle).

## Applying a scenario

Three ways to apply, depending on your test framework:

### 1. Deep link (Maestro, Appium, manual)

```yaml
# Maestro
- launchApp:
    clearState: true
- openLink: 'frontrow://debug/seed/expired_tickets'
```

```ts
// Appium
await browser.url('frontrow://debug/seed/expired_tickets');
```

```bash
# Manually from the simulator
xcrun simctl openurl booted frontrow://debug/seed/expired_tickets
adb shell am start -W -a android.intent.action.VIEW -d frontrow://debug/seed/expired_tickets
```

### 2. Tap-through the Debug Menu (Maestro)

```yaml
- tapOn: 'Debug'
- tapOn:
    id: 'debug.seedScenario.expired_tickets'
```

### 3. Programmatically inside the app (unit / integration tests)

```ts
import { scenarios } from 'src/mocks/seed/scenarios/registry';
scenarios.expired_tickets.apply();
```

## Authoring a new scenario

1. Add an entry to the `scenarios` map in `src/mocks/seed/scenarios/registry.ts`.
2. Document it in `docs/SCENARIOS.md` (one row).
3. The Debug menu and deep link routing pick it up automatically.

```ts
my_new_state: {
  id: 'my_new_state',
  label: 'My new state',
  description: 'Briefly describe what this seeds.',
  apply() {
    resetMockState();
    mockState.events = mockState.events.slice(0, 1);
    mockState.tickets = [];
  },
},
```

Test IDs follow: every new scenario id `<id>` is automatically targetable as `debug.seedScenario.<id>`.

## When _not_ to use a scenario

- For tiny one-off variations within a single test, an inline mutation is fine.
- For testing the seeding flow itself (i.e., the user signing up and bootstrapping their own data), drive that flow end-to-end without applying a scenario.

## Combining scenarios with QA controls

Scenarios + QA toggles compose. Examples:

| Goal                               | Apply this scenario | Plus this QA toggle                         |
| ---------------------------------- | ------------------- | ------------------------------------------- |
| Empty state with API errors        | `empty_state`       | Force error: `5xx`                          |
| Many events, slow network          | `many_events`       | Delay: `3000ms`                             |
| Refund-pending ticket on event day | `refund_pending`    | Time travel: `+1d`                          |
| Subscription that just expired     | `happy_path`        | Time travel: `+30d` (subscription duration) |

Combine via repeated deep links or by tapping the Debug menu after applying the scenario.

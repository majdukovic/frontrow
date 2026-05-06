# Flakiness — patterns to use, patterns to avoid

Maestro on a busy CI agent or shared simulator is a moving target. The
patterns below are the ones we have found stable enough to ship and the
ones we have learned to avoid.

## Use

### `extendedWaitUntil` over a bare `assertVisible`

Anything that depends on the next render frame — toast appearing, modal
sliding in, screen pushed onto the navigator — should use
`extendedWaitUntil` with an explicit timeout. The plain `assertVisible`
has no built-in retry and races against animations.

```yaml
- extendedWaitUntil:
    visible:
      id: 'screen.eventDetail'
    timeout: 10000
```

### Reset state at the top of each flow

`launchApp: clearState: true` only wipes MMKV. The in-memory `mockState`
that drives the API survives between flows. If a flow mutates state (a
ticket transfer leaves a ticket on the recipient, a delete removes a
seeded card, a follow adds an artist), the next flow sees that residue.

Open the reset deep link first:

```yaml
- launchApp:
    clearState: true
- openLink: 'frontrow://debug/reset'
```

### Hide the keyboard before tapping below it

Android's soft keyboard can cover the action button you want to tap.
iOS simulators do not need this — they pull from the host hardware
keyboard, which has no visual representation, so `hideKeyboard` errors
out. Wrap it:

```yaml
- inputText: '4242424242424242'
- runFlow:
    when:
      platform: Android
    commands:
      - hideKeyboard
- tapOn:
    id: 'addPaymentMethod.submitButton'
```

### Match by `id`, not by visible text

testIDs are durable — they live in `src/testIds.ts` and are the
contract between the app and every test framework (Maestro, Appium,
Espresso, XCUITest). Visible text changes when copy is iterated or a
new locale is selected. Prefer `id:` matchers; reserve text matchers
for system dialogs (`Alert.alert`, the iOS "Open in app?" prompt) where
testIDs aren't available.

### Animations off — but verify

`tests/maestro/config.yaml` sets `disableAnimations: true` for both
platforms. This kills system-level transitions but not React Native
`Animated.loop` (the events list skeleton animates on each frame
forever). If you need to assert against a moving element, don't.
Either freeze the animation or assert against the underlying state.

### Toast assertions need a 4 s buffer

The default toast `durationMs` is 3000. A flow that shows a toast and
then taps something else _and then_ asserts the toast text can race
the auto-dismiss. Either:

- Assert the toast immediately after the action that triggers it, or
- Pass an explicit longer duration when calling `showToast`.

## Avoid

### Don't `tapOn` a `Pressable` that is mid-animation

Slide-in modals (cancel-confirm, transfer, sort sheet) take ~250 ms to
finish their slide. Tapping during the slide hits a phantom region. The
`extendedWaitUntil` rule above plus `disableAnimations: true` together
cover most of this; if you still see flakes, add a small `wait` after
the action that opens the modal.

### Don't depend on a loading state that's already gone

`isLoading` flips to `false` the instant React Query has the response.
On a fast simulator the skeleton renders for one frame and disappears.
Asserting on `events.skeleton` is only safe with a deliberate
`networkDelayMs` set first (use the QA debug menu or scenario apply).

### Don't let one flow log out and the next flow assume a session

Sign-in is paid-for via `auth/login.yaml` — flows that need a user
should `runFlow: ../auth/login.yaml`, not duplicate the steps. If a
flow signs out (the only deliberate one is the logout flow itself),
add a comment so it's clear the next flow needs to sign in again.

### Don't assert "absence at index 0" on the events list

The hero card pulls `items[0]` out of the FlatList. Asserting that the
first event in `events.list` is some specific id will fail when the
hero is shown. Use `events.item.<id>` directly — it works whether the
event is rendered in the hero or in the list below.

### Don't add `pkill` to your local Maestro runs

`scripts/maestro.sh` already kills stale Maestro daemons before each
run. Doing it manually mid-run kills the agent of the test you are
about to start.

## Local pre-merge gate

```bash
npm run typecheck    # static checks
npm run lint         # frontrow/require-testid + a11y rules
npm run test         # Jest unit + integration suite
npm run smoke:android  # five critical flows on Android
# OR
npm run smoke:ios      # five critical flows on iOS
```

CI runs typecheck + lint + format-check + Jest on every PR. The smoke
suite is opt-in for now; promote a flow to it when it covers a
release-blocking path.

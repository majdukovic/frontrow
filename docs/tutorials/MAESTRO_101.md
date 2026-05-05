# Maestro 101

Maestro is a YAML-based mobile UI test runner. The whole framework is `maestro test path/to/flow.yaml`. This tutorial uses FrontRow as a target and walks through the core operations.

## Install

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
maestro --version
```

## Run the smoke flow

```bash
# Make sure FrontRow is installed and running on a simulator/emulator first.
npx expo run:ios     # one-time per device
maestro test tests/maestro/smoke/launch.yaml
```

You should see the smoke flow assert the Events screen is visible.

## Anatomy of a flow

```yaml
appId: app.frontrow.qa
---
- launchApp:
    clearState: true
- assertVisible:
    id: 'screen.events'
- tapOn:
    id: 'events.item.evt_001'
- assertVisible:
    id: 'screen.eventDetail'
```

Three pieces:

- `appId` — the bundle id (iOS) / package name (Android). FrontRow uses `app.frontrow.qa`.
- A YAML `---` separator.
- A list of commands. Each command is one of [Maestro's directives](https://maestro.mobile.dev/api-reference/commands).

## Selecting elements

Always prefer `id:` over text. FrontRow's IDs live in `src/testIds.ts`:

```yaml
- tapOn:
    id: 'eventDetail.buyButton'
```

For lists, use the parameterised IDs:

```yaml
- tapOn:
    id: 'events.item.evt_001'
```

Avoid matching by visible text unless you control the locale (and even then, Maestro's `text:` matcher fights you on case sensitivity).

## Composing flows

Use `runFlow` to reuse setup. `tests/maestro/tickets/buy.yaml` reuses `auth/login.yaml`:

```yaml
- runFlow: ../auth/login.yaml
- tapOn: 'Events'
# ...
```

This is cheaper than copy-pasting login into every flow and means a sign-in regression is caught from one place.

## Driving QA-mode state

The fastest way to get the app into a known state is the QA Debug Menu, which is fully scriptable via deep links. From any flow:

```yaml
- launchApp:
    clearState: true
    arguments:
      url: 'frontrow://debug/seed/expired_tickets'
```

Or apply at runtime:

```yaml
- openLink: 'frontrow://debug/seed/expired_tickets'
```

See `docs/SCENARIOS.md` for the catalog.

## Forcing errors and slow networks

The Debug menu lets a flow exercise unhappy paths without breaking the data layer:

```yaml
- tapOn: 'Debug'
- scrollUntilVisible:
    element:
      id: 'debug.forceError.5xx'
    direction: DOWN
- tapOn:
    id: 'debug.forceError.5xx'

- tapOn: 'Events'
- assertVisible: 'Failed to load events'
```

## Where to look next

- Maestro Studio (`maestro studio`) — visual flow builder.
- `tests/maestro/` for FrontRow's existing flows; copy one and modify to learn quickly.
- Maestro's [official docs](https://maestro.mobile.dev/) for the full directive list.

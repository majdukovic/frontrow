# Maestro Flows

End-to-end flows authored in Maestro YAML.

## Running locally

```bash
# Install Maestro: https://maestro.mobile.dev/
maestro test tests/maestro/smoke/launch.yaml      # single flow
./scripts/maestro.sh android                      # full suite (auto-retry)
./scripts/maestro.sh ios
```

## What's covered

| Folder          | Flows                                                                |
| --------------- | -------------------------------------------------------------------- |
| `smoke/`        | `launch`, `onboarding-complete`, `onboarding-skip`                   |
| `events/`       | `browse`, `pagination`, `reviews`, `favorites`, `inbox`              |
| `auth/`         | `login`, `forgotPassword`, `edit-profile`                            |
| `tickets/`      | `buy`, `detail-cancel`, `transfer`                                   |
| `billing/`      | `buy-success`, `buy-decline`, `payment-methods-crud`                 |
| `debug/`        | `scenario-deep-link`, `force-error`, `offline-banner`                |
| `capabilities/` | `haptic`                                                             |

## Convention

- One YAML file per scenario.
- Group scenarios by feature in subdirectories: `auth/`, `events/`, `tickets/`, `billing/`, `debug/`, `smoke/`, `capabilities/`.
- Use `id:` matchers against the IDs in `src/testIds.ts`. Never match by visible text alone, except for system dialogs (Alert.alert "Delete" / "Open") where the label is the only stable selector.
- Scenarios that need specific app state should `launchApp` with `clearState: true` and then either drive through the UI or open a `frontrow://debug/seed/<id>` deep link.
- Hardware keyboard quirks: iOS simulators surface a hardware keyboard so `hideKeyboard` errors. Wrap it in `runFlow.when.platform: Android` or omit it on iOS.

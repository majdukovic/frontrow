# Failure triggers — deterministic error reproducers

Real apps fail in messy, hard-to-reproduce ways: a push doesn't arrive, the
camera permission gets revoked, the payment gateway times out. FrontRow
exposes a set of QA-toggleable failure triggers so that error-handling
flows can be written and exercised exactly the same way in CI as on a
real device.

Triggers are **session-only** (not persisted) — restart clears them. They
**compose**: turning on `paymentTimeout` and `sessionExpired` together
produces both failures on the next purchase attempt.

## Triggers

| Kind             | What fails                                                                    | Where it lands                          |
| ---------------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| `push`           | Local push delivery throws on the next `fakePush` / scheduled-notification    | Notifications capability demo           |
| `geolocation`    | Permission request resolves "denied" without showing the system prompt        | Location capability demo                |
| `camera`         | Camera permission request resolves "denied"                                   | Camera capability demo                  |
| `biometric`      | Biometric probe reports unavailable; `authenticate` resolves with failure     | Biometric capability demo               |
| `imageUpload`    | `postReview` with an `imageUri` throws `ApiClientError(413, upload_failed)`   | Reviews flow                            |
| `sessionExpired` | Every API call throws `ApiClientError(401, session_expired)`                  | All authed services                     |
| `paymentTimeout` | `purchaseTicket` throws `ApiClientError(504, payment_timeout)`                | Buy flow                                |
| `reviewSubmit`   | `postReview` throws `ApiClientError(503, service_unavailable)`                | Review post                             |

## Turning them on

Three equivalent ways:

1. **From the QA Debug Menu** — Settings → Debug tab → Failure triggers
   section. Each trigger has a dedicated `Switch` with stable testID
   `debug.trigger.<kind>`. The "Clear all triggers" row resets them in one
   tap (`debug.clearTriggers`).

2. **From a Maestro flow** — open the deep link directly:
   ```yaml
   - openLink: 'frontrow://debug/trigger/paymentTimeout'
   - openLink: 'frontrow://debug/trigger/paymentTimeout/off'
   ```
   No suffix or `/on` enables; `/off` disables. The same handler also
   accepts `frontrow://debug/reset` which clears every trigger and
   resets the mock state in one call — use it at the top of a flow that
   needs a clean slate.

3. **From code** — call `useQaStore.getState().setTrigger('push', true)`.
   Useful inside Jest tests:
   ```ts
   useQaStore.getState().setTrigger('paymentTimeout', true);
   await expect(purchaseTicket(token, input)).rejects.toMatchObject({
     code: 'payment_timeout',
   });
   ```

## Adding a new trigger

1. Add the new key to the `FailureTrigger` union in
   `src/state/qa.ts` and the `EMPTY_TRIGGERS` constant.
2. Either:
   - Throw via `applyQaTriggerError(kind)` from inside the relevant
     service (preferred — uniform `ApiClientError` shape), or
   - Read `useQaStore.getState().triggers[kind]` directly in a UI handler
     for permission-style checks (geolocation, camera).
3. Add a row to the "Failure triggers" Section in `DebugScreen.tsx` —
   the testID auto-derives from the kind name.
4. Document the new trigger in this file.

The deep-link handler (`useDeepLinkScenario`) already iterates the
`TRIGGER_NAMES` array and accepts any key in it — no changes needed
there.

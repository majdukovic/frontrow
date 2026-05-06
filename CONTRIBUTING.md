# Contributing to FrontRow

Thanks for considering a contribution! FrontRow is built to be a useful training resource for the QA automation community, and contributions of all kinds are welcome.

## Ways to contribute

- **Add a test scenario** — extend a flow in `tests/maestro/` (or, later, `tests/appium/`, `tests/espresso/`, `tests/xcuitest/`).
- **Add a seed scenario** — a new entry in `src/mocks/seed/scenarios/` that lets others practice against a different app state.
- **Add a device capability demo** — propose a new screen under `src/screens/capabilities/`.
- **Improve documentation** — every doc improvement helps newcomers.
- **File a bug or request** — use the issue templates in `.github/ISSUE_TEMPLATE/`.

## Development setup

```bash
git clone <your fork>
cd frontrow
npm install
npm run ios            # or: npm run android
```

If you want to develop without a simulator, install **Expo Go** on a device and run `npm start`.

## Code style

- TypeScript strict mode is enforced.
- Run `npm run lint` and `npm run typecheck` before pushing.
- Keep test IDs in `src/testIds.ts` — never hard-code them at the call site.
- Prefer one screen per file. Co-locate styles.
- No comments unless they explain a non-obvious _why_.

## Adding a test ID

Every interactive element gets a `testID` and an `accessibilityLabel`. Add the ID to `src/testIds.ts` first, then reference it from the component:

```tsx
import { testIds } from '@/testIds';

<Button testID={testIds.eventDetail.buyButton} accessibilityLabel="Buy ticket" onPress={onBuy} />;
```

The lint rule `frontrow/require-testid` (defined in `eslint-rules/require-testid.js`) warns on `Pressable`, `Touchable*`, `Switch`, `Button`, and any custom `*Button` component with `onPress` that ships without a `testID`. Run `npm run lint` to surface gaps before they reach review.

## Adding a deep link

Public deep links are part of the test surface. Document them in `docs/DEEPLINKS.md` with example payloads.

## Pull request checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] New screens/components have stable `testID`s
- [ ] New deep links are documented in `docs/DEEPLINKS.md`
- [ ] If you added a debug-menu action, it's in `docs/DEBUG_MENU.md`
- [ ] If you changed seed data, scenarios still load

## Code of conduct

By participating, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

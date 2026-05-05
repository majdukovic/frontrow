import { browser, $ } from '@wdio/globals';

/**
 * Resolve a test ID to a platform-specific selector. testID becomes
 * accessibilityIdentifier on iOS (matched with `~`) and resource-id on
 * Android (matched with the same `~` accessibility-id strategy).
 *
 * Both platforms support the `~` selector when the React Native testID is
 * exposed via accessibilityLabel/accessibilityIdentifier — which our app
 * does for every interactive element.
 */
export function byId(id: string) {
  return $(`~${id}`);
}

export async function waitForId(id: string, timeoutMs = 10_000): Promise<void> {
  await byId(id).waitForDisplayed({ timeout: timeoutMs });
}

export async function tapId(id: string): Promise<void> {
  await waitForId(id);
  await byId(id).click();
}

export async function typeIntoId(id: string, text: string): Promise<void> {
  await waitForId(id);
  await byId(id).setValue(text);
}

export async function isAndroid(): Promise<boolean> {
  return (browser.capabilities as { platformName?: string }).platformName === 'Android';
}

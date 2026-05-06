import { createMMKV } from 'react-native-mmkv';

const mmkv = createMMKV({ id: 'frontrow.default' });

/**
 * Namespaced wrapper over MMKV. Keeps the async signature so call sites are
 * unchanged from the AsyncStorage era — MMKV is synchronous under the hood,
 * so resolves immediately. The async surface lets us swap implementations
 * later without touching any consumer.
 */
export const store = {
  async get<T>(key: string): Promise<T | null> {
    const raw = mmkv.getString(key);
    return raw == null ? null : (JSON.parse(raw) as T);
  },

  async set<T>(key: string, value: T): Promise<void> {
    mmkv.set(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    mmkv.remove(key);
  },

  async clearNamespace(prefix: string): Promise<void> {
    const keys = mmkv.getAllKeys();
    for (const k of keys) {
      if (k.startsWith(prefix)) mmkv.remove(k);
    }
  },

  async wipe(): Promise<void> {
    mmkv.clearAll();
  },
};

export const storeKeys = {
  authToken: 'frontrow.auth.token',
  authUser: 'frontrow.auth.user',
  ticketsByUser: (userId: string) => `frontrow.tickets.${userId}`,
  qaTimeOffsetMs: 'frontrow.qa.timeOffsetMs',
  qaScenario: 'frontrow.qa.scenario',
  qaForceError: 'frontrow.qa.forceError',
  qaNetworkDelayMs: 'frontrow.qa.networkDelayMs',
  qaNetworkProfile: 'frontrow.qa.networkProfile',
  qaLocale: 'frontrow.qa.locale',
} as const;

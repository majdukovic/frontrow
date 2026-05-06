// In-memory stand-in for react-native-mmkv. The real module is a Nitro
// turbomodule and won't load in Jest. Tests that exercise the storage
// layer get an isolated in-memory map per `id`.
type Store = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
};

const stores = new Map<string, Map<string, string>>();

function bucket(id: string): Map<string, string> {
  let s = stores.get(id);
  if (!s) {
    s = new Map();
    stores.set(id, s);
  }
  return s;
}

export function createMMKV(opts: { id: string }): Store {
  const data = bucket(opts.id);
  return {
    getString: (key) => data.get(key),
    set: (key, value) => {
      data.set(key, value);
    },
    remove: (key) => {
      data.delete(key);
    },
    getAllKeys: () => [...data.keys()],
    clearAll: () => {
      data.clear();
    },
  };
}

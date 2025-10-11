declare global {
  interface WindowEventMap {
    "monoidentity-storage": CustomEvent<{ key: string; value: string | undefined }>;
  }
}
export const STORAGE_EVENT = "monoidentity-storage";
const announce = (key: string, value?: string) => {
  // Announce to all, even third parties
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key, value } }));
};

const storageCounters: Record<string, number> = $state({});
let allCounter = $state(0);
const increment = (key: string) => {
  storageCounters[key] = (storageCounters[key] || 0) + 1;
  allCounter++;
};
addEventListener(STORAGE_EVENT, (event: CustomEvent) => increment(event.detail.key));
addEventListener("storage", (event) => {
  if (event.storageArea != localStorage) return;
  if (!event.key) return;
  increment(event.key);
});

export const storageClient = (
  prefix?: (key: string) => string,
  unprefix?: (key: string) => string | undefined,
  serialize?: (data: any) => string,
  deserialize?: (data: string) => any,
) => {
  if (prefix) {
    const oldPrefix = prefix;
    prefix = (key) => `monoidentity/${oldPrefix(key)}`;
  } else {
    prefix = (key) => `monoidentity/${key}`;
  }
  return new Proxy({} as Record<string, any>, {
    get(_, key: string) {
      key = prefix(key);

      storageCounters[key];
      const raw = localStorage[key];
      return raw && deserialize ? deserialize(raw) : raw;
    },
    set(_, key: string, value) {
      key = prefix(key);

      localStorage[key] = serialize ? serialize(value) : value;
      announce(key, value);
      return true;
    },
    deleteProperty(_, key: string) {
      key = prefix(key);

      delete localStorage[key];
      announce(key);
      return true;
    },
    ownKeys() {
      allCounter;

      const keys: string[] = [];
      for (let key in localStorage) {
        if (!key.startsWith("monoidentity/")) continue;
        key = key.slice("monoidentity/".length);

        if (unprefix) {
          const unprefixed = unprefix(key);
          if (!unprefixed) continue;
          key = unprefixed;
        }

        keys.push(key);
      }
      return keys;
    },
    getOwnPropertyDescriptor(_, key: string) {
      key = prefix(key);

      return Reflect.getOwnPropertyDescriptor(localStorage, key);
    },
  });
};

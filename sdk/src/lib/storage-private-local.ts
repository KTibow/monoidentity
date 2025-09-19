const prefix = "monoidentity/";
const prefixed = (key: string) => `${prefix}${key}`;
const unprefixed = (key: string) => {
  if (!key.startsWith(prefix)) throw new Error("Key is not prefixed");
  return key.slice(prefix.length);
};

const target = {};

const get = (_: unknown, key: string) => {
  if (typeof key != "string") return undefined;
  const value = localStorage.getItem(prefixed(key));
  if (value == null) return undefined;
  return value;
};

export const init = () =>
  new Proxy<Record<string, string>>(target, {
    get,

    set(_, key: string, value: any) {
      if (typeof key == "string") {
        localStorage.setItem(prefixed(key), value);
        return true;
      }
      return false;
    },

    deleteProperty(_, key: string) {
      if (typeof key == "string") {
        localStorage.removeItem(prefixed(key));
        return true;
      }
      return false;
    },

    has(_, key: string) {
      return typeof key == "string" && localStorage.getItem(prefixed(key)) !== null;
    },

    ownKeys(_) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(unprefixed(key));
        }
      }
      return keys;
    },

    getOwnPropertyDescriptor(_, key: string) {
      if (typeof key == "string" && localStorage.getItem(prefixed(key)) !== null) {
        return {
          enumerable: true,
          configurable: true,
          value: get(target, key),
        };
      }
      return undefined;
    },
  });

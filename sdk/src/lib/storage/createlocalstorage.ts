import { createStore } from "./createstore.js";

const prefix = "monoidentity/";
const prefixed = (key: string) => `${prefix}${key}`;
const unprefixed = (key: string) => {
  if (!key.startsWith(prefix)) throw new Error("Key is not prefixed");
  return key.slice(prefix.length);
};
export const createLocalStorage = () =>
  createStore<string>({
    has(key: string) {
      return typeof key == "string" && localStorage[prefixed(key)] !== undefined;
    },

    get(key: string) {
      if (typeof key != "string") return undefined;
      const value = localStorage[prefixed(key)];
      if (value == null) return undefined;
      return value;
    },

    set(key: string, value: any) {
      if (typeof key == "string") {
        localStorage[prefixed(key)] = value;
        return true;
      }
      return false;
    },

    deleteProperty(key: string) {
      if (typeof key == "string") {
        delete localStorage[prefixed(key)];
        return true;
      }
      return false;
    },

    ownKeys() {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(unprefixed(key));
        }
      }
      return keys;
    },
  });

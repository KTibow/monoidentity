import { stringify, parse } from "devalue";
import { decode } from "./utils-base36.js";
import { createStore } from "./_createstore.js";
import type { Login } from "./utils-callback.js";

let implementation: Record<string, string> | undefined;
let app = "";
export const setup = (i: Record<string, string>, a: string) => {
  implementation = i;
  app = a;
};

export const LOGIN_RECOGNIZED_PATH = ".core/login.encjson";
export const getLoginRecognized = () => {
  if (!implementation) throw new Error("No implementation set");
  const login = implementation[LOGIN_RECOGNIZED_PATH];
  if (!login) throw new Error("No login found");
  return JSON.parse(decode(login)) as Login;
};
export const getStorage = (realm: "config" | "cache") => {
  const prefix = (text: string) => `.${realm}/${app}/${text}.devalue`;
  if (!app) throw new Error("No app set");

  return createStore<any>({
    get(key: string) {
      if (!implementation) throw new Error("No implementation set");
      const item = implementation[prefix(key)];
      if (!item) return undefined;
      return parse(item);
    },

    set(key: string, value) {
      if (!implementation) throw new Error("No implementation set");
      implementation[prefix(key)] = stringify(value);
      return true;
    },

    has(key: string) {
      if (!implementation) throw new Error("No implementation set");
      return prefix(key) in implementation;
    },

    deleteProperty(key: string) {
      if (!implementation) throw new Error("No implementation set");
      const k = prefix(key);
      return delete implementation[k];
    },
  });
};

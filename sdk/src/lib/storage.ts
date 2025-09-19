import { stringify, parse } from "devalue";
import { decode, type Login } from "./utils-login.js";

let implementation: Record<string, string> | undefined;
let app = "";
export const setup = (i: Record<string, string>, a: string) => {
  implementation = i;
  app = a;
};

export const getLogin = (): Login => {
  const storage = implementation;
  if (!storage) throw new Error("No implementation set");

  const login = storage[".core/login.encjson"];
  if (!login) throw new Error("No login found");

  return JSON.parse(decode(login));
};
export const getStorage = (realm: "cache") => {
  const prefix = (text: string) => `.${realm}/${app}/${text}`;
  const storage = implementation;
  if (!app) throw new Error("No app set");
  if (!storage) throw new Error("No implementation set");

  return new Proxy({} as Record<string, any>, {
    get(_, key: string) {
      const item = storage[prefix(key)];
      if (!item) return undefined;
      return parse(item);
    },
    set(_, key: string, value: unknown) {
      storage[prefix(key)] = stringify(value);
      return true;
    },
  });
};

import { stringify, parse } from "devalue";
import { parse as useSchema } from "valibot";
import { decode } from "./utils-base36.js";
import { createStore } from "./storage/createstore.js";
import { login as loginSchema } from "./utils-transport.js";
import { verify } from "@tsndr/cloudflare-worker-jwt";
import publicKey from "./verification/public-key.js";

let implementation: Record<string, string> | undefined;
let app = "";
export const conf = (i: Record<string, string>, a: string) => {
  implementation = i;
  app = a;
};

export const LOGIN_RECOGNIZED_PATH = ".core/login.encjson";
export const getLoginRecognized = () => {
  if (!implementation) throw new Error("No implementation set");
  const login = implementation[LOGIN_RECOGNIZED_PATH];
  if (!login) throw new Error("No login found");
  return useSchema(loginSchema, JSON.parse(decode(login)));
};
export const VERIFICATION_PATH = ".core/verification.jwt";
export const getVerification = async () => {
  if (!implementation) throw new Error("No implementation set");

  const jwt = implementation[VERIFICATION_PATH];
  if (!jwt) throw new Error("No verification found");
  await verify(jwt, publicKey, { algorithm: "ES256", throwError: true });
  return jwt;
};
export const setVerification = (jwt: string) => {
  if (!implementation) throw new Error("No implementation set");
  implementation[VERIFICATION_PATH] = jwt;
};
export const useVerification = async (jwt: string) => {
  const result = await verify(jwt, publicKey, { algorithm: "ES256", throwError: true });
  return result!;
};

const withPrefix = <T>(
  obj: Record<string, T>,
  prefix: (text: string) => string,
  unprefix?: (text: string) => string | undefined,
) =>
  new Proxy(obj, {
    get(target, prop: string) {
      return target[prefix(prop)];
    },
    set(target, prop: string, value) {
      target[prefix(prop)] = value;
      return true;
    },
    has(target, prop: string) {
      return prefix(prop) in target;
    },
    deleteProperty(target, prop: string) {
      return delete target[prefix(prop)];
    },
    ownKeys(target) {
      if (typeof unprefix != "function") {
        throw new Error("unprefix must be a function");
      }
      return Object.keys(target)
        .map((key) => unprefix(key))
        .filter((key): key is string => typeof key == "string");
    },
    getOwnPropertyDescriptor(target, prop: string) {
      return Reflect.getOwnPropertyDescriptor(target, prefix(prop));
    },
  });
export const getStorage = (realm: "config" | "cache") =>
  withPrefix(
    createStore<any>({
      get(key: string) {
        if (!implementation) throw new Error("No implementation set");
        const item = implementation[key];
        return item ? parse(item) : undefined;
      },
      set(key: string, value) {
        if (!implementation) throw new Error("No implementation set");
        implementation[key] = stringify(value);
        return true;
      },
      has(key: string) {
        if (!implementation) throw new Error("No implementation set");
        return key in implementation;
      },
      deleteProperty(key: string) {
        if (!implementation) throw new Error("No implementation set");
        return delete implementation[key];
      },
    }),
    (text: string) => {
      if (!app) throw new Error("No app set");
      return `.${realm}/${app}/${text}.devalue`;
    },
  );
export const getScopedFS = (dir: string) =>
  withPrefix(
    createStore<string>({
      get(key: string) {
        if (!implementation) throw new Error("No implementation set");
        return implementation[key];
      },
      set(key: string, value) {
        if (!implementation) throw new Error("No implementation set");
        implementation[key] = value;
        return true;
      },
      has(key: string) {
        if (!implementation) throw new Error("No implementation set");
        return key in implementation;
      },
      deleteProperty(key: string) {
        if (!implementation) throw new Error("No implementation set");
        return delete implementation[key];
      },
      ownKeys() {
        if (!implementation) throw new Error("No implementation set");
        return Object.keys(implementation);
      },
      getOwnPropertyDescriptor(key: string) {
        if (!implementation) throw new Error("No implementation set");
        return Reflect.getOwnPropertyDescriptor(implementation, key);
      },
    }),
    (text: string) => `${dir}/${text}`,
    (text: string) => (text.startsWith(`${dir}/`) ? text.slice(dir.length + 1) : undefined),
  );

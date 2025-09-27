import { stringify, parse } from "devalue";
import { parse as loginSchemaParse } from "valibot";
import { decode } from "./utils-base36.js";
import { createStore } from "./storage/createstore.js";
import { login as loginSchema } from "./utils-transport.js";
import { verify } from "@tsndr/cloudflare-worker-jwt";
import publicKey from "./verification/public-key.js";
import attest from "./verification/attest.remote.js";

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
  return loginSchemaParse(loginSchema, JSON.parse(decode(login)));
};
export const VERIFICATION_PATH = ".core/verification.jwt";
export const getVerification = async () => {
  if (!implementation) throw new Error("No implementation set");

  const jwt = implementation[VERIFICATION_PATH];
  if (!jwt) throw new Error("No verification found");
  await verify(jwt, publicKey, { algorithm: "ES256", throwError: true });
  return jwt;
};
export const retrieveVerification = async () => {
  if (!implementation) throw new Error("No implementation set");
  let jwt;
  try {
    jwt = await getVerification();
  } catch {
    jwt = await attest(getLoginRecognized());
    implementation[VERIFICATION_PATH] = jwt;
  }
  return jwt;
};
export const useVerification = (jwt: string) =>
  verify(jwt, publicKey, { algorithm: "ES256", throwError: true })!;
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

import { stringify, parse } from "devalue";
import { parse as useSchema } from "valibot";
import { decode } from "./utils-base36.js";
import { login as loginSchema } from "./utils-transport.js";
import { verify } from "@tsndr/cloudflare-worker-jwt";
import publicKey from "./verification/public-key.js";
import { storageClient } from "./storage/storageclient.svelte.js";

let app = "unknown";
let syncPromise = Promise.resolve();
export const conf = (a: string) => {
  app = a;
};
export const addToSync = (p: Promise<void>) => {
  syncPromise = syncPromise.then(() => p);
};
export const completeSync = () => syncPromise;

const LOGIN_RECOGNIZED_PATH = ".core/login.encjson";
export const getLoginRecognized = () => {
  const client = storageClient();
  const login = client[LOGIN_RECOGNIZED_PATH];
  if (!login) throw new Error("No login found");
  return useSchema(loginSchema, JSON.parse(decode(login)));
};
export const setLoginRecognized = (login: string) => {
  const client = storageClient();
  client[LOGIN_RECOGNIZED_PATH] = login;
};

const VERIFICATION_PATH = ".core/verification.jwt";
export const getVerification = async () => {
  const client = storageClient();
  const jwt = client[VERIFICATION_PATH];
  if (!jwt) throw new Error("No verification found");
  await verify(jwt, publicKey, { algorithm: "ES256", throwError: true });
  return jwt;
};
export const setVerification = (jwt: string) => {
  const client = storageClient();
  client[VERIFICATION_PATH] = jwt;
};

export const getStorage = (realm: "config" | "cache") =>
  storageClient((key: string) => `.${realm}/${app}/${key}.devalue`, undefined, stringify, parse);
export const getScopedFS = (dir: string) =>
  storageClient(
    (key: string) => `${dir}/${key}`,
    (key: string) => (key.startsWith(dir + "/") ? key.slice(dir.length + 1) : undefined),
  );

import type { Bucket } from "../utils-transport.js";
import { storageClient } from "./storageclient.svelte.js";
import { addSync } from "./utils-sync.js";
import { shouldPersist, type SyncStrategy } from "./utils-storage.js";
import { get, set } from "idb-keyval";
import { store } from "./utils-idb.js";
import { decodeCloudContent } from "./_backupcloud.js";

export type AwsFetch = (url: string, options?: RequestInit) => Promise<Response>;

const CLOUD_CACHE_KEY = "cloud-cache";
type Cache = Record<string, { etag: string; content: string }>;

let cache: Cache | undefined;

const initCache = async () => {
  cache = (await get<Cache>(CLOUD_CACHE_KEY, store)) || {};
};

const getCache = () => {
  if (!cache) throw new Error("Cache not initialized");
  return cache;
};

const saveCache = async () => {
  await set(CLOUD_CACHE_KEY, getCache(), store);
};

export const setCloudCacheEntry = async (key: string, etag: string, content: string) => {
  await initCache();
  getCache()[key] = { etag, content };
  await saveCache();
};

const loadFromCloud = async (
  getSyncStrategy: (path: string) => SyncStrategy,
  base: string,
  client: AwsFetch,
) => {
  const cacheInit = initCache();

  const listResp = await client(base);
  if (!listResp.ok) throw new Error(`List bucket failed: ${listResp.status}`);
  const listXml = await listResp.text();
  const objects = [...listXml.matchAll(/<Key>(.*?)<\/Key>.*?<ETag>(.*?)<\/ETag>/gs)]
    .map((m) => m.slice(1).map((s) => s.replaceAll("&quot;", `"`).replaceAll("&apos;", `'`)))
    .map(([key, etag]) => ({ key, etag: etag.replaceAll(`"`, "") }))
    .filter(({ key }) => getSyncStrategy(key));

  await cacheInit;
  const prevCache = getCache();
  const nextCache: Cache = {};
  const model: Record<string, string> = {};

  await Promise.all(
    objects.map(async ({ key, etag }) => {
      const cached = prevCache[key];
      if (cached?.etag == etag) {
        model[key] = cached.content;
        nextCache[key] = cached;
        return;
      }

      console.debug("[monoidentity cloud] loading", key);
      const r = await client(`${base}/${key}`);
      if (!r.ok) throw new Error(`Fetch ${key} failed: ${r.status}`);

      const content = await decodeCloudContent(key, r);
      model[key] = content;
      nextCache[key] = { etag, content };
    }),
  );

  cache = nextCache;
  await saveCache();
  return model;
};

const _pullFromCloud = async (
  getSyncStrategy: (path: string) => SyncStrategy,
  bucket: Bucket,
  client: AwsFetch,
) => {
  const remote = await loadFromCloud(getSyncStrategy, bucket.base, client);

  const local = storageClient();
  for (const key of Object.keys(local)) {
    if (key in remote) continue;
    if (shouldPersist(key)) continue;
    delete local[key];
  }
  for (const [key, value] of Object.entries(remote)) {
    if (local[key] == value) continue;
    local[key] = value;
  }
};

export const pullFromCloud = async (
  getSyncStrategy: (path: string) => SyncStrategy,
  bucket: Bucket,
  client: AwsFetch,
) => {
  const promise = _pullFromCloud(getSyncStrategy, bucket, client);
  addSync("*", promise);
  await promise;
};

export const mountCloudPull = (
  getSyncStrategy: (path: string) => SyncStrategy,
  bucket: Bucket,
  client: AwsFetch,
  signal: AbortSignal,
) => {
  signal.throwIfAborted();

  const syncIntervalId = setInterval(
    () => {
      pullFromCloud(getSyncStrategy, bucket, client).catch((err) => {
        console.error("[monoidentity cloud] pull failed", err);
      });
    },
    15 * 60 * 1000,
  );

  const cleanup = () => {
    clearInterval(syncIntervalId);
    signal.removeEventListener("abort", cleanup);
  };
  signal.addEventListener("abort", cleanup, { once: true });

  return cleanup;
};

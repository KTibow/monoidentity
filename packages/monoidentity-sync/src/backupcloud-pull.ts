import { _storageClient } from 'monoidentity';
import { addSync } from './utils-sync';
import { get, set } from 'idb-keyval';
import { store } from './utils-idb';
import { decodeCloudContent } from './_backupcloud';
import type { AwsFetch } from './backupcloud-connection';
import { keyIsLocal } from './utils-key-info';

const CLOUD_CACHE_KEY = 'cloud-cache';
type Cache = Record<string, { etag: string; content: string }>;

let cache: Cache | undefined;

const initCache = async () => {
  cache = (await get<Cache>(CLOUD_CACHE_KEY, store)) || {};
};

const getCache = () => {
  if (!cache) throw new Error('Cache not initialized');
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

const listCloud = async (client: AwsFetch) => {
  const listResp = await client('');
  if (!listResp.ok) throw new Error(`List bucket failed: ${listResp.status}`);
  const listXml = await listResp.text();
  return [...listXml.matchAll(/<Key>(.*?)<\/Key>.*?<ETag>(.*?)<\/ETag>/gs)]
    .map((m) => m.slice(1).map((s) => s.replaceAll('&quot;', `"`).replaceAll('&apos;', `'`)))
    .map(([key, etag]) => ({ key, etag: etag.replaceAll(`"`, '') }))
    .filter(({ key }) => MONOIDENTITY_SYNC_FOR(key));
};
const loadFromCloud = async (objects: { key: string; etag: string }[], client: AwsFetch) => {
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

      console.debug('[monoidentity cloud] loading', key);
      const r = await client(key);
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

const _pull = async (client: AwsFetch) => {
  const cachePromise = initCache();
  const objects = await listCloud(client);
  await cachePromise;
  const remote = await loadFromCloud(objects, client);

  const local = _storageClient();
  for (const key of Object.keys(local)) {
    if (key in remote) continue;
    if (keyIsLocal(key)) continue;
    delete local[key];
  }
  for (const [key, value] of Object.entries(remote)) {
    if (local[key] == value) continue;
    local[key] = value;
  }
};

export const cloudStartPull = (client: AwsFetch) => {
  const promise = _pull(client);
  addSync('*', promise);
};

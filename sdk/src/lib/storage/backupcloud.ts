import type { Bucket } from "../utils-transport.js";
import { AwsClient } from "aws4fetch";
import { storageClient } from "./storageclient.svelte.js";
import { registerSyncHandler } from "./sync.js";
import { shouldPersist, type SyncStrategy } from "./utils-storage.js";
import { get, set } from "idb-keyval";
import { store } from "./utils-idb.js";

const CLOUD_CACHE_KEY = "cloud-cache";
type Cache = Record<string, { etag: string; content: string }>;

let unmount: (() => void) | undefined;
let cache: Cache | undefined;

const initCache = async () => {
  cache = (await get(CLOUD_CACHE_KEY, store)) || {};
};

const getCache = () => {
  if (!cache) throw new Error("Cache not initialized");
  return cache;
};

const saveCache = async () => {
  if (!cache) throw new Error("Cache not initialized");
  await set(CLOUD_CACHE_KEY, cache, store);
};

const loadFromCloud = async (
  getSyncStrategy: (path: string) => SyncStrategy,
  base: string,
  client: AwsClient,
) => {
  const cachePromise = initCache();

  const listResp = await client.fetch(base);
  if (!listResp.ok) throw new Error(`List bucket failed: ${listResp.status}`);
  const listXml = await listResp.text();
  const objects = [...listXml.matchAll(/<Key>(.*?)<\/Key>.*?<ETag>(.*?)<\/ETag>/gs)]
    .map((m) => m.slice(1).map((s) => s.replaceAll("&quot;", `"`).replaceAll("&apos;", `'`)))
    .map(([key, etag]) => ({ key, etag: etag.replaceAll(`"`, "") }))
    .filter(({ key }) => getSyncStrategy(key));

  await cachePromise;
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
      const r = await client.fetch(`${base}/${key}`);
      if (!r.ok) throw new Error(`Fetch ${key} failed: ${r.status}`);

      let content: string;
      if (key.endsWith(".md") || key.endsWith(".devalue")) {
        content = await r.text();
      } else {
        const buf = new Uint8Array(await r.arrayBuffer());
        content = "";
        const chunk = 8192;
        for (let i = 0; i < buf.length; i += chunk) {
          content += String.fromCharCode.apply(
            null,
            buf.subarray(i, i + chunk) as unknown as number[],
          );
        }
      }
      model[key] = content;
      nextCache[key] = { etag, content };
    }),
  );

  cache = nextCache;
  saveCache();
  return model;
};
const syncFromCloud = async (
  getSyncStrategy: (path: string) => SyncStrategy,
  bucket: Bucket,
  client: AwsClient,
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

export const backupCloud = async (
  getSyncStrategy: (path: string) => SyncStrategy,
  bucket: Bucket,
): Promise<(() => void)[]> => {
  unmount?.();

  const awsClient = new AwsClient({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
  });

  await initCache();

  const cleanupOut = registerSyncHandler("out", async (fullKey: string) => {
    if (!fullKey.startsWith("monoidentity/")) return;
    const key = fullKey.slice("monoidentity/".length);

    const strategy = getSyncStrategy(key);
    if (!strategy) return;

    console.debug("[monoidentity cloud] saving", key);

    const url = `${bucket.base}/${key}`;
    const value = localStorage[fullKey];

    if (value != undefined) {
      const r = await awsClient.fetch(url, {
        method: "PUT",
        headers: { "content-type": "application/octet-stream" },
        body: value,
      });
      if (!r.ok) throw new Error(`PUT ${key} failed: ${r.status}`);

      const etag = r.headers.get("etag")?.replaceAll('"', "");
      if (etag) {
        getCache()[key] = { etag, content: value };
        await saveCache();
      }
    } else {
      const r = await awsClient.fetch(url, { method: "DELETE" });
      if (!r.ok && r.status != 404) throw new Error(`DELETE ${key} failed: ${r.status}`);

      delete getCache()[key];
      await saveCache();
    }
  });

  const cleanupIn = registerSyncHandler("in", async (fullKey: string) => {
    if (!fullKey.startsWith("monoidentity/")) return;
    const key = fullKey.slice("monoidentity/".length);

    const strategy = getSyncStrategy(key);
    if (!strategy) return;

    const url = `${bucket.base}/${key}`;

    try {
      const r = await awsClient.fetch(url);
      if (!r.ok) {
        if (r.status === 404) {
          const local = storageClient();
          if (local[key] && !shouldPersist(key)) {
            delete local[key];
          }
        }
        return;
      }

      const etag = r.headers.get("etag")?.replaceAll('"', "") || "";
      const cached = getCache()[key];

      if (cached?.etag === etag) {
        const local = storageClient();
        if (local[key] !== cached.content) {
          local[key] = cached.content;
        }
        return;
      }

      console.debug("[monoidentity cloud] loading", key);
      let content: string;
      if (key.endsWith(".md") || key.endsWith(".devalue")) {
        content = await r.text();
      } else {
        const buf = new Uint8Array(await r.arrayBuffer());
        content = "";
        const chunk = 8192;
        for (let i = 0; i < buf.length; i += chunk) {
          content += String.fromCharCode.apply(
            null,
            buf.subarray(i, i + chunk) as unknown as number[],
          );
        }
      }

      const local = storageClient();
      if (local[key] !== content) {
        local[key] = content;
      }
      getCache()[key] = { etag, content };
      await saveCache();
    } catch (err) {
      console.error(`[monoidentity cloud] inbound sync failed for ${key}:`, err);
    }
  });

  await syncFromCloud(getSyncStrategy, bucket, awsClient);

  const syncIntervalId = setInterval(
    () => syncFromCloud(getSyncStrategy, bucket, awsClient),
    15 * 60 * 1000,
  );

  unmount = () => {
    clearInterval(syncIntervalId);
    cleanupOut();
    cleanupIn();
  };

  return [unmount];
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unmount?.();
  });
}

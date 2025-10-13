import type { Bucket } from "../utils-bucket.js";
import { AwsClient } from "aws4fetch";
import { storageClient, STORAGE_EVENT } from "./storageclient.svelte.js";
import { addToSync } from "../storage.js";
import { shouldPersist } from "./_should.js";

const CLOUD_CACHE_KEY = "monoidentity-x/cloud-cache";
type Cache = Record<string, { etag: string; content: string }>;

let unmount: (() => void) | undefined;

const loadFromCloud = async (
  shouldBackup: (path: string) => boolean,
  base: string,
  client: AwsClient,
) => {
  const listResp = await client.fetch(base);
  if (!listResp.ok) throw new Error(`List bucket failed: ${listResp.status}`);
  const listXml = await listResp.text();

  const objects = [...listXml.matchAll(/<Key>(.*?)<\/Key>.*?<ETag>(.*?)<\/ETag>/gs)]
    .map((m) => m.slice(1).map((s) => s.replaceAll("&quot;", `"`).replaceAll("&apos;", `'`)))
    .map(([key, etag]) => ({ key, etag: etag.replaceAll(`"`, "") }))
    .filter(({ key }) => shouldBackup(key));
  const prevCache: Cache = JSON.parse(localStorage[CLOUD_CACHE_KEY] || "{}");
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

  localStorage[CLOUD_CACHE_KEY] = JSON.stringify(nextCache);
  return model;
};
const syncFromCloud = async (
  shouldBackup: (path: string) => boolean,
  bucket: Bucket,
  client: AwsClient,
) => {
  const remote = await loadFromCloud(shouldBackup, bucket.base, client);

  const local = storageClient();
  for (const key of Object.keys(local)) {
    if (key in remote) continue;
    if (shouldPersist(key)) continue;
    delete local[key];
  }
  for (const [key, value] of Object.entries(remote)) {
    local[key] = value;
  }
};

export const backupCloud = async (shouldBackup: (path: string) => boolean, bucket: Bucket) => {
  unmount?.();

  const client = new AwsClient({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
  });

  await syncFromCloud(shouldBackup, bucket, client);

  const syncIntervalId = setInterval(
    () => syncFromCloud(shouldBackup, bucket, client),
    15 * 60 * 1000,
  );

  // Continuous sync: mirror local changes to cloud
  const write = async (key: string, value?: string) => {
    if (!shouldBackup(key)) {
      if (!shouldPersist(key))
        console.warn("[monoidentity cloud]", key, "isn't marked to be backed up or saved");
      return;
    }
    console.debug("[monoidentity cloud] saving", key);

    const url = `${bucket.base}/${key}`;

    if (value != undefined) {
      // PUT content (unconditional to start; you can add If-Match/If-None-Match for safety)
      const r = await client.fetch(url, {
        method: "PUT",
        headers: { "content-type": "application/octet-stream" },
        body: value,
      });
      if (!r.ok) throw new Error(`PUT ${key} failed: ${r.status}`);

      // Update cache
      const etag = r.headers.get("etag")?.replaceAll('"', "");
      if (etag) {
        const cache: Cache = JSON.parse(localStorage[CLOUD_CACHE_KEY] || "{}");
        cache[key] = { etag, content: value };
        localStorage[CLOUD_CACHE_KEY] = JSON.stringify(cache);
      }
    } else {
      // DELETE key
      const r = await client.fetch(url, { method: "DELETE" });
      if (!r.ok && r.status != 404) throw new Error(`DELETE ${key} failed: ${r.status}`);

      const cache: Cache = JSON.parse(localStorage[CLOUD_CACHE_KEY] || "{}");
      delete cache[key];
      localStorage[CLOUD_CACHE_KEY] = JSON.stringify(cache);
    }
  };
  const listener = (event: CustomEvent<{ key: string; value?: string }>) => {
    let key = event.detail.key;
    if (!key.startsWith("monoidentity/")) return;
    key = key.slice("monoidentity/".length);

    const promise = write(key, event.detail.value).catch((err) => {
      console.warn("[monoidentity cloud] save failed", key, err);
    });
    addToSync(promise);
  };

  addEventListener(STORAGE_EVENT, listener);

  unmount = () => {
    clearInterval(syncIntervalId);
    removeEventListener(STORAGE_EVENT, listener);
  };
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unmount?.();
  });
}

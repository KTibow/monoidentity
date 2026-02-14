import type { Bucket } from "../utils-transport.js";
import { STORAGE_EVENT } from "./storageclient.svelte.js";
import { addSync, scheduleSync } from "./utils-sync.js";
import { shouldPersist, type SyncStrategy } from "./utils-storage.js";
import { setCloudCacheEntry, type AwsFetch } from "./backupcloud-pull.js";
import { encodeCloudContent } from "./backupcloud-content.js";

const write = async (key: string, value: string | undefined, bucket: Bucket, client: AwsFetch) => {
  console.debug("[monoidentity cloud] saving", key);

  const url = `${bucket.base}/${key}`;

  if (value != undefined) {
    const r = await client(url, {
      method: "PUT",
      headers: { "content-type": "application/octet-stream" },
      body: encodeCloudContent(key, value),
    });
    if (!r.ok) throw new Error(`PUT ${key} failed: ${r.status}`);

    const etag = r.headers.get("etag")?.replaceAll('"', "");
    if (etag) {
      await setCloudCacheEntry(key, etag, value);
    }
    return;
  }

  const r = await client(url, { method: "DELETE" });
  if (!r.ok && r.status != 404) throw new Error(`DELETE ${key} failed: ${r.status}`);
};

export const mountCloudPush = (
  getSyncStrategy: (path: string) => SyncStrategy,
  bucket: Bucket,
  client: AwsFetch,
  signal: AbortSignal,
) => {
  signal.throwIfAborted();

  const writeWrapped = async (key: string, value: string | undefined) =>
    write(key, value, bucket, client).catch((err) => {
      console.error("[monoidentity cloud] save failed", key, err);
    });

  const listener = (event: CustomEvent<{ key: string; value?: string }>) => {
    const fullKey = event.detail.key;
    if (!fullKey.startsWith("monoidentity/")) return;
    const key = fullKey.slice("monoidentity/".length);

    const strategy = getSyncStrategy(key);
    if (!strategy) {
      if (!shouldPersist(key))
        console.warn("[monoidentity cloud]", key, "isn't marked to be synced");
      return;
    }

    if (strategy.mode == "immediate") {
      addSync(fullKey, writeWrapped(key, event.detail.value));
    } else if (strategy.mode == "debounced") {
      scheduleSync(fullKey, () => writeWrapped(key, localStorage[fullKey]), strategy.debounceMs);
    }
  };

  addEventListener(STORAGE_EVENT, listener);

  const cleanup = () => {
    removeEventListener(STORAGE_EVENT, listener);
    signal.removeEventListener("abort", cleanup);
  };
  signal.addEventListener("abort", cleanup, { once: true });

  return cleanup;
};

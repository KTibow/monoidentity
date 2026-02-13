import { STORAGE_EVENT } from "./storageclient.svelte.js";
import { shouldPersist, type SyncStrategy } from "./utils-storage.js";
import { addSync } from "./utils-sync.js";

const saveToDir = (
  getSyncStrategy: (path: string) => SyncStrategy,
  dir: FileSystemDirectoryHandle,
) => {
  let dirCache: Record<string, FileSystemDirectoryHandle> = {};
  const getDirCached = async (route: string[]) => {
    let key = "";
    let parent = dir;
    for (const path of route) {
      key += "/";
      key += path;
      if (!dirCache[key]) {
        dirCache[key] = await parent.getDirectoryHandle(path, { create: true });
      }
      parent = dirCache[key];
    }
    return parent;
  };

  const writeFile = async (key: string, value?: string) => {
    const pathParts = key.split("/");
    const name = pathParts.at(-1)!;

    console.debug("[monoidentity local] saving", name);
    const parent = await getDirCached(pathParts.slice(0, -1));
    if (value != undefined) {
      const file = await parent.getFileHandle(name, { create: true });
      const writable = await file.createWritable();
      await writable.write(value);
      await writable.close();
      return;
    }

    await parent.removeEntry(name);
  };

  const listener = (event: CustomEvent<{ key: string; value?: string }>) => {
    const fullKey = event.detail.key;
    if (!fullKey.startsWith("monoidentity/")) return;
    const key = fullKey.slice("monoidentity/".length);

    const strategy = getSyncStrategy(key);
    if (!strategy) {
      if (!shouldPersist(key))
        console.warn("[monoidentity local]", key, "isn't marked to be backed up or saved");
      return;
    }

    addSync(key, writeFile(key, event.detail.value));
  };

  addEventListener(STORAGE_EVENT, listener);

  return () => {
    removeEventListener(STORAGE_EVENT, listener);
  };
};

export const mountLocalBackupPush = (
  getSyncStrategy: (path: string) => SyncStrategy,
  dir: FileSystemDirectoryHandle,
  signal: AbortSignal,
) => {
  signal.throwIfAborted();
  const unmount = saveToDir(getSyncStrategy, dir);
  const cleanup = () => {
    unmount();
    signal.removeEventListener("abort", onAbort);
  };
  const onAbort = () => {
    cleanup();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  return cleanup;
};

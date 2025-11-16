import { get, set } from "idb-keyval";
import { STORAGE_EVENT, storageClient } from "./storageclient.svelte.js";
import { canBackup } from "../utils-localstorage.js";
import { shouldPersist, type SyncStrategy } from "./utils-storage.js";
import { store } from "./utils-idb.js";

const TOGGLE_KEY = "monoidentity-x/local-backup";
const HANDLE_KEY = "backup-handle";
let unmount: (() => void) | undefined;

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

    console.debug("[monoidentity backup] saving", name);
    const parent = await getDirCached(pathParts.slice(0, -1));
    if (value != undefined) {
      const file = await parent.getFileHandle(name, { create: true });
      const writable = await file.createWritable();
      await writable.write(value);
      await writable.close();
    } else {
      await parent.removeEntry(name);
    }
  };

  const listener = async (event: CustomEvent) => {
    const fullKey = event.detail.key;
    if (!fullKey.startsWith("monoidentity/")) return;
    const key = fullKey.slice("monoidentity/".length);

    const strategy = getSyncStrategy(key);
    if (strategy.mode == "none") {
      if (!shouldPersist(key))
        console.warn("[monoidentity backup]", key, "isn't marked to be backed up or saved");
      return;
    }

    // Directly write
    await writeFile(key, event.detail.value);
  };

  addEventListener(STORAGE_EVENT, listener);

  return () => {
    removeEventListener(STORAGE_EVENT, listener);
  };
};
export const backupLocally = async (
  getSyncStrategy: (path: string) => SyncStrategy,
  requestBackup: (startBackup: () => void) => void,
) => {
  if (!canBackup) return;
  if (localStorage[TOGGLE_KEY] == "off") return;

  unmount?.();

  if (localStorage[TOGGLE_KEY] == "on") {
    const dir = await get<FileSystemDirectoryHandle>(HANDLE_KEY, store);
    if (!dir) throw new Error("No backup handle found");

    unmount = saveToDir(getSyncStrategy, dir);
  } else {
    localStorage[TOGGLE_KEY] = "off";
    requestBackup(async () => {
      const dir = await showDirectoryPicker({ mode: "readwrite" });
      await set(HANDLE_KEY, dir, store);
      localStorage[TOGGLE_KEY] = "on";

      // Restore from backup
      const backup: Record<string, string> = {};
      const traverse = async (d: FileSystemDirectoryHandle, path: string) => {
        for await (const entry of d.values()) {
          if (entry.kind == "file") {
            const file = await entry.getFile();
            const text = await file.text();
            backup[`${path}${entry.name}`] = text;
          } else if (entry.kind == "directory") {
            await traverse(entry, `${path}${entry.name}/`);
          }
        }
      };
      await traverse(dir, "");
      if (Object.keys(backup).length) {
        const client = storageClient();
        for (const key in backup) {
          console.debug("[monoidentity backup] loading", key);
          client[key] = backup[key];
        }
        location.reload();
        return;
      }

      unmount = saveToDir(getSyncStrategy, dir);
    });
  }
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unmount?.();
  });
}

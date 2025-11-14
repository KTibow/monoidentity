import { createStore, get, set } from "idb-keyval";
import { STORAGE_EVENT, storageClient } from "./storageclient.svelte.js";
import { canBackup } from "../utils-localstorage.js";
import { shouldPersist } from "./_should.js";

let unmount: (() => void) | undefined;

const saveToDir = (shouldBackup: (path: string) => boolean, dir: FileSystemDirectoryHandle) => {
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
  const listener = async (event: CustomEvent) => {
    let key = event.detail.key;
    if (!key.startsWith("monoidentity/")) return;
    key = key.slice("monoidentity/".length);

    const pathParts = key.split("/");
    const name = pathParts.at(-1)!;
    const value = event.detail.value;

    if (!shouldBackup(key)) {
      if (!shouldPersist(key))
        console.warn("[monoidentity backup]", key, "isn't marked to be backed up or saved");
      return;
    }
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

  addEventListener(STORAGE_EVENT, listener);

  return () => {
    removeEventListener(STORAGE_EVENT, listener);
  };
};
export const backupLocally = async (
  shouldBackup: (path: string) => boolean,
  requestBackup: (startBackup: () => void) => void,
) => {
  if (!canBackup) return;
  if (localStorage["monoidentity-x/backup"] == "off") return;

  unmount?.();

  const handles = createStore("monoidentity-x", "handles");
  if (localStorage["monoidentity-x/backup"] == "on") {
    const dir = await get<FileSystemDirectoryHandle>("backup", handles);
    if (!dir) throw new Error("No backup handle found");

    unmount = saveToDir(shouldBackup, dir);
  } else {
    localStorage["monoidentity-x/backup"] = "off";
    requestBackup(async () => {
      const dir = await showDirectoryPicker({ mode: "readwrite" });
      await set("backup", dir, handles);
      localStorage["monoidentity-x/backup"] = "on";

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

      unmount = saveToDir(shouldBackup, dir);
    });
  }
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unmount?.();
  });
}

import { get, set } from "idb-keyval";
import { canBackup } from "../utils-localstorage.js";
import { storageClient } from "./storageclient.svelte.js";
import { store } from "./utils-idb.js";
import { addSync } from "./utils-sync.js";

const HANDLE_KEY = "backup-handle";
const HANDLE_DISABLED_KEY = "backup-handle-disabled";

const restoreFromDir = async (dir: FileSystemDirectoryHandle) => {
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
  if (!Object.keys(backup).length) return;

  const client = storageClient();
  for (const key in backup) {
    console.debug("[monoidentity local] loading", key);
    client[key] = backup[key];
  }
  location.reload();
};

export const pullFromLocalBackup = async (
  requestBackup: (startBackup: () => void) => void,
): Promise<FileSystemDirectoryHandle | undefined> => {
  if (!canBackup) return;
  const dir = await get<FileSystemDirectoryHandle>(HANDLE_KEY, store);
  if (dir) {
    return dir;
  }

  const disabled = await get<boolean>(HANDLE_DISABLED_KEY, store);
  if (disabled) {
    return;
  }

  await set(HANDLE_DISABLED_KEY, true);
  return new Promise<FileSystemDirectoryHandle>((resolve, reject) =>
    requestBackup(async () => {
      try {
        const dir = await showDirectoryPicker({ mode: "readwrite" });
        await set(HANDLE_KEY, dir, store);
        await set(HANDLE_DISABLED_KEY, false);

        const restorePromise = restoreFromDir(dir);
        addSync("*", restorePromise);
        await restorePromise;

        resolve(dir);
      } catch (error) {
        reject(error);
      }
    }),
  );
};

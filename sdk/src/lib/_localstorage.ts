import { createStore, type Dict } from "./_createstore.js";
import { wrapWithReplay } from "./_replay.js";
import { canBackup } from "./utils-callback.js";
import { openDB } from "idb";

const prefix = "monoidentity/";
const prefixed = (key: string) => `${prefix}${key}`;
const unprefixed = (key: string) => {
  if (!key.startsWith(prefix)) throw new Error("Key is not prefixed");
  return key.slice(prefix.length);
};

const get = (key: string) => {
  if (typeof key != "string") return undefined;
  const value = localStorage.getItem(prefixed(key));
  if (value == null) return undefined;
  return value;
};

export const init = () =>
  createStore({
    has(key: string) {
      return typeof key == "string" && localStorage.getItem(prefixed(key)) !== null;
    },

    get,

    set(key: string, value: any) {
      if (typeof key == "string") {
        localStorage.setItem(prefixed(key), value);
        return true;
      }
      return false;
    },

    deleteProperty(key: string) {
      if (typeof key == "string") {
        localStorage.removeItem(prefixed(key));
        return true;
      }
      return false;
    },

    ownKeys() {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(unprefixed(key));
        }
      }
      return keys;
    },
  });
export const wrapWithBackup = (storage: Dict, requestBackup: (callback: () => void) => void) => {
  if (!canBackup) return storage;
  if (localStorage["monoidentity-x/backup"] == "off") return storage;

  const { proxy, flush, setTransmit, load } = wrapWithReplay(storage);
  const getDir = async () => {
    const db = await openDB("monoidentity-x");
    const handle = (await db.get("handles", "backup")) as FileSystemDirectoryHandle | undefined;
    if (!handle) throw new Error("No backup handle found");
    return handle;
  };
  const setDir = async (dir: FileSystemDirectoryHandle) => {
    const db = await openDB("monoidentity-x", 1, {
      upgrade(db) {
        db.createObjectStore("handles");
      },
    });
    await db.put("handles", dir, "backup");
  };
  const init = async (dir: FileSystemDirectoryHandle) => {
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
    setTransmit(async (path, mod) => {
      const pathParts = path.split("/");
      const parent = await getDirCached(pathParts.slice(0, -1));
      if (mod.type == "set") {
        const file = await parent.getFileHandle(pathParts.at(-1)!, { create: true });
        const writable = await file.createWritable();
        await writable.write(mod.new);
        await writable.close();
      } else if (mod.type == "delete") {
        await parent.removeEntry(pathParts.at(-1)!);
      }
    });
    await flush();
  };

  if (localStorage["monoidentity-x/backup"] == "on") {
    getDir()
      .then((dir) => init(dir))
      .catch(() => {
        delete localStorage["monoidentity-x/backup"];
      });
  } else {
    localStorage["monoidentity-x/backup"] = "off";
    requestBackup(async () => {
      const dir = await showDirectoryPicker({ mode: "readwrite" });
      await setDir(dir);
      await init(dir);

      // Restore from backup
      const backup: Dict = {};
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
      await load(backup);

      localStorage["monoidentity-x/backup"] = "on";
    });
  }

  return proxy;
};

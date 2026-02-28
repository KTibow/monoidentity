import { set } from 'idb-keyval';
import { _storageClient } from 'monoidentity';
import { store } from './utils-idb';
import { addSync } from './utils-sync';
import { KEY_LOCAL_ENABLED, KEY_LOCAL_HANDLE } from './utils-config';

const restoreFromDir = async (dir: FileSystemDirectoryHandle) => {
  const backup: Record<string, string> = {};
  const traverse = async (d: FileSystemDirectoryHandle, path: string) => {
    for await (const entry of d.values()) {
      if (entry.kind == 'file') {
        const file = await entry.getFile();
        const text = await file.text();
        backup[`${path}${entry.name}`] = text;
      } else if (entry.kind == 'directory') {
        await traverse(entry, `${path}${entry.name}/`);
      }
    }
  };

  await traverse(dir, '');
  if (!Object.keys(backup).length) return;

  const client = _storageClient(undefined, undefined, undefined, undefined, true);
  for (const key in backup) {
    console.debug('[monoidentity local] loading', key);
    client[key] = backup[key];
  }
  location.reload();
};

/** one time only */
export const localPull = async () => {
  const dir = await showDirectoryPicker({ mode: 'readwrite' });
  await set(KEY_LOCAL_HANDLE, dir, store);
  localStorage[KEY_LOCAL_ENABLED] = true;

  const restorePromise = restoreFromDir(dir);
  addSync('*', restorePromise);
  await restorePromise;
};

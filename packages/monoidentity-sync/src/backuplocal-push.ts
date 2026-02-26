import { STORAGE_EVENT } from 'monoidentity';
import { addSync } from './utils-sync';
import { keyIsLocal } from './utils-key-info';

export const localPush = (dir: FileSystemDirectoryHandle, signal: AbortSignal) => {
  let dirCache: Record<string, FileSystemDirectoryHandle> = {};
  const getDirCached = async (route: string[]) => {
    let key = '';
    let parent = dir;
    for (const path of route) {
      key += '/';
      key += path;
      if (!dirCache[key]) {
        dirCache[key] = await parent.getDirectoryHandle(path, { create: true });
      }
      parent = dirCache[key];
    }
    return parent;
  };

  const writeFile = async (key: string, value?: string) => {
    const pathParts = key.split('/');
    const name = pathParts.at(-1)!;

    console.debug('[monoidentity local] saving', name);
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

  const handler = (event: CustomEvent<{ key: string; value?: string }>) => {
    const fullKey = event.detail.key;
    if (!fullKey.startsWith('monoidentity/')) return;
    const key = fullKey.slice('monoidentity/'.length);

    const strategy = MONOIDENTITY_SYNC_FOR(key);
    if (!strategy) {
      if (!keyIsLocal(key))
        console.warn('[monoidentity local]', key, "isn't marked to be backed up or saved");
      return;
    }

    addSync(key, writeFile(key, event.detail.value));
  };

  addEventListener(STORAGE_EVENT, handler, { signal });
};

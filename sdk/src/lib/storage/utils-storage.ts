export const shouldPersist = (key: string) => key.includes(".cache/");

// Sync strategy types
export type SyncStrategy =
  | { mode: "none" } // don't backup (e.g., cache)
  | { mode: "immediate" } // instant sync (e.g., config, core)
  | { mode: "debounced"; debounceMs: number }; // queued sync (e.g., notes, drawings, chats)

// Queue management
type QueueEntry = {
  timeout: ReturnType<typeof setTimeout>;
  sync: () => Promise<void>;
};

const syncQueue: Record<string, QueueEntry> = {};

export const enqueueSync = (key: string, debounceMs: number, sync: () => Promise<void>) => {
  // Cancel existing timeout if any
  if (syncQueue[key]) {
    clearTimeout(syncQueue[key].timeout);
  }

  // Set new timeout
  const timeout = setTimeout(() => {
    const entry = syncQueue[key];
    if (!entry) throw new Error("Sync entry missing");

    delete syncQueue[key];
    entry.sync();
  }, debounceMs);

  syncQueue[key] = { timeout, sync };
};

export const flush = async (keys: string[]) => {
  const entries: [string, QueueEntry][] = keys
    .map((key) => [key, syncQueue[key]])
    .filter((item): item is [string, QueueEntry] => Boolean(item[1]));

  // Clear queue first
  for (const [k, entry] of entries) {
    clearTimeout(entry.timeout);
    delete syncQueue[k];
  }

  // Then flush all
  await Promise.all(entries.map(([_, entry]) => entry.sync()));
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    for (const key in syncQueue) {
      const entry = syncQueue[key];

      delete syncQueue[key];
      clearTimeout(entry.timeout);
    }
  });
}

export const shouldPersist = (key: string) =>
  key.startsWith(".cache/") || key.startsWith(".local/");

export type SyncStrategy =
  | undefined // do not upload or download; will be deleted on next sync unless shouldPersist(key)
  | { mode: "immediate" } // instant sync (e.g., config)
  | { mode: "debounced"; debounceMs: number }; // queued sync (e.g., notes, drawings, chats)

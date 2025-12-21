export const shouldPersist = (key: string) =>
  key.startsWith(".cache/") || key.startsWith(".local/");

export type SyncStrategy =
  | undefined // do not sync
  | { mode: "immediate" } // instant sync (e.g., config)
  | { mode: "debounced"; debounceMs: number }; // queued sync (e.g., notes, drawings, chats)

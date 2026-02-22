export type SyncStrategy =
  | undefined // do not upload or download; will be deleted on next sync unless shouldPersist(key)
  | { mode: "immediate" } // instant sync (e.g., config)
  | { mode: "debounced"; debounceMs: number }; // queued sync (e.g., notes, drawings, chats)
declare global {
  declare const MONOIDENTITY_APP_ID: string;
  declare const MONOIDENTITY_SYNC_FOR: (path: string) => SyncStrategy;
}

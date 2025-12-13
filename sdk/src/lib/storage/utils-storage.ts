export const shouldPersist = (key: string) =>
  key.startsWith(".cache/") || key.startsWith(".local/");

/**
 * Sync strategy for a storage key.
 *
 * - undefined: Don't sync this key
 * - immediate: Sync immediately when changed (e.g., config, critical data)
 * - debounced: Queue sync with debounce delay (e.g., notes, drawings, chats)
 */
export type SyncStrategy =
  | undefined
  | { mode: "immediate" }
  | { mode: "debounced"; debounceMs: number };

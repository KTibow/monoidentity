export type SyncRequestDetail = {
  key: string;
  resolve?: () => void;
  reject?: (reason?: unknown) => void;
};

declare global {
  interface WindowEventMap {
    "monoidentity-sync-request": CustomEvent<SyncRequestDetail>;
  }
}

export const SYNC_REQUEST_EVENT = "monoidentity-sync-request";

const activeSyncs: Record<string, Promise<void>> = {};
const scheduledSyncs: Record<string, { fn: () => Promise<void>; executeAt: number }> = {};
export const addSync = (key: string, promise: Promise<void>) => {
  const tracked = promise.catch((e) => {
    console.error(`[monoidentity] ${key} sync failed`, e);
  });
  activeSyncs[key] = key in activeSyncs ? activeSyncs[key].then(() => tracked) : tracked;
};
const runScheduledSync = async (key: string) => {
  const scheduled = scheduledSyncs[key];
  if (!scheduled) return;

  delete scheduledSyncs[key];
  const promise = scheduled.fn();
  addSync(key, promise);
  await promise;
};
const scheduleInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, scheduled] of Object.entries(scheduledSyncs)) {
    if (scheduled.executeAt <= now) {
      runScheduledSync(key);
    }
  }
}, 100);

const waitForTrackedSync = async (key: string) => {
  if (key != "*") {
    await waitForTrackedSync("*");
  }
  if (key in activeSyncs) {
    await activeSyncs[key];
  }
  if (key != "*" && key in scheduledSyncs) {
    await runScheduledSync(key);
  }
};
export const scheduleSync = (key: string, fn: () => Promise<void>, delay = 1000) => {
  const executeAt = Date.now() + delay;
  scheduledSyncs[key] = { fn, executeAt };
};

export const waitForSync = async (key: string) => {
  await new Promise<void>((resolve, reject) =>
    window.dispatchEvent(new CustomEvent(SYNC_REQUEST_EVENT, { detail: { key, resolve, reject } })),
  );
};

const onSyncRequest = (event: CustomEvent<SyncRequestDetail>) => {
  const { key, resolve, reject } = event.detail;
  waitForTrackedSync(key)
    .then(() => {
      resolve?.();
    })
    .catch((error) => {
      reject?.(error);
    });
};
addEventListener(SYNC_REQUEST_EVENT, onSyncRequest as EventListener);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearInterval(scheduleInterval);
    removeEventListener(SYNC_REQUEST_EVENT, onSyncRequest as EventListener);
  });
}

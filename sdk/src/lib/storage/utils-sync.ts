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
  addSync(key, scheduled.fn());
};
const scheduleInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, scheduled] of Object.entries(scheduledSyncs)) {
    if (scheduled.executeAt <= now) {
      runScheduledSync(key);
    }
  }
}, 100);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearInterval(scheduleInterval);
  });
}

export const waitForSync = async (key: string) => {
  if (key != "*") {
    await waitForSync("*");
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

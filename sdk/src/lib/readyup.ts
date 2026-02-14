import { type Intent, type StorageSetup, type Provision } from "./utils-transport.js";
// import { createLocalStorage } from "./storage/createlocalstorage.js";
// import { wrapBackup } from "./storage/wrapbackup.js";
// import { wrapCloud } from "./storage/wrapcloud.js";
import { conf, setLoginRecognized } from "./storage.js";

import { pullFromLocalBackup } from "./storage/backuplocally-pull.js";
import { mountLocalBackupPush } from "./storage/backuplocally-push.js";

import { createCloudClient } from "./storage/backupcloud-connection.js";
import { mountCloudPull, pullFromCloud } from "./storage/backupcloud-pull.js";
import { mountCloudPush } from "./storage/backupcloud-push.js";

import { switchToHub } from "./utils-hub.js";
import type { SyncStrategy } from "./storage/utils-storage.js";

export const readyUp = (
  app: string,
  intents: Intent[],
  getSyncStrategy: (path: string) => SyncStrategy,
  signal: AbortSignal,
  requestBackup: (startBackup: () => void) => void,
) => {
  conf(app);

  let setup = localStorage["monoidentity-x/setup"]
    ? (JSON.parse(localStorage["monoidentity-x/setup"]) as StorageSetup)
    : undefined;

  let provisions: Provision[] = [];
  const params = new URLSearchParams(location.hash.slice(1));
  const cb = params.get("monoidentitycallback");
  if (cb) {
    history.replaceState(null, "", location.pathname);
    ({ provisions } = JSON.parse(cb));
  }
  for (const provision of provisions) {
    if ("setup" in provision) {
      setup = provision.setup;
      localStorage["monoidentity-x/setup"] = JSON.stringify(setup);
    }
  }

  if (!setup) {
    switchToHub([{ storage: true }, ...intents]);
  }

  for (const provision of provisions) {
    if ("createLoginRecognized" in provision) {
      setLoginRecognized(provision.createLoginRecognized);
    }
  }

  // fire off backup
  if (setup.method == "localStorage") {
    void pullFromLocalBackup(requestBackup)
      .then((dir) => {
        signal.throwIfAborted();
        if (!dir) return;
        mountLocalBackupPush(getSyncStrategy, dir, signal);
      })
      .catch((err) => {
        console.error("[monoidentity local] pull failed", err);
      });
  }
  if (setup.method == "cloud") {
    const client = createCloudClient(setup);
    void pullFromCloud(getSyncStrategy, client)
      .then(() => {
        signal.throwIfAborted();
        mountCloudPull(getSyncStrategy, client, signal);
        mountCloudPush(getSyncStrategy, client, signal);
      })
      .catch((err) => {
        console.error("[monoidentity cloud] pull failed", err);
      });
  }
};

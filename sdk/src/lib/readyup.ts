import { type Intent, type StorageSetup, type Provision } from "./utils-transport.js";
import { conf, setLoginRecognized } from "./storage.js";
import { backupLocally } from "./storage/backuplocally.js";
import { backupCloud } from "./storage/backupcloud.js";
import { switchToHub } from "./utils-hub.js";
import type { SyncStrategy } from "./storage/utils-storage.js";
import { initSync } from "./storage/sync.js";

export const readyUp = (
  app: string,
  intents: Intent[],
  getSyncStrategy: (path: string) => SyncStrategy,
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

  initSync(getSyncStrategy);

  if (setup.method == "localStorage") {
    backupLocally(getSyncStrategy, requestBackup);
  }
  if (setup.method == "cloud") {
    backupCloud(getSyncStrategy, setup);
  }
};

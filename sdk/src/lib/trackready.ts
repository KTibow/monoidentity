import { type Intent, type StorageSetup, type Provision } from "./utils-transport.js";
// import { createLocalStorage } from "./storage/createlocalstorage.js";
// import { wrapBackup } from "./storage/wrapbackup.js";
// import { wrapCloud } from "./storage/wrapcloud.js";
import { conf, setLoginRecognized } from "./storage.js";
import { backupLocally } from "./storage/backuplocally.js";
import { backupCloud } from "./storage/backupcloud.js";
import { switchToHub } from "./utils-hub.js";

export const trackReady = async (
  app: string,
  intents: Intent[],
  shouldBackup: (path: string) => boolean,
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

  if (setup.method == "localStorage") {
    await backupLocally(shouldBackup, requestBackup);
  }
  if (setup.method == "cloud") {
    await backupCloud(shouldBackup, setup);
  }
  for (const provision of provisions) {
    if ("createLoginRecognized" in provision) {
      setLoginRecognized(provision.createLoginRecognized);
    }
  }
};

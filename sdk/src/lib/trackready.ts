import {
  type Intent,
  type IntentEnvelope,
  type StorageSetup,
  type Provision,
} from "./utils-transport.js";
import { createLocalStorage } from "./storage/createlocalstorage.js";
import { wrapBackup } from "./storage/wrapbackup.js";
import { wrapCloud } from "./storage/wrapcloud.js";
import { LOGIN_RECOGNIZED_PATH, conf } from "./storage.js";

export const trackReady = async (
  app: string,
  intents: Intent[],
  requestBackup: (startBackup: () => void) => void,
) => {
  const params = new URLSearchParams(location.hash.slice(1));

  let setup = localStorage["monoidentity-x/setup"]
    ? (JSON.parse(localStorage["monoidentity-x/setup"]) as StorageSetup)
    : undefined;

  let provisions: Provision[] = [];
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
    const target = new URL("https://monoidentity.web.app");
    target.hash = JSON.stringify({
      intents: [{ storage: true }, ...intents],
      redirectURI: location.origin,
    } satisfies IntentEnvelope);
    location.href = target.toString();
    return;
  }

  let storage: Record<string, string>;
  if (setup.method == "cloud") {
    storage = createLocalStorage();
    storage = await wrapCloud(storage, setup);
  } else if (setup.method == "localStorage") {
    storage = createLocalStorage();
    storage = wrapBackup(storage, requestBackup);
  } else {
    throw new Error("unreachable");
  }
  conf(storage, app);
  for (const provision of provisions) {
    if ("createLoginRecognized" in provision) {
      storage[LOGIN_RECOGNIZED_PATH] = provision.createLoginRecognized;
    }
  }
};

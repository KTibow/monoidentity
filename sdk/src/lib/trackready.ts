import {
  type Intent,
  type IntentEnvelope,
  type StorageSetup,
  type Provision,
} from "./utils-transport.js";
import { init as initLocal, wrapWithBackup } from "./storage/localstorage.js";
import { LOGIN_RECOGNIZED_PATH, conf } from "./storage.js";

export const trackReady = (
  app: string,
  intents: Intent[],
  requestBackup: (startBackup: () => void) => void,
  ready: () => void,
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
    const target = new URL("https://usemonoidentity.web.app");
    target.hash = JSON.stringify({
      intents: [{ storage: true }, ...intents],
      redirectURI: location.origin,
    } satisfies IntentEnvelope);
    location.href = target.toString();
    return;
  }

  let storage: Record<string, string>;
  if (setup.method == "cloud") {
    // TODO
    throw new Error("unimplemented");
  } else if (setup.method == "localStorage") {
    storage = initLocal();
    storage = wrapWithBackup(storage, requestBackup);
  } else {
    throw new Error("unreachable");
  }
  conf(storage, app);
  for (const provision of provisions) {
    if ("createLoginRecognized" in provision) {
      storage[LOGIN_RECOGNIZED_PATH] = provision.createLoginRecognized;
    }
  }

  ready();
};

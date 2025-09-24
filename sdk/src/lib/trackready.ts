import { type Setup, type Callback } from "./utils-callback.js";
import { type Scope } from "./utils-scope.js";
import { init as initLocal, wrapWithBackup } from "./_localstorage.js";
import { LOGIN_RECOGNIZED_PATH, setup } from "./storage.js";

export const trackReady = (
  app: string,
  scopes: Scope[],
  requestBackup: (callback: () => void) => void,
  callback: () => void,
) => {
  const params = new URLSearchParams(location.hash.slice(1));

  let memory = localStorage.monoidentityMemory
    ? (JSON.parse(localStorage.monoidentityMemory) as Setup)
    : undefined;

  const paramCB = params.get("monoidentitycallback");
  let cb: Callback = [];
  if (paramCB) {
    history.replaceState(null, "", location.pathname);
    cb = JSON.parse(paramCB);
  }
  for (const task of cb) {
    if ("setup" in task) {
      memory = task.setup;
      localStorage.monoidentityMemory = JSON.stringify(memory);
    }
  }

  if (!memory) {
    const params = new URLSearchParams();
    params.set("app", app);
    params.set("scopes", scopes.join(","));
    params.set("redirectURI", location.origin);
    location.href = `https://usemonoidentity.web.app/#${params.toString()}`;
    return;
  }

  let storage: Record<string, string>;
  if (memory.method == "cloud") {
    // TODO
    throw new Error("unimplemented");
  } else if (memory.method == "localStorage") {
    storage = initLocal();
    storage = wrapWithBackup(storage, requestBackup);
  } else {
    throw new Error("unreachable");
  }
  setup(storage, app);
  for (const task of cb) {
    if ("createLoginRecognized" in task) {
      storage[LOGIN_RECOGNIZED_PATH] = task.createLoginRecognized;
    } else if ("createVerification" in task) {
      storage[".core/verification.jwt"] = task.createVerification;
    }
  }

  callback();
};

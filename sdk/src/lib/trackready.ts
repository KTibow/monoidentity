import { rememberCallback, type Callback, type Memory } from "./utils-callback.js";
import { type Scope } from "./utils-scope.js";
import { init as initLocal, wrapWithBackup } from "./_localstorage.js";
import { setup } from "./storage.js";

export const trackReady = (
  app: string,
  scopes: Scope[],
  requestBackup: (callback: () => void) => void,
  callback: () => void,
) => {
  const params = new URLSearchParams(location.hash.slice(1));

  let memory = localStorage.monoidentityMemory
    ? (JSON.parse(localStorage.monoidentityMemory) as Memory)
    : undefined;
  let fileTasks: Record<string, string> | undefined = undefined;

  const paramCB = params.get("monoidentitycallback");
  if (paramCB) {
    history.replaceState(null, "", location.pathname);

    const cb = JSON.parse(paramCB) as Callback;
    // console.debug("[monoidentity] callback", cb);

    memory = rememberCallback(cb, memory);
    localStorage.monoidentityMemory = JSON.stringify(memory);

    fileTasks = cb.fileTasks;
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
  if (fileTasks) {
    for (const file in fileTasks) {
      storage[file] = fileTasks[file];
    }
  }

  callback();
};

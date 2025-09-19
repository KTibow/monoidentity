import { rememberCallback, type Callback, type Memory } from "./utils-callback.js";
import { type Scope } from "./utils-scope.js";
import { init as initLocal } from "./storage-private-local.js";
import { setup } from "./storage.js";

export const trackReady = (app: string, scopes: Scope[], callback: () => void) => {
  const params = new URLSearchParams(location.hash.slice(1));

  let memory = localStorage.monoidentityMemory
    ? (JSON.parse(localStorage.monoidentityMemory) as Memory)
    : undefined;
  let createNew = false;
  let fileTasks: Record<string, string> | undefined = undefined;

  const paramCB = params.get("monoidentitycallback");
  if (paramCB) {
    history.replaceState(null, "", location.pathname);

    const cb = JSON.parse(paramCB) as Callback;
    console.log("got callback", cb); // todo remove

    memory = rememberCallback(cb, memory);
    localStorage.monoidentityMemory = JSON.stringify(memory);

    if (cb.connect.method == "file" && cb.connect.createNew) {
      createNew = true;
    }
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
  } else if (memory.method == "file") {
    // TODO (use createNew here)
    throw new Error("unimplemented");
  } else if (memory.method == "localStorage") {
    storage = initLocal();
  } else {
    throw new Error("unreachable");
  }
  setup(storage, app);
  for (const file in fileTasks) {
    storage[file] = fileTasks[file];
  }

  callback();
};

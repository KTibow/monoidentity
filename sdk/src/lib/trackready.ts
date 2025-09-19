import { rememberCallback, type Callback, type Memory, type Scope } from "../../../src/lib.js";
import { init as initLocal } from "./storage-private-local.js";
import { setup } from "./storage.js";

export const trackReady = (app: string, scopes: Scope[], callback: () => void) => {
  const params = new URLSearchParams(location.hash.slice(1));

  let memory = localStorage.monoidentityMemory
    ? (JSON.parse(localStorage.monoidentityMemory) as Memory)
    : undefined;
  let createNew = false;

  const paramCB = params.get("monoidentitycallback");
  if (paramCB) {
    history.replaceState(null, "", location.pathname);

    const cb = JSON.parse(paramCB) as Callback;
    console.log("got callback", cb); // todo remove
    if (cb.connect.method == "file" && cb.connect.createNew) {
      createNew = true;
    }

    memory = rememberCallback(cb, memory);
    localStorage.monoidentityMemory = JSON.stringify(memory);
  }

  if (!memory) {
    const params = new URLSearchParams();
    params.set("app", app);
    params.set("scopes", scopes.join(","));
    params.set("redirectURI", location.origin);
    location.href = `https://usemonoidentity.web.app/#${params.toString()}`;
    return;
  }

  if (memory.method == "cloud") {
    // TODO
  } else if (memory.method == "file") {
    // TODO (use createNew here)
  } else if (memory.method == "localStorage") {
    setup(initLocal(), app);
  }

  callback();
};

import type { Callback, Scope } from "../../../src/lib.js";

export const isReady = (app: string, scopes: Scope[]) => {
  const params = new URLSearchParams(location.hash.slice(1));

  const callback = params.get("monoidentitycallback");
  if (callback) {
    history.replaceState(null, "", location.pathname);

    const data = JSON.parse(callback) as Callback;
    console.log("got callback", data);
    localStorage.monoidentityStorageMethod = data.storageMethod;
    // TODO handle localCreateTask
    // and remove the console log
  }

  const storageMethod = localStorage.monoidentityStorageMethod;
  if (!storageMethod) {
    const params = new URLSearchParams();
    params.set("app", app);
    params.set("scopes", scopes.join(","));
    params.set("redirectURI", location.origin);
    location.href = `https://usemonoidentity.web.app/#${params.toString()}`;
    return false;
  }

  return true;
};

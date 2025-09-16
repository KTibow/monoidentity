import type { Callback, Scope } from "../../../src/lib.js";

export const isReady = (app: string, scopes: Scope[]) => {
  const params = new URLSearchParams(location.hash.slice(1));
  const callback = params.get("monoidentitycallback");
  if (callback) {
    const data = JSON.parse(callback) as Callback;
    console.log("TODO remove this got callback", data);
    localStorage.monoidentityStorageMethod = data.storageMethod;
    history.replaceState(null, "", location.pathname);
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

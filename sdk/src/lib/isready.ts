import { rememberCallback, type Callback, type Scope } from "../../../src/lib.js";

export const isReady = (app: string, scopes: Scope[]) => {
  const params = new URLSearchParams(location.hash.slice(1));

  const paramCB = params.get("monoidentitycallback");
  if (paramCB) {
    history.replaceState(null, "", location.pathname);

    const cb = JSON.parse(paramCB) as Callback;
    console.log("got callback", cb); // todo remove

    localStorage.monoidentityMemory = rememberCallback(
      cb,
      JSON.parse(localStorage.monoidentityMemory || "null"),
    );
  }

  if (!localStorage.monoidentityMemory) {
    const params = new URLSearchParams();
    params.set("app", app);
    params.set("scopes", scopes.join(","));
    params.set("redirectURI", location.origin);
    location.href = `https://usemonoidentity.web.app/#${params.toString()}`;
    return false;
  }

  // todo use localStorage.monoidentityMemory

  return true;
};

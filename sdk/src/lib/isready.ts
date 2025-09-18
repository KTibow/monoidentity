import type { Callback, Scope } from "../../../src/lib.js";

export const isReady = (app: string, scopes: Scope[]) => {
  const params = new URLSearchParams(location.hash.slice(1));

  const callback = params.get("monoidentitycallback");
  if (callback) {
    history.replaceState(null, "", location.pathname);

    const data = JSON.parse(callback) as Callback;
    console.log("got callback", data);

    // todo: use same memory method as the app uses
    if (data.connect.method == "cloud") {
      localStorage.monoidentityConnectMethod = JSON.stringify(data.connect);
    } else {
      localStorage.monoidentityConnectMethod = JSON.stringify({ method: "local" });
    }
    // TODO handle localCreateTask
    // and remove the console log
  }

  const connectMethod = localStorage.monoidentityConnectMethod;
  if (!connectMethod) {
    const params = new URLSearchParams();
    params.set("app", app);
    params.set("scopes", scopes.join(","));
    params.set("redirectURI", location.origin);
    location.href = `https://usemonoidentity.web.app/#${params.toString()}`;
    return false;
  }

  return true;
};

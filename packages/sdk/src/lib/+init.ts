import { setLoginRecognized } from "./storage.js";
import type { Provision } from "./utils-transport.js";

const params = new URLSearchParams(location.hash.slice(1));
const cb = params.get("monoidentitycallback");
if (cb) {
  history.replaceState(null, "", location.pathname);
  const { provisions }: { provisions: Provision[] } = JSON.parse(cb);
  for (const provision of provisions) {
    if ("createLoginRecognized" in provision) {
      setLoginRecognized(provision.createLoginRecognized);
    }
  }
}

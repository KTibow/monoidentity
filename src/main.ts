import { mount } from "svelte";
import App from "./App.svelte";
import type { Scope } from "../sdk/src/lib/utils-scope";
import { apps } from "./specific-utils";

const params = new URLSearchParams(location.hash.slice(1));
const { app, scopes, redirectURI } = Object.fromEntries(params.entries());
const appData = apps[app];
const redirectURIString = redirectURI || "";
const redirectURIVetted =
  /^http:\/\/localhost(:\d+)?$/.test(redirectURIString) ||
  (redirectURIString.startsWith("https://") && appData?.redirectURIs.includes(redirectURIString));

if (!app || !scopes || !redirectURI) {
  location.href = "https://github.com/KTibow/monoidentity";
} else if (!appData) {
  document.body.innerText = "Unknown app.";
} else if (!redirectURIVetted) {
  document.body.innerText = "Invalid redirect URI.";
} else {
  mount(App, {
    target: document.body,
    props: { appData, scopes: scopes.split(",") as Scope[], redirectURI },
  });
}

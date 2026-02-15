import { mount } from "svelte";
import App from "./App.svelte";

let intent: any;
try {
  intent = JSON.parse(decodeURIComponent(location.hash.slice(1)));
} catch {
  location.href = "https://github.com/KTibow/monoidentity";
  throw new Error("Invalid intent");
}

mount(App, {
  target: document.body,
  props: intent,
});

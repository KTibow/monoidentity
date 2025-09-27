import { mount } from "svelte";
import App from "./App.svelte";

const intentEnvelope = decodeURIComponent(location.hash.slice(1));

if (!intentEnvelope) {
  location.href = "https://github.com/KTibow/monoidentity";
} else {
  mount(App, {
    target: document.body,
    props: JSON.parse(intentEnvelope),
  });
}

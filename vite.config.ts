import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { monoserve } from "monoserve/plugin";
import { functionsMixins } from "vite-plugin-functions-mixins";
import { tokenShaker } from "vite-plugin-token-shaker";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5172,
  },
  plugins: [
    svelte(),
    monoserve({ monoserverURL: "https://benignmonoserver.fly.dev" }),
    functionsMixins({ deps: ["m3-svelte"] }),
    tokenShaker(),
  ],
});

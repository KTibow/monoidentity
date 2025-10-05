import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { monoserve } from "monoserve/plugin";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5172,
  },
  plugins: [svelte(), monoserve({ monoserverURL: "https://benignmonoserver.fly.dev" })],
});

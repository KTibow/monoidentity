import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    MONOIDENTITY_APP_ID: JSON.stringify("monoidentity-demo"),
  },
});

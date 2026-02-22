import { defineConfig } from "tsdown";
import { monoserve } from "monoserve/plugin";
import "dotenv/config";

export default defineConfig({
  plugins: [
    monoserve({
      monoserverURL: "https://monoserve-by45xe47vq-uc.a.run.app",
      env: process.env as Record<string, string>,
    }),
  ],
});

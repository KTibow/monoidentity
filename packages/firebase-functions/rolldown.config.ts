import { defineConfig } from "rolldown";
import { importGlobPlugin } from "rolldown/experimental";

export default defineConfig({
  input: "src/index.ts",
  output: {
    dir: "lib",
    format: "esm",
    sourcemap: true,
  },
  external: [
    "firebase-functions",
    "firebase-functions/v2/https",
    "firebase-admin",
    "@google-cloud/functions-framework",
  ],
  plugins: [importGlobPlugin()],
});

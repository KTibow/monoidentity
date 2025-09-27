import { defineConfig } from "rolldown";
import { globSync } from "tinyglobby";
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { monoserve } from "monoserve/plugin";

function copyRemainingAssetsPlugin({
  from,
  to,
  ignore,
}: {
  from: string;
  to: string;
  ignore: string | string[];
}): import("rolldown").Plugin {
  return {
    name: "rolldown-plugin-copy-remaining-assets",
    async writeBundle() {
      const filesToCopy = globSync(`${from}/**/*`, {
        ignore,
      });

      await Promise.all(
        filesToCopy.map(async (file) => {
          const relativePath = path.relative(from, file);
          const destPath = path.join(to, relativePath);

          // Ensure the destination directory exists before copying the file.
          await mkdir(path.dirname(destPath), { recursive: true });
          await cp(file, destPath);
        }),
      );
    },
  };
}

// --- Configuration ---
const sourceDir = "src/lib";
const outputDir = "predist";
const remoteFilesPattern = `${sourceDir}/**/*.remote.ts`;
export default defineConfig({
  input: globSync(remoteFilesPattern),

  plugins: [
    monoserve({
      monoserverURL: "https://benignmonoserver.fly.dev",
    }),
    copyRemainingAssetsPlugin({
      from: sourceDir,
      to: outputDir,
      ignore: remoteFilesPattern,
    }),
  ],

  output: {
    dir: outputDir,
    format: "esm",
  },
});

import { defineConfig } from "rolldown";
import { glob, globSync } from "tinyglobby";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
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
          const content = await readFile(file, "utf8");

          await mkdir(path.dirname(destPath), { recursive: true });
          if (content.includes(".remote.js")) {
            const modified = content.replace(/\.remote\.js\b/g, "-remote.js");
            await writeFile(destPath, modified, "utf8");
            return;
          }
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
const inputFiles = await glob(remoteFilesPattern);
const input = Object.fromEntries(
  inputFiles.map((file) => {
    const name = path.relative(sourceDir, file).replace(/\.remote\.ts$/, "-remote");
    return [name, path.resolve(file)];
  }),
);
export default defineConfig({
  input,

  plugins: [
    monoserve({
      monoserverURL: "https://benignmonoserver.fly.dev",
      env: process.env as Record<string, string>,
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

  external: ["devalue"],
});

export default {
  entry: ["src/lib/+client.ts", "src/lib/+init.ts", "rolldown.config.ts"],
  ignoreDependencies: ["@types/wicg-file-system-access"],
  tags: ["-knipexternal"],
};

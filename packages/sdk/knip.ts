export default {
  entry: ["src/lib/+client.ts", "src/lib/+server.ts", "rolldown.config.ts"],
  ignoreDependencies: ["@types/wicg-file-system-access"],
  tags: ["-knipexternal"],
};

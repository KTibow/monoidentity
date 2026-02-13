export default {
  entry: ["src/lib/+client.ts", "src/lib/+server.ts", "rolldown.config.ts"],
  ignore: ["firebase-functions/**"],
  tags: ["-knipexternal"],
};

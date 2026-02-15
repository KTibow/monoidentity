export default {
  entry: ["src/app.css"],
  project: ["src/**"],
  ignoreUnresolved: ["\\$env/static/private"],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join("\n"),
  },
};

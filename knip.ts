export default {
  entry: ["src/main.ts", "src/app.css"],
  project: ["src/**"],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join("\n"),
  },
};

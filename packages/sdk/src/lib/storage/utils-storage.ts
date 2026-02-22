export const shouldPersist = (key: string) =>
  key.startsWith(".cache/") || key.startsWith(".local/");

export const supportsFile = false; // todo revert to "showSaveFilePicker" in window;
type Setup =
  | { method: "cloud"; jwt: string }
  | { method: "file"; createNew?: never }
  | { method: "localStorage" };
export type Memory = Setup & { knownFiles: string[] };
export type Callback = {
  scopes: string[];
  connect: Setup | { method: "file"; createNew: boolean };
  fileTasks: Record<string, string> | undefined;
};
export const rememberCallback = (data: Callback, pastMemory?: Memory): Memory => {
  const { scopes, connect, fileTasks } = data;

  const setup: Setup =
    connect.method == "cloud" ? { method: "cloud", jwt: connect.jwt } : { method: connect.method };

  let knownFilesSet = new Set<string>();
  if (pastMemory) {
    for (const file of pastMemory.knownFiles) {
      knownFilesSet.add(file);
    }
  }
  if (fileTasks) {
    for (const file of Object.keys(fileTasks)) {
      knownFilesSet.add(file);
    }
  }
  if (scopes.includes("login-recognized")) {
    const path = ".core/login.encjson";

    if (connect.method == "cloud") {
      knownFilesSet.add(path);
    } else if (!knownFilesSet.has(path)) {
      console.warn("unexpected login deficit");
    }
  }
  const knownFiles = Array.from(knownFilesSet);

  return { ...setup, knownFiles };
};

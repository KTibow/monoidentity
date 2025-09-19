export const scopeDefs = {
  "login-recognized": {
    files: [".config/login.encjson"],
  },
  storage: {
    files: [],
  },
};
export type Scope = keyof typeof scopeDefs;

export const supportsFile = "showSaveFilePicker" in window;
type Setup =
  | { method: "cloud"; jwt: string }
  | { method: "file"; createNew?: never }
  | { method: "localStorage" };
export type Memory = Setup & { knownFiles: string[] };
export type Callback = {
  connect: Setup | { method: "file"; createNew: boolean };
  fileTasks: Record<string, string> | undefined;
};
export const rememberCallback = (data: Callback, pastMemory?: Memory): Memory => {
  const { connect, fileTasks } = data;

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
  const knownFiles = Array.from(knownFilesSet);

  return { ...setup, knownFiles };
};

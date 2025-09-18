export const domains: string[] = ["apps.nsd.org"];

export const scopeDefs = {
  "login-recognized": {
    files: [".config/login.encjson"],
  },
  storage: {
    files: [],
  },
};
export type Scope = keyof typeof scopeDefs;

type Setup = { method: "cloud"; jwt: string } | { method: "local"; createNew?: never };
export type Memory = Setup & { knownFiles: string[] };
export type Callback = {
  connect: Setup | { method: "local"; createNew: boolean };
  fileTasks: Record<string, string> | undefined;
};

export const rememberCallback = (data: Callback, pastMemory?: Memory): Memory => {
  const { connect, fileTasks } = data;

  const setup: Setup =
    connect.method == "cloud" ? { method: "cloud", jwt: connect.jwt } : { method: "local" };

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

// TODO: in the future allow app federation
export type AppData = { name: string; redirectURIs: string[] };
export const apps: Record<string, AppData> = {
  "monoidentity-demo": {
    name: "Monoidentity Demo",
    redirectURIs: [],
  },
  cosine: {
    name: "Cosine",
    redirectURIs: ["https://usecosine.web.app"],
  },
  secant: {
    name: "Secant",
    redirectURIs: ["https://usesecant.web.app"],
  },
};

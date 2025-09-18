export const domains: string[] = ["apps.nsd.org"];

export type Scope = "login-recognized" | "storage";
type BaseMemory = { method: "cloud"; jwt: string } | { method: "local"; createNew?: never };
export type Memory = BaseMemory & { knownFiles: string[] };
export type Callback = {
  connect: Memory | {
    method: "local";
    createNew: boolean;
  };
  fileTasks: Record<string, string> | undefined;
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

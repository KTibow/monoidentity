export const domains: string[] = ["apps.nsd.org"];
export type AppData = { name: string; redirectURIs: string[] };
export const apps: Record<string, AppData> = {
  // TODO: in the future allow app federation
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

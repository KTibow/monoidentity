export const domains: string[] = ["apps.nsd.org"];

export type Scope = "login-recognized" | "storage";
export type AppData = { name: string; redirectURIs: string[] };
// TODO: in the future allow app federation
export const apps: Record<string, AppData> = {
  cosine: {
    name: "Cosine",
    redirectURIs: ["https://usecosine.web.app"],
  },
  secant: {
    name: "Secant",
    redirectURIs: ["https://usesecant.web.app"],
  },
};

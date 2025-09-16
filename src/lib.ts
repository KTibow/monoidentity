export type Scope = "login-recognized" | "storage";
export const domains: string[] = ["apps.nsd.org"];
export const apps = {
  cosine: {
    name: "Cosine",
    redirectURIs: ["https://usecosine.web.app"],
  },
  secant: {
    name: "Secant",
    redirectURIs: ["https://usesecant.web.app"],
  },
};

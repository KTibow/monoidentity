export const scopeDefs = {
  "login-recognized": {
    files: [".core/login.encjson"],
  },
  storage: {
    files: [],
  },
};
export type Scope = keyof typeof scopeDefs;

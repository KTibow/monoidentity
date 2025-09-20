type Setup = { method: "cloud"; jwt: string } | { method: "localStorage" };
export type Memory = Setup;
export type Callback = {
  scopes: string[];
  connect: Setup | { method: "localStorage" };
  fileTasks: Record<string, string> | undefined;
};
export type Login = { email: string; password: string };
export const canBackup =
  navigator.userAgent.includes("CrOS") && Boolean(window.showDirectoryPicker);
export const rememberCallback = (data: Callback, pastMemory?: Memory): Memory => {
  const { connect } = data;

  return connect.method == "cloud"
    ? { method: "cloud", jwt: connect.jwt }
    : { method: connect.method };
};

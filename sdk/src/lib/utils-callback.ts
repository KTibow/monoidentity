type Setup = { method: "cloud"; jwt: string } | { method: "localStorage"; useBackup?: never };
export type Memory = Setup;
export type Callback = {
  scopes: string[];
  connect: Setup | { method: "localStorage"; useBackup: boolean };
  fileTasks: Record<string, string> | undefined;
};
export const supportBackups = navigator.userAgent.includes("CrOS") && window.showSaveFilePicker;
export const rememberCallback = (data: Callback, pastMemory?: Memory): Memory => {
  const { connect } = data;

  return connect.method == "cloud"
    ? { method: "cloud", jwt: connect.jwt }
    : { method: connect.method };
};

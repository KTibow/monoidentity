export type Setup = { method: "cloud"; jwt: string } | { method: "localStorage" };
type CallbackTask =
  | {
      setup: Setup;
    }
  | {
      createLoginRecognized: string;
    }
  | {
      createVerification: string;
    };
export type Callback = CallbackTask[];
export type Login = { email: string; password: string };
export const canBackup =
  navigator.userAgent.includes("CrOS") && Boolean(window.showDirectoryPicker);

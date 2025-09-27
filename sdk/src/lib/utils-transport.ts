export type Intent =
  | {
      storage: true;
    }
  | {
      loginRecognized: true;
    };
export type IntentEnvelope = { intents: Intent[]; redirectURI: string };

export type StorageSetup = { method: "cloud"; jwt: string } | { method: "localStorage" };
export type Provision =
  | {
      setup: StorageSetup;
    }
  | {
      createLoginRecognized: string;
    }
  | {
      createVerification: string;
    };
/** @knipexternal */
export type ProvisionEnvelope = { provisions: Provision[] };
export type Login = { email: string; password: string };

export const canBackup =
  navigator.userAgent.includes("CrOS") && Boolean(window.showDirectoryPicker);

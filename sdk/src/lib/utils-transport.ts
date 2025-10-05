import { object, pipe, email, string } from "valibot";
import type { Bucket } from "./utils-bucket.js";

export type Intent =
  | {
      storage: true;
    }
  | {
      loginRecognized: true;
    };
export type IntentEnvelope = { intents: Intent[]; redirectURI: string };

export type StorageSetup = ({ method: "cloud" } & Bucket) | { method: "localStorage" };
export type Provision =
  | {
      setup: StorageSetup;
    }
  | {
      createLoginRecognized: string;
    };
/** @knipexternal */
export type ProvisionEnvelope = { provisions: Provision[] };

export const login = object({ email: pipe(string(), email()), password: string() });

export const canBackup =
  navigator.userAgent.includes("CrOS") && Boolean(window.showDirectoryPicker);

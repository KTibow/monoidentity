import type { Intent, IntentEnvelope } from "./utils-transport.js";

export const switchToHub: (intents: Intent[]) => never = (intents) => {
  const target = new URL("https://monoidentity.web.app");
  target.hash = JSON.stringify({ intents, redirectURI: location.origin } satisfies IntentEnvelope);
  location.href = target.toString();
  throw new Error("halting");
};

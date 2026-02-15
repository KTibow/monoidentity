import { verify } from "@tsndr/cloudflare-worker-jwt";
import publicKey from "./verification/public-key.js";

export const useVerification = async (jwt: string) => {
  const result = await verify(jwt, publicKey, { algorithm: "ES256", throwError: true });
  return result!;
};

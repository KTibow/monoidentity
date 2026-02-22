import { sign } from "@tsndr/cloudflare-worker-jwt";
import { VERIFICATION_PRIVATE_KEY } from "$env/static/private";

export const generateVerificationJWT = async (email: string, method: string) => {
  return await sign(
    {
      sub: email,
      verification: { method },
      exp: Math.floor(Date.now() / 1000) + 24 * 3600 * 365,
    },
    VERIFICATION_PRIVATE_KEY,
    { algorithm: "ES256" },
  );
};

import { verify } from "@tsndr/cloudflare-worker-jwt";
import publicKey from "./public-key";

export const verifyJWT = async (jwt: string) => {
  const data = (await verify(jwt, publicKey, { algorithm: "ES256", throwError: true }))!;
  return data!.payload;
};

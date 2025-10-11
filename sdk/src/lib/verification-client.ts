import attest from "./verification/attest.remote.js";
import { getLoginRecognized, getVerification, setVerification } from "./storage.js";
import { encode } from "./utils-base36.js";

export const retrieveVerification = async () => {
  let jwt;
  try {
    jwt = await getVerification();
  } catch {
    jwt = await attest(encode(JSON.stringify(getLoginRecognized())));
    setVerification(jwt);
  }
  return jwt;
};

import { attest } from "./verification/attest.js";
import { getLoginRecognized, getVerification, setVerification } from "./storage.js";

export const retrieveVerification = async () => {
  let jwt;
  try {
    jwt = await getVerification();
  } catch {
    const { email, password } = getLoginRecognized();
    jwt = await attest(email, password);
    setVerification(jwt);
  }
  return jwt;
};

import { fn } from "monoserve";
import { sign } from "@tsndr/cloudflare-worker-jwt";
import districts from "school-districts";
import { login } from "../utils-transport.js";
import studentvue from "./studentvue.js";
import { VERIFICATION_PRIVATE_KEY } from "$env/static/private";
import { decodeShallow } from "$lib/utils-base36.js";

export default fn(login, async (login) => {
  const { email, password } = decodeShallow(login);

  const userID = email.split("@")[0];
  const domain = email.split("@")[1];
  const district = districts[domain];
  if (!district) {
    throw new Error("Unknown school domain");
  }

  const svApp = district.apps.find((app) => app.app == "StudentVue");
  let method: string;
  if (svApp) {
    const response = await studentvue({ base: svApp.base, userID, password }, "ChildList");
    if (!response.ChildList?.Child) {
      throw new Error("Invalid auth");
    }
    method = "studentvue";
  } else {
    throw new Error("Couldn't verify");
  }

  return await sign(
    {
      sub: email,
      verification: { method },
      exp: Math.floor(Date.now() / 1000) + 24 * 3600 * 365,
    },
    VERIFICATION_PRIVATE_KEY,
    { algorithm: "ES256" },
  );
});

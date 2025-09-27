import { sign } from "@tsndr/cloudflare-worker-jwt";
import { fn } from "monoserve";
import districts from "school-districts";
import { string, parse as useSchema } from "valibot";
import { VERIFICATION_PRIVATE_KEY } from "$env/static/private";
import { decode } from "../utils-base36.js";
import { login as loginSchema } from "../utils-transport.js";
import studentvue from "./studentvue.js";

export default fn(string(), async (login) => {
  const { email, password } = useSchema(loginSchema, JSON.parse(decode(login)));

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

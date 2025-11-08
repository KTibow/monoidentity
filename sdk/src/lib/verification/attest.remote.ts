import { sign } from "@tsndr/cloudflare-worker-jwt";
import { fn } from "monoserve";
import { string, parse as useSchema } from "valibot";
import { VERIFICATION_PRIVATE_KEY } from "$env/static/private";
import { decode } from "../utils-base36.js";
import { login as loginSchema } from "../utils-transport.js";
import fastStudentvue from "fast-studentvue";
import districts from "school-districts";

const PROXY_URL = "https://studentvuing.ktibow.workers.dev";
const studentvue = (email: string, password: string, methodName: string) =>
  fastStudentvue(
    { email, password },
    () => {
      throw new Error("Invalid auth");
    },
    methodName,
    {},
    async (url, args) => {
      let r: Response | undefined;
      for (let i = 0; i < 6; i++) {
        if (i < 3) {
          r = await fetch(url, args);
        } else {
          r = await fetch(PROXY_URL, {
            ...args,
            headers: {
              ...args.headers,
              "x-proxy-target": url,
            },
          });
        }
        if (r!.ok) break;
        console.debug(
          `Try ${i + 1} failed (${r.status} ${await r
            .clone()
            .text()
            .catch(() => "[no body]")})`,
        );
      }
      return r!;
    },
  );

export default fn(string(), async (login) => {
  const { email, password } = useSchema(loginSchema, JSON.parse(decode(login)));

  const domain = email.split("@")[1];
  const district = districts[domain];
  if (!district) {
    throw new Response("Unknown domain", { status: 400 });
  }

  const svApp = district.apps.find((app) => app.app == "StudentVue");
  let method: string;
  if (svApp) {
    let response;
    try {
      response = await studentvue(email, password, "ChildList");
    } catch (e) {
      console.error("StudentVue inaccessible", e);
      throw new Response("StudentVue is inaccessible", { status: 400 });
    }
    if (!response.ChildList?.Child) {
      throw new Response("Data absent", { status: 400 });
    }
    method = "studentvue";
  } else {
    throw new Response("Unverifiable domain", { status: 400 });
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

import { sign } from "@tsndr/cloudflare-worker-jwt";
import { fn } from "monoserve";
import { string, parse as useSchema } from "valibot";
import { VERIFICATION_PRIVATE_KEY } from "$env/static/private";
import { decode } from "../utils-base36.js";
import { login as loginSchema } from "../utils-transport.js";
import fastStudentvue from "fast-studentvue";
import districts from "school-districts";

/*
export default {
  async fetch(request) {
    const target = request.headers.get("x-proxy-target");
    if (!target) {
      return new Response("Missing x-proxy-target header", { status: 400 });
    }

    try {
      const targetUrl = new URL(target);
      if (
        targetUrl.protocol != "https:" ||
        !targetUrl.host.endsWith("-psv.edupoint.com") ||
        targetUrl.pathname != "/Service/PXPCommunication.asmx/ProcessWebServiceRequest"
      ) {
        throw new Error();
      }
    } catch {
      return new Response("Invalid target URL", { status: 400 });
    }

    const newHeaders = new Headers(request.headers);
    newHeaders.delete("x-proxy-target");
    newHeaders.delete("host");

    const newRequest = new Request(target, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    });

    return fetch(newRequest);
  },
}; */
const PROXY_URL = "https://studentvuing.ktibow.workers.dev";
const studentvue = (email: string, password: string, methodName: string) =>
  fastStudentvue(
    { email, password },
    () => {
      throw new Error("Invalid auth");
    },
    methodName,
    {},
    (url, args) =>
      fetch(PROXY_URL, {
        ...args,
        headers: {
          ...args.headers,
          "x-proxy-target": url,
        },
      }),
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

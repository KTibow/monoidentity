import { XMLParser } from "fast-xml-parser";

const build = (object: Record<string, string>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(object)) {
    params.set(key, value);
  }
  return params;
};
const parser = new XMLParser({ ignoreAttributes: false });

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

export default async (
  { base, userID, password }: { base: string; userID: string; password: string },
  name: string,
  params: Record<string, string> = {},
) => {
  const request = build({
    userID,
    password,
    skipLoginLog: "true",
    parent: "false",
    webServiceHandleName: "PXPWebServices",
    methodName: name,
    paramStr: `<Parms>${Object.keys(params)
      .map((key) => `<${key}>${params[key]}</${key}>`)
      .join("")}</Parms>`,
  });

  const response = await fetch(PROXY_URL, {
    method: "POST",
    body: request,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-proxy-target": `${base}/Service/PXPCommunication.asmx/ProcessWebServiceRequest`,
    },
  });
  const dataWrap = await response.text();
  if (!dataWrap.includes("<string")) {
    throw new Error(`StudentVue error: malformed response (status ${response.status})`, {
      cause: dataWrap,
    });
  }
  const data = dataWrap
    .split(`<string xmlns="http://edupoint.com/webservices/">`)[1]
    .split("</string>")[0]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  const xml = parser.parse(data);
  const err: string | undefined = xml.RT_ERROR?.["@_ERROR_MESSAGE"];
  if (err) {
    if (err.startsWith("Invalid user id or password")) {
      throw new Error("Invalid auth");
    }
    throw new Error("StudentVue error", { cause: err });
  }

  return xml;
};

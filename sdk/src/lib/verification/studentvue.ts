import { XMLParser } from "fast-xml-parser";

const build = (object: Record<string, string>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(object)) {
    params.set(key, value);
  }
  return params;
};
const parser = new XMLParser({ ignoreAttributes: false });

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

  const response = await fetch(`${base}/Service/PXPCommunication.asmx/ProcessWebServiceRequest`, {
    method: "POST",
    body: request,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
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

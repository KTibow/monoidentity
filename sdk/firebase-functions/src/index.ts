import { onRequest } from "firebase-functions/v2/https";

const functionModules = import.meta.glob<{ default: (req: Request) => Promise<Response> }>(
  "../../functions/*.js",
);

function createStandardRequest(req: any): Request {
  const url = `${req.protocol}://${req.get("host") || "localhost"}${req.url}`;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (typeof req.rawBody == "string") {
      body = req.rawBody;
    } else if (req.body) {
      body = typeof req.body == "string" ? req.body : JSON.stringify(req.body);
    }
  }

  return new Request(url, {
    method: req.method,
    headers: new Headers(req.headers as HeadersInit),
    body,
  });
}

export const monoserve = onRequest({ invoker: "public" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method == "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const pathParts = req.path.split("/").filter(Boolean);
  const functionName = pathParts[pathParts.length - 1];

  if (!functionName) {
    res.status(404).send("Function not found");
    return;
  }

  const modulePath = Object.keys(functionModules).find((path) =>
    path.endsWith(`/${functionName}.js`),
  );

  if (!modulePath) {
    res.status(404).send("Function not found");
    return;
  }

  try {
    const { default: handler } = await functionModules[modulePath]();
    const request = createStandardRequest(req);
    const response = await handler(request);
    const body = await response.text();

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status).send(body);
  } catch (error) {
    console.error(`Error in monoserve handler '${functionName}':`, error);
    res.status(500).send("Internal server error");
  }
});

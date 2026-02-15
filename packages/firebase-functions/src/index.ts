import { onRequest } from "firebase-functions/v2/https";

const functionModules = import.meta.glob<{ default: (req: Request) => Promise<Response> }>(
  "../../*/functions/*.js",
);

function createStandardRequest(req: any): Request {
  const url = `${req.protocol}://${req.get("host") || "localhost"}${req.url}`;

  let body: string | undefined;
  if (req.method != "GET" && req.method != "HEAD") {
    if (typeof req.body == "object" && req.body) {
      // when content-type = application/json
      body = JSON.stringify(req.body);
    } else {
      body = req.body;
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

    res.statusCode = response.status;

    for (const [key, value] of response.headers) {
      res.setHeader(key, value);
    }

    const body = response.body;
    if (!body) {
      res.end();
      return;
    }

    for await (const chunk of body) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    console.error(`Error in monoserve handler '${functionName}':`, error);
    res.status(500).send("Internal server error");
  }
});

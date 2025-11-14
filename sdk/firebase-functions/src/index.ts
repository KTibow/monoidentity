import { onRequest } from "firebase-functions/v2/https";

// Load all monoserve handlers using import.meta.glob
const modules: Record<string, { default: (req: Request) => Promise<Response> }> = import.meta.glob(
  "../../functions/*.js",
  { eager: true },
);

// Build handlers map from imported modules
const handlers = new Map<string, (request: Request) => Promise<Response>>();

for (const [path, { default: handler }] of Object.entries(modules)) {
  const name = path.split("/").pop()!.split(".")[0];

  handlers.set(name, handler);
  console.log(`Loaded monoserve handler: ${name}`);
}

/**
 * Converts Firebase Functions request to standard Request object
 */
function createStandardRequest(req: any): Request {
  const url = `${req.protocol}://${req.get("host") || "localhost"}${req.url}`;

  // Get the raw body if available, otherwise stringify
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

/**
 * Single Firebase Function that routes to all monoserve handlers
 */
export const monoserve = onRequest({ invoker: "public" }, async (req, res) => {
  // Extract function name from path
  // Supports: /functionName or /api/functionName
  const pathParts = req.path.split("/").filter(Boolean);
  const functionName = pathParts[pathParts.length - 1];

  if (!functionName) {
    res.status(404);
    return;
  }

  const handler = handlers.get(functionName);

  if (!handler) {
    res.status(404).json({
      error: `Function '${functionName}' not found`,
    });
    return;
  }

  try {
    // Convert to standard Request
    const request = createStandardRequest(req);

    // Call monoserve handler
    const response = await handler(request);

    // Convert Response back to Firebase response
    const body = await response.text();

    // Copy headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send response
    res.status(response.status).send(body);
  } catch (error) {
    console.error(`Error in monoserve handler '${functionName}':`, error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

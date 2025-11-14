import { onRequest } from "firebase-functions/v2/https";

// Load all monoserve handlers using import.meta.glob
const modules = import.meta.glob("../../functions/*.js", { eager: true });

// Build handlers map from imported modules
const handlers = new Map<string, (request: Request) => Promise<Response>>();

for (const [path, module] of Object.entries(modules)) {
  // Extract function name from path (e.g., "../../functions/attest:c5b6.js" -> "attest")
  const filename = path.split("/").pop() || "";
  const functionName = filename.split(":")[0];

  const mod = module as { default?: (request: Request) => Promise<Response> };
  if (mod.default && typeof mod.default == "function") {
    handlers.set(functionName, mod.default);
    console.log(`Loaded monoserve handler: ${functionName}`);
  }
}

console.log(`Loaded ${handlers.size} monoserve handlers`);

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
    res.status(400).json({
      error: "No function name provided",
      usage: "Call /{functionName} to invoke a monoserve handler",
      availableFunctions: Array.from(handlers.keys()),
    });
    return;
  }

  const handler = handlers.get(functionName);

  if (!handler) {
    res.status(404).json({
      error: `Function '${functionName}' not found`,
      availableFunctions: Array.from(handlers.keys()),
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

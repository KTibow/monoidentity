// @ts-nocheck

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
};

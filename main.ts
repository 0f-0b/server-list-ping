#!/usr/bin/env -S deno run --allow-net

import { serve } from "./deps/std/http/server.ts";

import { serverListPing } from "./mod.ts";

await serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/") {
    return new Response(`Usage: ${url.origin}/:serverAddress`, { status: 404 });
  }
  const parser = new URL("dummy://");
  try {
    const addr = decodeURIComponent(url.pathname.substring(1));
    if (!addr.includes("/")) {
      parser.host = addr;
    }
  } catch {
    // handled below
  }
  if (!parser.hostname) {
    return new Response("Invalid address", { status: 400 });
  }
  try {
    return Response.json(
      await serverListPing({
        hostname: parser.hostname,
        port: parser.port ? parseInt(parser.port, 10) : undefined,
        signal: AbortSignal.timeout(30000),
      }),
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      return new Response("Request timed out", { status: 504 });
    }
    return new Response(`Request failed: ${e}`, { status: 502 });
  }
});

#!/usr/bin/env -S deno run --allow-net

import { serverListPing } from "./mod.ts";

const defaultTimeout = 10000;
const maxTimeout = 120000;
const server = Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/") {
    return new Response(`Usage: ${url.origin}/:address`);
  }
  if (url.pathname === "/favicon.ico") {
    return new Response(null, { status: 404 });
  }
  let timeout = defaultTimeout;
  {
    const timeoutParam = url.searchParams.get("timeout");
    if (timeoutParam !== null) {
      if (!/^\d+$/.test(timeoutParam)) {
        return new Response("Timeout must be a non-negative integer", {
          status: 400,
        });
      }
      timeout = Number(timeoutParam);
      if (timeout > maxTimeout) {
        return new Response(`Timeout must be at most ${maxTimeout} ms`, {
          status: 400,
        });
      }
    }
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
        signal: AbortSignal.timeout(timeout),
      }),
    );
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      return new Response("Request timed out", { status: 504 });
    }
    return new Response(`Request failed: ${e}`, { status: 502 });
  }
});
await server.finished;

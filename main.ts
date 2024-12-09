#!/usr/bin/env -S deno serve --allow-import=jsr.io:443 --allow-net

import { serverListPing } from "./mod.ts";

const defaultTimeout = 10000;
const maxTimeout = 120000;
const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: [
        ["access-control-allow-methods", "*"],
        ["access-control-allow-headers", "*"],
        ["access-control-max-age", "86400"],
      ],
    });
  }
  if (!(req.method === "GET" || req.method === "HEAD")) {
    return new Response(null, {
      status: 405,
      headers: [
        ["allow", "GET, HEAD"],
      ],
    });
  }
  const url = new URL(req.url);
  if (url.pathname === "/") {
    return new Response(`Usage: ${url.origin}/:address`);
  }
  if (url.pathname === "/favicon.ico") {
    return new Response(null, { status: 404 });
  }
  const parseErrors: string[] = [];
  let protocol: number | undefined;
  parseProtocol: {
    const protocolParam = url.searchParams.get("protocol");
    if (protocolParam === null) {
      break parseProtocol;
    }
    if (!/^-?\d+$/.test(protocolParam)) {
      parseErrors.push("Protocol version must be an integer");
      break parseProtocol;
    }
    protocol = Number(protocolParam);
    if ((protocol | 0) !== protocol) {
      parseErrors.push("Protocol version must fit in 32 bits");
    }
  }
  let timeout = defaultTimeout;
  parseTimeout: {
    const timeoutParam = url.searchParams.get("timeout");
    if (timeoutParam === null) {
      break parseTimeout;
    }
    if (!/^\d+$/.test(timeoutParam)) {
      parseErrors.push("Timeout must be a non-negative integer");
      break parseTimeout;
    }
    timeout = Number(timeoutParam);
    if (timeout > maxTimeout) {
      parseErrors.push(`Timeout must be at most ${maxTimeout} ms`);
    }
  }
  const parser = new URL("dummy://");
  try {
    const addr = decodeURIComponent(url.pathname.substring(1));
    if (!/[/\\]/.test(addr)) {
      parser.host = addr;
    }
  } catch {
    // handled below
  }
  if (!parser.hostname) {
    parseErrors.push("Invalid address");
  }
  if (parseErrors.length !== 0) {
    return new Response(parseErrors.join("\n"), { status: 400 });
  }
  try {
    const json = await serverListPing({
      hostname: parser.hostname,
      port: parser.port ? parseInt(parser.port, 10) : undefined,
      protocol,
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(timeout)]),
    });
    return new Response(json, {
      headers: [
        ["content-type", "application/json"],
      ],
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      return new Response("Request timed out", { status: 504 });
    }
    return new Response(`Request failed: ${e}`, { status: 502 });
  }
};
export default {
  async fetch(req) {
    const res = await handler(req);
    res.headers.append("access-control-allow-origin", "*");
    return res;
  },
} satisfies Deno.ServeDefaultExport;

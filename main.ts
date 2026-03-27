#!/usr/bin/env -S deno serve --allow-import=jsr.io:443 --allow-net

import { serverListPing } from "./mod.ts";

const integerRE = /^-?\d+$/;
const unsignedIntegerRE = /^\d+$/;
const bracketedHostRE = /^\[([^:\]]*:[^\]]*)](?::(\d*))?$/;

function parseAddr(input: string): {
  hostname: string;
  port: number | undefined;
} | null {
  let hostname: string;
  let portString: string | undefined;
  if (input.startsWith("[")) {
    const match = bracketedHostRE.exec(input);
    if (!match) {
      return null;
    }
    ({ 1: hostname, 2: portString } = match);
  } else {
    const parts = input.split(":", 3);
    if (parts.length === 2) {
      ({ 0: hostname, 1: portString } = parts);
    } else {
      hostname = input;
    }
  }
  let port: number | undefined;
  if (portString) {
    if (!integerRE.test(portString)) {
      return null;
    }
    port = Number(portString) || 0;
    if (port < 0 || port > 65535) {
      return null;
    }
  }
  return { hostname, port };
}

const defaultTimeout = 10000;
const maxTimeout = 120000;
const handler = async (
  signal: AbortSignal,
  path: string,
  params: URLSearchParams,
) => {
  let addr: string;
  try {
    addr = decodeURIComponent(path.substring(1));
  } catch {
    return new Response("Malformed URI", { status: 400 });
  }
  const parse = parseAddr(addr);
  if (!parse) {
    return new Response("Invalid address", { status: 400 });
  }
  const { hostname, port } = parse;
  if (!hostname) {
    return new Response("Empty hostname", { status: 400 });
  }
  let timeout = defaultTimeout;
  let protocol: number | undefined;
  let ignoreSRV = false;
  for (const [name, value] of params) {
    switch (name) {
      case "timeout":
        if (!unsignedIntegerRE.test(value)) {
          return new Response(
            `Value of parameter 'timeout' must be an unsigned integer; got '${value}'`,
            { status: 400 },
          );
        }
        timeout = Number(value);
        if (timeout > maxTimeout) {
          return new Response(
            `Value of parameter 'timeout' must be no greater than ${maxTimeout}; got '${value}'`,
            { status: 400 },
          );
        }
        break;
      case "protocol":
        if (!integerRE.test(value)) {
          return new Response(
            `Value of parameter 'protocol' must be an integer; got '${value}'`,
            { status: 400 },
          );
        }
        protocol = Number(value);
        if ((protocol | 0) !== protocol) {
          return new Response(
            `Value of parameter 'protocol' must fit in 32 bits; got '${value}'`,
            { status: 400 },
          );
        }
        break;
      case "ignore-srv":
        ignoreSRV = true;
        break;
    }
  }
  try {
    const json = await serverListPing({
      hostname,
      port,
      protocol,
      ignoreSRV,
      signal: AbortSignal.any([signal, AbortSignal.timeout(timeout)]),
    });
    return new Response(json, {
      headers: {
        "cache-control": "no-store",
        "content-type": "application/json",
      },
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
    if (!["GET", "HEAD"].includes(req.method)) {
      return new Response(null, {
        status: 501,
        headers: { "connection": "close" },
      });
    }
    if (req.headers.get("sec-fetch-dest") === "image") {
      return new Response(null, {
        status: 404,
        headers: { "vary": "sec-fetch-dest" },
      });
    }
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response(`Usage: ${url.origin}/:address`);
    }
    const res = await handler(req.signal, url.pathname, url.searchParams);
    res.headers.append("access-control-allow-origin", "*");
    res.headers.append("allow", "GET, HEAD");
    return res;
  },
} satisfies Deno.ServeDefaultExport;

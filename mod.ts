import {
  Buffer,
  BufReader,
  BufWriter,
  readFull,
  readFullSync,
  readVarUint32LE,
  readVarUint32LESync,
  unexpectedEof,
  writeBigInt64BESync,
  writeInt16BESync,
  writeVarInt32LE,
  writeVarInt32LESync,
} from "./deps/binio.ts";

import { abortable } from "./abortable.ts";
import { deadline } from "./deadline.ts";
import { tryClose } from "./try_close.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function readTextSync(r: Buffer): string | null {
  const len = readVarUint32LESync(r);
  if (len === null) {
    return null;
  }
  const bytes = readFullSync(r, new Uint8Array(len)) ?? unexpectedEof();
  return decoder.decode(bytes);
}

async function readPacket(r: BufReader): Promise<Buffer> {
  const len = await readVarUint32LE(r) ?? unexpectedEof();
  const bytes = await readFull(r, new Uint8Array(len)) ?? unexpectedEof();
  return new Buffer(bytes);
}

function writeTextSync(w: Buffer, str: string): undefined {
  const bytes = encoder.encode(str);
  writeVarInt32LESync(w, bytes.length);
  w.writeSync(bytes);
}

async function writePacket(
  w: BufWriter,
  fn: (p: Buffer) => unknown,
): Promise<undefined> {
  const buf = new Buffer();
  await fn(buf);
  await writeVarInt32LE(w, buf.length);
  await w.write(buf.bytes({ copy: false }));
}

export const defaultPort = 25565;

export interface ServerListPingOptions {
  hostname: string;
  port?: number;
  protocol?: number;
  signal?: AbortSignal;
}

/** @tags allow-net */
export async function serverListPing(
  options: ServerListPingOptions,
): Promise<string> {
  let { hostname, port = defaultPort, protocol = -1, signal } = options;
  if (port === defaultPort) {
    try {
      const [record] = await Deno.resolveDns(
        `_minecraft._tcp.${hostname}`,
        "SRV",
        { signal },
      );
      if (record) {
        hostname = record.target;
        port = record.port;
      }
    } catch {
      // ignored
    }
  }
  return await deadline(signal, async () => {
    const conn = await Deno.connect({ hostname, port });
    try {
      return await abortable(signal, () => conn.close(), async () => {
        const r = new BufReader(conn);
        const w = new BufWriter(conn);
        await writePacket(w, (p) => {
          writeVarInt32LESync(p, 0);
          writeVarInt32LESync(p, protocol);
          writeTextSync(p, hostname);
          writeInt16BESync(p, port);
          writeVarInt32LESync(p, 1);
        });
        await writePacket(w, (p) => {
          writeVarInt32LESync(p, 0);
        });
        await writePacket(w, (p) => {
          writeVarInt32LESync(p, 1);
          writeBigInt64BESync(p, 0n);
        });
        await w.flush();
        const rp = await readPacket(r);
        if (readVarUint32LESync(rp) !== 0) {
          throw new TypeError("Expected to receive a Response packet");
        }
        const json = readTextSync(rp) ?? unexpectedEof();
        JSON.parse(json);
        return json;
      });
    } finally {
      tryClose(conn);
    }
  });
}

import {
  BufferedReadableStream,
  BufferedWritableStream,
  readFull,
  readFullSync,
  readVarUint32LE,
  readVarUint32LESync,
  Uint8ArrayReader,
  Uint8ArrayWriter,
  unexpectedEof,
  writeBigInt64BESync,
  writeInt16BESync,
  writeVarInt32LE,
  writeVarInt32LESync,
} from "./deps/binio.ts";

import { abortable } from "./abortable.ts";
import { deadline } from "./deadline.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function readTextSync(r: Uint8ArrayReader): string | null {
  const len = readVarUint32LESync(r);
  if (len === null) {
    return null;
  }
  const bytes = readFullSync(r, new Uint8Array(len)) ?? unexpectedEof();
  return decoder.decode(bytes);
}

async function readPacket(
  r: ReadableStreamBYOBReader,
): Promise<Uint8ArrayReader> {
  const len = await readVarUint32LE(r) ?? unexpectedEof();
  const bytes = await readFull(r, new Uint8Array(len)) ?? unexpectedEof();
  return new Uint8ArrayReader(bytes);
}

function writeTextSync(w: Uint8ArrayWriter, str: string): undefined {
  const bytes = encoder.encode(str);
  writeVarInt32LESync(w, bytes.length);
  w.write(bytes);
}

async function writePacket(
  w: WritableStreamDefaultWriter<Uint8Array>,
  fn: (p: Uint8ArrayWriter) => unknown,
): Promise<undefined> {
  const packet = new Uint8ArrayWriter();
  await fn(packet);
  const bytes = packet.bytes;
  await writeVarInt32LE(w, bytes.length);
  await w.write(bytes);
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
    using conn = await Deno.connect({ hostname, port });
    const bufferedReadable = new BufferedReadableStream(conn.readable);
    const bufferedWritable = new BufferedWritableStream(conn.writable);
    return await abortable(signal, () => conn.close(), async () => {
      const r = bufferedReadable.getReader({ mode: "byob" });
      const w = bufferedWritable.getWriter();
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
      await w.write({ type: "flush" });
      const rp = await readPacket(r);
      if (readVarUint32LESync(rp) ?? unexpectedEof() !== 0) {
        throw new TypeError("Expected to receive a Response packet");
      }
      const json = readTextSync(rp) ?? unexpectedEof();
      JSON.parse(json);
      return json;
    });
  });
}

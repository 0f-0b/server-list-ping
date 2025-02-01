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
  writeVarUint32LE,
  writeVarUint32LESync,
} from "@ud2/binio";

import { abortable } from "./abortable.ts";
import { deadline } from "./deadline.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder(undefined, { ignoreBOM: true });

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
  writeVarUint32LESync(w, bytes.length);
  w.write(bytes);
}

async function writePacket(
  w: WritableStreamDefaultWriter<Uint8Array<ArrayBuffer>>,
  fn: (p: Uint8ArrayWriter) => unknown,
): Promise<undefined> {
  const packet = new Uint8ArrayWriter();
  await fn(packet);
  const bytes = packet.bytes;
  await writeVarUint32LE(w, bytes.length);
  await w.write(bytes);
}

/** The default port of a Minecraft server. */
export const DEFAULT_PORT = 25565;

/** Options that can be passed to {@linkcode serverListPing}. */
export interface ServerListPingOptions {
  /** The hostname or the IP address of the server. */
  hostname: string;
  /** The port of the server. Defaults to {@linkcode DEFAULT_PORT}. */
  port?: number | undefined;
  /**
   * The [protocol version](https://minecraft.wiki/w/Protocol_version). The
   * vanilla server does not use this information. Defaults to `-1`.
   */
  protocol?: number | undefined;
  /** If `true`, do not resolve SRV records. */
  ignoreSRV?: boolean | undefined;
  /** A signal to abort the query. */
  signal?: AbortSignal | undefined;
}

/**
 * Queries a Minecraft server via
 * [Server List Ping](https://wiki.vg/Server_List_Ping).
 *
 * @returns A {@linkcode Promise} that fulfills with the JSON response.
 *
 * @tags allow-net
 */
export async function serverListPing(
  options: ServerListPingOptions,
): Promise<string> {
  let {
    hostname,
    port = DEFAULT_PORT,
    protocol = -1,
    ignoreSRV,
    signal,
  } = options;
  if (!ignoreSRV && port === DEFAULT_PORT) {
    try {
      const [record] = await Deno.resolveDns(
        `_minecraft._tcp.${hostname}`,
        "SRV",
        // @ts-expect-error Deno typings are not compatible with `exactOptionalPropertyTypes` yet
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
    // @ts-expect-error Deno typings are not compatible with `exactOptionalPropertyTypes` yet
    using conn = await Deno.connect({ hostname, port, signal });
    const bufferedReadable = new BufferedReadableStream(conn.readable);
    const bufferedWritable = new BufferedWritableStream(conn.writable);
    return await abortable(signal, () => conn.close(), async () => {
      const r = bufferedReadable.getReader({ mode: "byob" });
      const w = bufferedWritable.getWriter();
      await writePacket(w, (p) => {
        writeVarUint32LESync(p, 0);
        writeVarUint32LESync(p, protocol);
        writeTextSync(p, hostname);
        writeInt16BESync(p, port);
        writeVarUint32LESync(p, 1);
      });
      await writePacket(w, (p) => {
        writeVarUint32LESync(p, 0);
      });
      await writePacket(w, (p) => {
        writeVarUint32LESync(p, 1);
        writeBigInt64BESync(p, 0n);
      });
      await w.write({ type: "flush" });
      const rp = await readPacket(r);
      if (readVarUint32LESync(rp) ?? unexpectedEof() !== 0) {
        throw new TypeError("Expected to receive a status_response packet");
      }
      return readTextSync(rp) ?? unexpectedEof();
    });
  });
}

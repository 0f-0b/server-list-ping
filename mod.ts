import { abortable } from "./abortable.ts";
import {
  Buffer,
  BufReader,
  BufWriter,
  readBuffer,
  readBufferSync,
  readVarInt,
  readVarIntSync,
  unexpectedEof,
  writeBufferSync,
  writeLongBESync,
  writePacket,
  writeShortBESync,
  writeVarInt,
  writeVarIntSync,
} from "./bufio.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const defaultPort = 25565;

export interface ServerListPingOptions {
  hostname: string;
  port?: number;
  signal?: AbortSignal;
}

export async function serverListPing(
  options: ServerListPingOptions,
): Promise<unknown> {
  const signal = options.signal;
  signal?.throwIfAborted();
  let { hostname, port = defaultPort } = options;
  if (port === defaultPort) {
    try {
      const [record] = await Deno.resolveDns(
        `_minecraft._tcp.${hostname}`,
        "SRV",
      );
      if (record) {
        hostname = record.target;
        port = record.port;
      }
    } catch {
      // ignored
    }
    signal?.throwIfAborted();
  }
  const conn = await Deno.connect({ hostname, port });
  return await abortable(signal, () => conn.close(), async () => {
    const r = new BufReader(conn);
    const w = new BufWriter(conn);
    await writePacket(w, writeVarInt, (p) => {
      writeVarIntSync(p, 0);
      writeVarIntSync(p, -1);
      writeBufferSync(p, writeVarIntSync, encoder.encode(hostname));
      writeShortBESync(p, port);
      writeVarIntSync(p, 1);
    });
    await writePacket(w, writeVarInt, (p) => {
      writeVarIntSync(p, 0);
    });
    await writePacket(w, writeVarInt, (p) => {
      writeVarIntSync(p, 1);
      writeLongBESync(p, 0n);
    });
    await w.flush();
    const rp = new Buffer(await readBuffer(r, readVarInt) ?? unexpectedEof());
    if (readVarIntSync(rp) !== 0) {
      throw new TypeError("Expected Response packet");
    }
    return JSON.parse(
      decoder.decode(readBufferSync(rp, readVarIntSync) ?? unexpectedEof()),
    );
  });
}

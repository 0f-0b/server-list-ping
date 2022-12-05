import { abortable } from "./abortable.ts";
import {
  Buffer,
  BufReader,
  BufWriter,
  readBuffer,
  readBufferSync,
  readVarint32,
  readVarint32Sync,
  unexpectedEof,
  writeBigInt64BESync,
  writeBufferSync,
  writeInt16BESync,
  writePacket,
  writeVarint32,
  writeVarint32Sync,
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
    await writePacket(w, writeVarint32, (p) => {
      writeVarint32Sync(p, 0);
      writeVarint32Sync(p, -1);
      writeBufferSync(p, writeVarint32Sync, encoder.encode(hostname));
      writeInt16BESync(p, port);
      writeVarint32Sync(p, 1);
    });
    await writePacket(w, writeVarint32, (p) => {
      writeVarint32Sync(p, 0);
    });
    await writePacket(w, writeVarint32, (p) => {
      writeVarint32Sync(p, 1);
      writeBigInt64BESync(p, 0n);
    });
    await w.flush();
    const rp = new Buffer(await readBuffer(r, readVarint32) ?? unexpectedEof());
    if (readVarint32Sync(rp) !== 0) {
      throw new TypeError("Expected Response packet");
    }
    return JSON.parse(
      decoder.decode(readBufferSync(rp, readVarint32Sync) ?? unexpectedEof()),
    );
  });
}

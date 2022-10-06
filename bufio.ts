import { encodeU32, encodeU64 } from "./deps/std/encoding/varint.ts";
import { Buffer, BufReader, BufWriter } from "./deps/std/io/buffer.ts";

export { Buffer, BufReader, BufWriter };

export function unexpectedEof(): never {
  throw new Deno.errors.UnexpectedEof();
}

export function encodeShortLE(value: number): Uint8Array {
  const buf = new ArrayBuffer(2);
  new DataView(buf).setInt16(0, value, true);
  return new Uint8Array(buf);
}

export function encodeShortBE(value: number): Uint8Array {
  const buf = new ArrayBuffer(2);
  new DataView(buf).setInt16(0, value);
  return new Uint8Array(buf);
}

export function encodeIntLE(value: number): Uint8Array {
  const buf = new ArrayBuffer(4);
  new DataView(buf).setInt32(0, value, true);
  return new Uint8Array(buf);
}

export function encodeIntBE(value: number): Uint8Array {
  const buf = new ArrayBuffer(4);
  new DataView(buf).setInt32(0, value);
  return new Uint8Array(buf);
}

export function encodeLongLE(value: bigint): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigInt64(0, value, true);
  return new Uint8Array(buf);
}

export function encodeLongBE(value: bigint): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigInt64(0, value);
  return new Uint8Array(buf);
}

export function encodeVarInt(value: number): Uint8Array {
  return encodeU32(value >>> 0);
}

export function encodeVarLong(value: bigint): Uint8Array {
  return encodeU64(BigInt.asUintN(64, value));
}

export async function readFull(
  r: BufReader,
  buf: Uint8Array,
): Promise<Uint8Array | null> {
  return await r.readFull(buf);
}

export function readFullSync(r: Buffer, buf: Uint8Array): Uint8Array | null {
  const read = r.readSync(buf);
  if (read === null) {
    return null;
  }
  if (read < buf.length) {
    unexpectedEof();
  }
  return buf;
}

export async function readByte(r: BufReader): Promise<number | null> {
  return await r.readByte();
}

export function readByteSync(r: Buffer): number | null {
  const buf = readFullSync(r, new Uint8Array(1));
  if (buf === null) {
    return null;
  }
  return buf[0];
}

export async function readShortLE(r: BufReader): Promise<number | null> {
  const low = await readByte(r);
  if (low === null) {
    return null;
  }
  const high = await readByte(r) ?? unexpectedEof();
  return low | (high << 8);
}

export function readShortLESync(r: Buffer): number | null {
  const buf = readFullSync(r, new Uint8Array(2));
  if (buf === null) {
    return null;
  }
  return new DataView(buf.buffer).getInt16(0, true);
}

export async function readShortBE(r: BufReader): Promise<number | null> {
  const high = await readByte(r);
  if (high === null) {
    return null;
  }
  const low = await readByte(r) ?? unexpectedEof();
  return low | (high << 8);
}

export function readShortBESync(r: Buffer): number | null {
  const buf = readFullSync(r, new Uint8Array(2));
  if (buf === null) {
    return null;
  }
  return new DataView(buf.buffer).getInt16(0);
}

export async function readIntLE(r: BufReader): Promise<number | null> {
  const low = await readShortLE(r);
  if (low === null) {
    return null;
  }
  const high = await readShortLE(r) ?? unexpectedEof();
  return low | (high << 16);
}

export function readIntLESync(r: Buffer): number | null {
  const buf = readFullSync(r, new Uint8Array(4));
  if (buf === null) {
    return null;
  }
  return new DataView(buf.buffer).getInt32(0, true);
}

export async function readIntBE(r: BufReader): Promise<number | null> {
  const high = await readShortBE(r);
  if (high === null) {
    return null;
  }
  const low = await readShortBE(r) ?? unexpectedEof();
  return low | (high << 16);
}

export function readIntBESync(r: Buffer): number | null {
  const buf = readFullSync(r, new Uint8Array(4));
  if (buf === null) {
    return null;
  }
  return new DataView(buf.buffer).getInt32(0);
}

export async function readVarInt(r: BufReader): Promise<number | null> {
  let result = 0;
  let len = 0;
  for (;;) {
    const b = await readByte(r);
    if (b === null) {
      if (len > 0) {
        unexpectedEof();
      }
      return null;
    }
    result |= (b & 0x7f) << (len * 7);
    if (!(b & 0x80)) {
      break;
    }
    if (++len === 5) {
      throw new TypeError("VarInt is too long");
    }
  }
  return result;
}

export function readVarIntSync(r: Buffer): number | null {
  const buf = new Uint8Array(1);
  let result = 0;
  let len = 0;
  for (;;) {
    if (r.readSync(buf) === null) {
      if (len > 0) {
        unexpectedEof();
      }
      return null;
    }
    const b = buf[0];
    result |= (b & 0x7f) << (len * 7);
    if (!(b & 0x80)) {
      break;
    }
    if (++len === 5) {
      throw new TypeError("VarInt is too long");
    }
  }
  return result;
}

export async function readVarLong(r: BufReader): Promise<bigint | null> {
  let result = 0n;
  let len = 0;
  for (;;) {
    const b = await readByte(r);
    if (b === null) {
      if (len > 0) {
        unexpectedEof();
      }
      return null;
    }
    result |= BigInt(b & 0x7f) << BigInt(len * 7);
    if (!(b & 0x80)) {
      break;
    }
    if (++len === 10) {
      throw new TypeError("VarLong is too long");
    }
  }
  return result;
}

export function readVarLongSync(r: Buffer): bigint | null {
  const buf = new Uint8Array(1);
  let result = 0n;
  let len = 0;
  for (;;) {
    if (r.readSync(buf) === null) {
      if (len > 0) {
        unexpectedEof();
      }
      return null;
    }
    const b = buf[0];
    result |= BigInt(b & 0x7f) << BigInt(len * 7);
    if (!(b & 0x80)) {
      break;
    }
    if (++len === 10) {
      throw new TypeError("VarLong is too long");
    }
  }
  return result;
}

export async function readBuffer(
  r: BufReader,
  readLength: (r: BufReader) => Promise<number | null>,
): Promise<Uint8Array | null> {
  const len = await readLength(r);
  if (len === null) {
    return null;
  }
  const buf = await readFull(r, new Uint8Array(len));
  if (buf === null) {
    unexpectedEof();
  }
  return buf;
}

export function readBufferSync(
  r: Buffer,
  readLength: (r: Buffer) => number | null,
): Uint8Array | null {
  const len = readLength(r);
  if (len === null) {
    return null;
  }
  const buf = new Uint8Array(len);
  if (r.readSync(buf) !== len) {
    unexpectedEof();
  }
  return buf;
}

export async function writeByte(
  w: BufWriter,
  value: number,
): Promise<undefined> {
  await w.write(new Uint8Array([value]));
  return;
}

export function writeByteSync(w: Buffer, value: number): undefined {
  w.writeSync(new Uint8Array([value]));
  return;
}

export async function writeShortLE(
  w: BufWriter,
  value: number,
): Promise<undefined> {
  await w.write(encodeShortLE(value));
  return;
}

export function writeShortLESync(w: Buffer, value: number): undefined {
  w.writeSync(encodeShortLE(value));
  return;
}

export async function writeShortBE(
  w: BufWriter,
  value: number,
): Promise<undefined> {
  await w.write(encodeShortBE(value));
  return;
}

export function writeShortBESync(w: Buffer, value: number): undefined {
  w.writeSync(encodeShortBE(value));
  return;
}

export async function writeIntLE(
  w: BufWriter,
  value: number,
): Promise<undefined> {
  await w.write(encodeIntLE(value));
  return;
}

export function writeIntLESync(w: Buffer, value: number): undefined {
  w.writeSync(encodeIntLE(value));
  return;
}

export async function writeIntBE(
  w: BufWriter,
  value: number,
): Promise<undefined> {
  await w.write(encodeIntBE(value));
  return;
}

export function writeIntBESync(w: Buffer, value: number): undefined {
  w.writeSync(encodeIntBE(value));
  return;
}

export async function writeLongLE(
  w: BufWriter,
  value: bigint,
): Promise<undefined> {
  await w.write(encodeLongLE(value));
  return;
}

export function writeLongLESync(w: Buffer, value: bigint): undefined {
  w.writeSync(encodeLongLE(value));
  return;
}

export async function writeLongBE(
  w: BufWriter,
  value: bigint,
): Promise<undefined> {
  await w.write(encodeLongBE(value));
  return;
}

export function writeLongBESync(w: Buffer, value: bigint): undefined {
  w.writeSync(encodeLongBE(value));
  return;
}

export async function writeVarInt(
  w: BufWriter,
  value: number,
): Promise<undefined> {
  await w.write(encodeVarInt(value));
  return;
}

export function writeVarIntSync(w: Buffer, value: number): undefined {
  w.writeSync(encodeVarInt(value));
  return;
}

export async function writeVarLong(
  w: BufWriter,
  value: bigint,
): Promise<undefined> {
  await w.write(encodeVarLong(value));
  return;
}

export function writeVarLongSync(w: Buffer, value: bigint): undefined {
  w.writeSync(encodeVarLong(value));
  return;
}

export async function writeBuffer(
  w: BufWriter,
  writeLength: (w: BufWriter, value: number) => unknown,
  buf: Uint8Array,
): Promise<undefined> {
  await writeLength(w, buf.length);
  await w.write(buf);
  return;
}

export function writeBufferSync(
  w: Buffer,
  writeLength: (w: Buffer, value: number) => unknown,
  buf: Uint8Array,
): undefined {
  writeLength(w, buf.length);
  w.writeSync(buf);
  return;
}

export async function writePacket(
  w: BufWriter,
  writeLength: (w: BufWriter, value: number) => unknown,
  fn: (p: Buffer) => unknown,
): Promise<undefined> {
  const buf = new Buffer();
  await fn(buf);
  await writeBuffer(w, writeLength, buf.bytes({ copy: false }));
  return;
}

export function writePacketSync(
  w: Buffer,
  writeLength: (w: Buffer, value: number) => unknown,
  fn: (p: Buffer) => unknown,
): undefined {
  const buf = new Buffer();
  fn(buf);
  writeBufferSync(w, writeLength, buf.bytes({ copy: false }));
  return;
}

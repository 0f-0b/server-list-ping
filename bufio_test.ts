import {
  assertEquals,
  assertRejects,
  assertStrictEquals,
  assertThrows,
} from "./deps/std/testing/asserts.ts";

import {
  Buffer,
  BufReader,
  BufWriter,
  readBigUint64BE,
  readBigUint64BESync,
  readBigUint64LE,
  readBigUint64LESync,
  readBigVarint64,
  readBigVarint64Sync,
  readBuffer,
  readBufferSync,
  readFull,
  readFullSync,
  readUint16BE,
  readUint16BESync,
  readUint16LE,
  readUint16LESync,
  readUint32BE,
  readUint32BESync,
  readUint32LE,
  readUint32LESync,
  readUint8,
  readUint8Sync,
  readVarint32,
  readVarint32Sync,
  unexpectedEof,
  writeBigInt64BE,
  writeBigInt64BESync,
  writeBigInt64LE,
  writeBigInt64LESync,
  writeBigVarint64,
  writeBigVarint64Sync,
  writeBuffer,
  writeBufferSync,
  writeInt16BE,
  writeInt16BESync,
  writeInt16LE,
  writeInt16LESync,
  writeInt32BE,
  writeInt32BESync,
  writeInt32LE,
  writeInt32LESync,
  writeInt8,
  writeInt8Sync,
  writePacket,
  writePacketSync,
  writeVarint32,
  writeVarint32Sync,
} from "./bufio.ts";

Deno.test("unexpectedEof", { permissions: "none" }, () => {
  assertThrows(unexpectedEof, Deno.errors.UnexpectedEof);
});

Deno.test("readFull", { permissions: "none" }, async () => {
  {
    const r = new BufReader(new Buffer());
    const buf = new Uint8Array(1);
    assertStrictEquals(await readFull(r, buf), null);
  }
  {
    const r = new BufReader(new Buffer([0x12, 0x34, 0x56, 0x78]));
    const buf = new Uint8Array(3);
    assertStrictEquals(await readFull(r, buf), buf);
    assertEquals(buf, Uint8Array.of(0x12, 0x34, 0x56));
  }
  {
    const r = new BufReader(new Buffer([0x12, 0x34, 0x56, 0x78]));
    const buf = new Uint8Array(5);
    await assertRejects(() => readFull(r, buf), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readFullSync", { permissions: "none" }, () => {
  {
    const p = new Buffer();
    const buf = new Uint8Array(1);
    assertStrictEquals(readFullSync(p, buf), null);
  }
  {
    const p = new Buffer([0x12, 0x34, 0x56, 0x78]);
    const buf = new Uint8Array(3);
    assertStrictEquals(readFullSync(p, buf), buf);
    assertEquals(buf, Uint8Array.of(0x12, 0x34, 0x56));
  }
  {
    const p = new Buffer([0x12, 0x34, 0x56, 0x78]);
    const buf = new Uint8Array(5);
    assertThrows(() => readFullSync(p, buf), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readUint8", { permissions: "none" }, async () => {
  const r = new BufReader(new Buffer([0x87]));
  assertStrictEquals(await readUint8(r), 0x87);
  assertStrictEquals(await readUint8(r), null);
});

Deno.test("readUint8Sync", { permissions: "none" }, () => {
  const p = new Buffer([0x87]);
  assertStrictEquals(readUint8Sync(p), 0x87);
  assertStrictEquals(readUint8Sync(p), null);
});

Deno.test("readUint16LE", { permissions: "none" }, async () => {
  {
    const r = new BufReader(new Buffer([0x65, 0x87]));
    assertStrictEquals(await readUint16LE(r), 0x8765);
    assertStrictEquals(await readUint16LE(r), null);
  }
  {
    const r = new BufReader(new Buffer([0x65]));
    await assertRejects(() => readUint16LE(r), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readUint16LESync", { permissions: "none" }, () => {
  {
    const p = new Buffer([0x65, 0x87]);
    assertStrictEquals(readUint16LESync(p), 0x8765);
    assertStrictEquals(readUint16LESync(p), null);
  }
  {
    const p = new Buffer([0x65]);
    assertThrows(() => readUint16LESync(p), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readUint16BE", { permissions: "none" }, async () => {
  {
    const r = new BufReader(new Buffer([0x87, 0x65]));
    assertStrictEquals(await readUint16BE(r), 0x8765);
    assertStrictEquals(await readUint16BE(r), null);
  }
  {
    const r = new BufReader(new Buffer([0x87]));
    await assertRejects(() => readUint16BE(r), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readUint16BESync", { permissions: "none" }, () => {
  {
    const p = new Buffer([0x87, 0x65]);
    assertStrictEquals(readUint16BESync(p), 0x8765);
    assertStrictEquals(readUint16BESync(p), null);
  }
  {
    const p = new Buffer([0x87]);
    assertThrows(() => readUint16BESync(p), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readUint32LE", { permissions: "none" }, async () => {
  {
    const r = new BufReader(new Buffer([0x21, 0x43, 0x65, 0x87]));
    assertStrictEquals(await readUint32LE(r), 0x87654321);
    assertStrictEquals(await readUint32LE(r), null);
  }
  {
    const r = new BufReader(new Buffer([0x21]));
    await assertRejects(() => readUint32LE(r), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readUint32LESync", { permissions: "none" }, () => {
  {
    const p = new Buffer([0x21, 0x43, 0x65, 0x87]);
    assertStrictEquals(readUint32LESync(p), 0x87654321);
    assertStrictEquals(readUint32LESync(p), null);
  }
  {
    const p = new Buffer([0x21]);
    assertThrows(() => readUint32LESync(p), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readUint32BE", { permissions: "none" }, async () => {
  {
    const r = new BufReader(new Buffer([0x87, 0x65, 0x43, 0x21]));
    assertStrictEquals(await readUint32BE(r), 0x87654321);
    assertStrictEquals(await readUint32BE(r), null);
  }
  {
    const r = new BufReader(new Buffer([0x87]));
    await assertRejects(() => readUint32BE(r), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readUint32BESync", { permissions: "none" }, () => {
  {
    const p = new Buffer([0x87, 0x65, 0x43, 0x21]);
    assertStrictEquals(readUint32BESync(p), 0x87654321);
    assertStrictEquals(readUint32BESync(p), null);
  }
  {
    const p = new Buffer([0x87]);
    assertThrows(() => readUint32BESync(p), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readBigUint64LE", { permissions: "none" }, async () => {
  {
    const r = new BufReader(
      new Buffer([0x21, 0x43, 0x65, 0x87, 0x21, 0x43, 0x65, 0x87]),
    );
    assertStrictEquals(await readBigUint64LE(r), 0x8765432187654321n);
    assertStrictEquals(await readBigUint64LE(r), null);
  }
  {
    const r = new BufReader(new Buffer([0x21]));
    await assertRejects(() => readBigUint64LE(r), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readBigUint64LESync", { permissions: "none" }, () => {
  {
    const p = new Buffer([0x21, 0x43, 0x65, 0x87, 0x21, 0x43, 0x65, 0x87]);
    assertStrictEquals(readBigUint64LESync(p), 0x8765432187654321n);
    assertStrictEquals(readBigUint64LESync(p), null);
  }
  {
    const p = new Buffer([0x21]);
    assertThrows(() => readBigUint64LESync(p), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readBigUint64BE", { permissions: "none" }, async () => {
  {
    const r = new BufReader(
      new Buffer([0x87, 0x65, 0x43, 0x21, 0x87, 0x65, 0x43, 0x21]),
    );
    assertStrictEquals(await readBigUint64BE(r), 0x8765432187654321n);
    assertStrictEquals(await readBigUint64BE(r), null);
  }
  {
    const r = new BufReader(new Buffer([0x87]));
    await assertRejects(() => readBigUint64BE(r), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readBigUint64BESync", { permissions: "none" }, () => {
  {
    const p = new Buffer([0x87, 0x65, 0x43, 0x21, 0x87, 0x65, 0x43, 0x21]);
    assertStrictEquals(readBigUint64BESync(p), 0x8765432187654321n);
    assertStrictEquals(readBigUint64BESync(p), null);
  }
  {
    const p = new Buffer([0x87]);
    assertThrows(() => readBigUint64BESync(p), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readVarint32", { permissions: "none" }, async () => {
  {
    const r = new BufReader(new Buffer([0xa1, 0x86, 0x95, 0xbb, 0x08]));
    assertStrictEquals(await readVarint32(r), 0x87654321);
    assertStrictEquals(await readVarint32(r), null);
  }
  {
    const r = new BufReader(new Buffer([0xa1, 0x86, 0x95, 0xbb, 0x88]));
    await assertRejects(() => readVarint32(r), TypeError, "too long");
  }
  {
    const r = new BufReader(new Buffer([0xa1]));
    await assertRejects(() => readVarint32(r), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readVarint32Sync", { permissions: "none" }, () => {
  {
    const p = new Buffer([0xa1, 0x86, 0x95, 0xbb, 0x08]);
    assertStrictEquals(readVarint32Sync(p), 0x87654321);
    assertStrictEquals(readVarint32Sync(p), null);
  }
  {
    const p = new Buffer([0xa1, 0x86, 0x95, 0xbb, 0x88]);
    assertThrows(() => readVarint32Sync(p), TypeError, "too long");
  }
  {
    const p = new Buffer([0xa1]);
    assertThrows(() => readVarint32Sync(p), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readBigVarint64", { permissions: "none" }, async () => {
  {
    const r = new BufReader(
      new Buffer([0xa1, 0x86, 0x95, 0xbb, 0x98, 0xe4, 0xd0, 0xb2, 0x87, 0x01]),
    );
    assertStrictEquals(await readBigVarint64(r), 0x8765432187654321n);
    assertStrictEquals(await readBigVarint64(r), null);
  }
  {
    const r = new BufReader(
      new Buffer([0xa1, 0x86, 0x95, 0xbb, 0x98, 0xe4, 0xd0, 0xb2, 0x87, 0x81]),
    );
    await assertRejects(() => readBigVarint64(r), TypeError, "too long");
  }
  {
    const r = new BufReader(new Buffer([0xa1]));
    await assertRejects(() => readBigVarint64(r), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readBigVarint64Sync", { permissions: "none" }, () => {
  {
    const p = new Buffer(
      [0xa1, 0x86, 0x95, 0xbb, 0x98, 0xe4, 0xd0, 0xb2, 0x87, 0x01],
    );
    assertStrictEquals(readBigVarint64Sync(p), 0x8765432187654321n);
    assertStrictEquals(readBigVarint64Sync(p), null);
  }
  {
    const p = new Buffer(
      [0xa1, 0x86, 0x95, 0xbb, 0x98, 0xe4, 0xd0, 0xb2, 0x87, 0x81],
    );
    assertThrows(() => readBigVarint64Sync(p), TypeError, "too long");
  }
  {
    const p = new Buffer([0xa1]);
    assertThrows(() => readBigVarint64Sync(p), Deno.errors.UnexpectedEof);
  }
});

Deno.test("readBuffer", { permissions: "none" }, async () => {
  {
    const r = new BufReader(new Buffer());
    assertStrictEquals(
      await readBuffer(r, (r_) => {
        assertStrictEquals(r_, r);
        return Promise.resolve(null);
      }),
      null,
    );
  }
  {
    const r = new BufReader(new Buffer([0x12, 0x34, 0x56, 0x78]));
    assertEquals(
      await readBuffer(r, (r_) => {
        assertStrictEquals(r_, r);
        return Promise.resolve(3);
      }),
      Uint8Array.of(0x12, 0x34, 0x56),
    );
  }
  {
    const r = new BufReader(new Buffer([0x12, 0x34, 0x56, 0x78]));
    assertRejects(
      () =>
        readBuffer(r, (r_) => {
          assertStrictEquals(r_, r);
          return Promise.resolve(5);
        }),
      Deno.errors.UnexpectedEof,
    );
  }
});

Deno.test("readBufferSync", { permissions: "none" }, () => {
  {
    const p = new Buffer();
    assertStrictEquals(
      readBufferSync(p, (p_) => {
        assertStrictEquals(p_, p);
        return null;
      }),
      null,
    );
  }
  {
    const p = new Buffer([0x12, 0x34, 0x56, 0x78]);
    assertEquals(
      readBufferSync(p, (p_) => {
        assertStrictEquals(p_, p);
        return 3;
      }),
      Uint8Array.of(0x12, 0x34, 0x56),
    );
  }
  {
    const p = new Buffer([0x12, 0x34, 0x56, 0x78]);
    assertThrows(
      () =>
        readBufferSync(p, (p_) => {
          assertStrictEquals(p_, p);
          return 5;
        }),
      Deno.errors.UnexpectedEof,
    );
  }
});

Deno.test("writeInt8", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeInt8(w, 0x87);
  await w.flush();
  assertEquals(p.bytes(), Uint8Array.of(0x87));
});

Deno.test("writeInt8Sync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeInt8Sync(p, 0x87);
  assertEquals(p.bytes(), Uint8Array.of(0x87));
});

Deno.test("writeInt16LE", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeInt16LE(w, 0x8765);
  await w.flush();
  assertEquals(p.bytes(), Uint8Array.of(0x65, 0x87));
});

Deno.test("writeInt16LESync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeInt16LESync(p, 0x8765);
  assertEquals(p.bytes(), Uint8Array.of(0x65, 0x87));
});

Deno.test("writeInt16BE", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeInt16BE(w, 0x8765);
  await w.flush();
  assertEquals(p.bytes(), Uint8Array.of(0x87, 0x65));
});

Deno.test("writeInt16BESync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeInt16BESync(p, 0x8765);
  assertEquals(p.bytes(), Uint8Array.of(0x87, 0x65));
});

Deno.test("writeInt32LE", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeInt32LE(w, 0x87654321);
  await w.flush();
  assertEquals(p.bytes(), Uint8Array.of(0x21, 0x43, 0x65, 0x87));
});

Deno.test("writeInt32LESync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeInt32LESync(p, 0x87654321);
  assertEquals(p.bytes(), Uint8Array.of(0x21, 0x43, 0x65, 0x87));
});

Deno.test("writeInt32BE", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeInt32BE(w, 0x87654321);
  await w.flush();
  assertEquals(p.bytes(), Uint8Array.of(0x87, 0x65, 0x43, 0x21));
});

Deno.test("writeInt32BESync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeInt32BESync(p, 0x87654321);
  assertEquals(p.bytes(), Uint8Array.of(0x87, 0x65, 0x43, 0x21));
});

Deno.test("writeBigInt64LE", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeBigInt64LE(w, 0x8765432187654321n);
  await w.flush();
  assertEquals(
    p.bytes(),
    Uint8Array.of(0x21, 0x43, 0x65, 0x87, 0x21, 0x43, 0x65, 0x87),
  );
});

Deno.test("writeBigInt64LESync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeBigInt64LESync(p, 0x8765432187654321n);
  assertEquals(
    p.bytes(),
    Uint8Array.of(0x21, 0x43, 0x65, 0x87, 0x21, 0x43, 0x65, 0x87),
  );
});

Deno.test("writeBigInt64BE", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeBigInt64BE(w, 0x8765432187654321n);
  await w.flush();
  assertEquals(
    p.bytes(),
    Uint8Array.of(0x87, 0x65, 0x43, 0x21, 0x87, 0x65, 0x43, 0x21),
  );
});

Deno.test("writeBigInt64BESync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeBigInt64BESync(p, 0x8765432187654321n);
  assertEquals(
    p.bytes(),
    Uint8Array.of(0x87, 0x65, 0x43, 0x21, 0x87, 0x65, 0x43, 0x21),
  );
});

Deno.test("writeVarint32", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeVarint32(w, 0x87654321);
  await w.flush();
  assertEquals(p.bytes(), Uint8Array.of(0xa1, 0x86, 0x95, 0xbb, 0x08));
});

Deno.test("writeVarint32Sync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeVarint32Sync(p, 0x87654321);
  assertEquals(p.bytes(), Uint8Array.of(0xa1, 0x86, 0x95, 0xbb, 0x08));
});

Deno.test("writeBigVarint64", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeBigVarint64(w, 0x8765432187654321n);
  await w.flush();
  assertEquals(
    p.bytes(),
    Uint8Array.of(0xa1, 0x86, 0x95, 0xbb, 0x98, 0xe4, 0xd0, 0xb2, 0x87, 0x01),
  );
});

Deno.test("writeBigVarint64Sync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeBigVarint64Sync(p, 0x8765432187654321n);
  assertEquals(
    p.bytes(),
    Uint8Array.of(0xa1, 0x86, 0x95, 0xbb, 0x98, 0xe4, 0xd0, 0xb2, 0x87, 0x01),
  );
});

Deno.test("writeBuffer", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writeBuffer(
    w,
    (w_, length) => {
      assertStrictEquals(w_, w);
      assertStrictEquals(length, 3);
    },
    Uint8Array.of(0x12, 0x34, 0x56),
  );
  await w.flush();
  assertEquals(p.bytes(), Uint8Array.of(0x12, 0x34, 0x56));
});

Deno.test("writeBufferSync", { permissions: "none" }, () => {
  const p = new Buffer();
  writeBufferSync(
    p,
    (p_, length) => {
      assertStrictEquals(p_, p);
      assertStrictEquals(length, 3);
    },
    Uint8Array.of(0x12, 0x34, 0x56),
  );
  assertEquals(p.bytes(), Uint8Array.of(0x12, 0x34, 0x56));
});

Deno.test("writePacket", { permissions: "none" }, async () => {
  const p = new Buffer();
  const w = new BufWriter(p);
  await writePacket(
    w,
    (w_, length) => {
      assertStrictEquals(w_, w);
      assertStrictEquals(length, 3);
    },
    (p_) => p_.writeSync(Uint8Array.of(0x12, 0x34, 0x56)),
  );
  await w.flush();
  assertEquals(p.bytes(), Uint8Array.of(0x12, 0x34, 0x56));
});

Deno.test("writePacketSync", { permissions: "none" }, () => {
  const p = new Buffer();
  writePacketSync(
    p,
    (p_, length) => {
      assertStrictEquals(p_, p);
      assertStrictEquals(length, 3);
    },
    (p_) => p_.writeSync(Uint8Array.of(0x12, 0x34, 0x56)),
  );
  assertEquals(p.bytes(), Uint8Array.of(0x12, 0x34, 0x56));
});

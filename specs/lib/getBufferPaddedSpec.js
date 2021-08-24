"use strict";
const getBufferPadded = require("../../lib/getBufferPadded");

describe("getBufferPadded", () => {
  it("gets buffer padded to 8 bytes", () => {
    let buffer = Buffer.alloc(0);
    let bufferPadded = getBufferPadded(buffer);
    expect(bufferPadded.length).toBe(0);

    buffer = Buffer.from([1]);
    bufferPadded = getBufferPadded(buffer);
    expect(bufferPadded.length).toBe(8);
    expect(bufferPadded.readUInt8(0)).toBe(1);
    expect(bufferPadded.readUInt8(1)).toBe(0);
    expect(bufferPadded.readUInt8(2)).toBe(0);
    expect(bufferPadded.readUInt8(3)).toBe(0);
    expect(bufferPadded.readUInt8(4)).toBe(0);
    expect(bufferPadded.readUInt8(5)).toBe(0);
    expect(bufferPadded.readUInt8(6)).toBe(0);
    expect(bufferPadded.readUInt8(7)).toBe(0);

    // Does not allocate a new buffer when buffer length is already aligned to 8 bytes
    buffer = Buffer.alloc(8);
    bufferPadded = getBufferPadded(buffer);
    expect(bufferPadded).toBe(buffer);

    buffer = Buffer.alloc(70);
    bufferPadded = getBufferPadded(buffer);
    expect(bufferPadded.length).toBe(72);
  });
});

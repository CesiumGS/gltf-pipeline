"use strict";
const getJsonBufferPadded = require("../../lib/getJsonBufferPadded");

describe("getJsonBufferPadded", () => {
  it("get json buffer padded to 8 bytes", () => {
    const gltf = {
      asset: {
        version: "2.0",
      },
    };
    const string = JSON.stringify(gltf);
    expect(string.length).toBe(27);
    const bufferPadded = getJsonBufferPadded(gltf);
    expect(bufferPadded.length).toBe(32);
    expect(bufferPadded.readUInt8(27)).toBe(32); // Space
    expect(bufferPadded.readUInt8(28)).toBe(32);
    expect(bufferPadded.readUInt8(29)).toBe(32);
    expect(bufferPadded.readUInt8(30)).toBe(32);
    expect(bufferPadded.readUInt8(31)).toBe(32);
  });
});

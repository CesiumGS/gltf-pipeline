"use strict";
const dataUriToBuffer = require("../../lib/dataUriToBuffer");

describe("dataUriToBuffer", () => {
  it("converts base64 data uri to buffer", () => {
    const buffer = Buffer.from([103, 108, 84, 70]);
    const dataUri = `data:application/octet-stream;base64,${buffer.toString(
      "base64",
    )}`;
    expect(dataUriToBuffer(dataUri)).toEqual(buffer);
  });

  it("converts utf8 data uri to buffer", () => {
    const buffer = Buffer.from([103, 108, 84, 70]);
    const dataUri = `data:text/plain;charset=utf-8,${buffer.toString("utf8")}`;
    expect(dataUriToBuffer(dataUri)).toEqual(buffer);
  });
});

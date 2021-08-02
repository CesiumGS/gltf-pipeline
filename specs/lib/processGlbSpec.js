"use strict";
const fsExtra = require("fs-extra");
const processGlb = require("../../lib/processGlb");

const glbPath = "specs/data/2.0/box-textured-binary/box-textured-binary.glb";

describe("processGlb", () => {
  it("processGlb", async () => {
    spyOn(console, "log");
    const glb = fsExtra.readFileSync(glbPath);
    const options = {
      separate: true,
      stats: true,
    };
    const results = await processGlb(glb, options);
    expect(Buffer.isBuffer(results.glb)).toBe(true);
    expect(results.separateResources).toBeDefined();
    expect(console.log).toHaveBeenCalled();
  });
});

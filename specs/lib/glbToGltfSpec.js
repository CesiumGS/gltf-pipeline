"use strict";
const fsExtra = require("fs-extra");
const glbToGltf = require("../../lib/glbToGltf");

const glbPath = "specs/data/2.0/box-textured-binary/box-textured-binary.glb";

describe("glbToGltf", () => {
  it("glbToGltf", async () => {
    spyOn(console, "log");
    const glb = fsExtra.readFileSync(glbPath);
    const options = {
      separate: true,
      stats: true,
    };
    const results = await glbToGltf(glb, options);
    expect(results.gltf).toBeDefined();
    expect(results.separateResources).toBeDefined();
    expect(results.gltf.buffers.length).toBe(1);
    expect(console.log).toHaveBeenCalled();
  });
});

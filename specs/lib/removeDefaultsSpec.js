"use strict";
const removeDefaults = require("../../lib/removeDefaults");

describe("removeDefaults", () => {
  it("removeDefaults", () => {
    const gltf = {
      nodes: [
        {
          matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        },
        {
          matrix: [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        },
      ],
      accessors: [
        {
          bufferView: 0,
          normalized: false,
        },
      ],
    };
    removeDefaults(gltf);
    expect(gltf.nodes[0].matrix).toBeUndefined();
    expect(gltf.nodes[1].matrix).toBeDefined();
    expect(gltf.accessors[0].normalized).toBeUndefined();
  });
});

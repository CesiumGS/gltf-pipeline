"use strict";
const getStatistics = require("../../lib/getStatistics");

describe("getStatistics", () => {
  const gltf = {
    accessors: [
      {
        componentType: 5123,
        type: "SCALAR",
        count: 1,
      },
      {
        componentType: 5123,
        type: "SCALAR",
        count: 2,
      },
      {
        componentType: 5123,
        type: "SCALAR",
        count: 6,
      },
      {
        componentType: 5126,
        type: "VEC3",
        count: 6,
      },
    ],
    buffers: [
      {
        byteLength: 140,
      },
      {
        byteLength: 120,
        uri: "buffer.bin",
      },
    ],
    images: [
      {
        uri: "image.png",
      },
      {
        uri: "data:image/png;",
      },
      {
        uri: "image2.png",
      },
    ],
    meshes: [
      {
        primitives: [
          {
            indices: 0,
            mode: 0, // POINTS
          },
          {
            indices: 1,
            mode: 1, // LINES
          },
          {
            attributes: {
              POSITION: 3,
            },
          },
        ],
      },
      {
        primitives: [
          {
            indices: 2,
            mode: 4, // TRIANGLES
          },
        ],
      },
    ],
    materials: [{}, {}],
    animations: [{}, {}, {}],
    nodes: [
      {
        name: "rootNode",
        mesh: 0,
      },
    ],
  };

  it("returns statistics for a gltf", () => {
    const statistics = getStatistics(gltf);
    expect(statistics.buffersByteLength).toEqual(260);
    expect(statistics.numberOfImages).toEqual(3);
    expect(statistics.numberOfExternalRequests).toEqual(3);
    expect(statistics.numberOfDrawCalls).toEqual(4);
    expect(statistics.numberOfRenderedPrimitives).toEqual(6);
    expect(statistics.numberOfNodes).toEqual(1);
    expect(statistics.numberOfMeshes).toEqual(2);
    expect(statistics.numberOfMaterials).toEqual(2);
    expect(statistics.numberOfAnimations).toEqual(3);
  });

  it("returns draw call statistics for a gltf node", () => {
    const statistics = getStatistics(gltf, 0);
    expect(statistics.numberOfDrawCalls).toEqual(3);
    expect(statistics.numberOfRenderedPrimitives).toEqual(4);
  });
});

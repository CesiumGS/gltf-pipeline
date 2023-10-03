"use strict";
const Cesium = require("cesium");
const readAccessorPacked = require("../../lib/readAccessorPacked");
const readResources = require("../../lib/readResources");
const splitPrimitives = require("../../lib/splitPrimitives");

const clone = Cesium.clone;
const WebGLConstants = Cesium.WebGLConstants;

describe("splitPrimitives", () => {
  it("splits primitives that reference different indices within the same mesh", async () => {
    // A rectangle split into two quads.
    // A second mesh contains a primitive that is a duplicate of the first quad.
    const indices = [0, 1, 2, 0, 2, 3, 1, 4, 5, 1, 5, 2];
    const positions = [
      0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0,
      1.0, 1.0, 0.0,
    ];
    const normals = [
      -1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
    ];
    const target0Positions = [
      0.0, 0.0, 0.0, 0.25, 0.0, 0.0, 0.25, 0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0,
      0.0, 0.5, 0.5, 0.0,
    ];
    const target0Normals = [
      -0.5, 0.0, 0.0, 0.0, -0.5, 0.0, 0.0, 0.5, 0.0, -0.5, 0.0, 0.0, 0.5, 0.0,
      0.0, 0.5, 0.0, 0.0,
    ];
    const target1Positions = [
      0.0, 0.0, 0.0, 0.125, 0.0, 0.0, 0.125, 0.25, 0.0, 0.0, 0.25, 0.0, 0.25,
      0.0, 0.0, 0.25, 0.25, 0.0,
    ];
    const target1Normals = [
      -0.25, 0.0, 0.0, 0.0, -0.25, 0.0, 0.0, 0.25, 0.0, -0.25, 0.0, 0.0, 0.25,
      0.0, 0.0, 0.25, 0.0, 0.0,
    ];

    const source = Buffer.concat([
      Buffer.from(new Uint16Array(indices).buffer),
      Buffer.from(new Float32Array(positions).buffer),
      Buffer.from(new Float32Array(normals).buffer),
      Buffer.from(new Float32Array(target0Positions).buffer),
      Buffer.from(new Float32Array(target0Normals).buffer),
      Buffer.from(new Float32Array(target1Positions).buffer),
      Buffer.from(new Float32Array(target1Normals).buffer),
    ]);

    const dataUri = `data:application/octet-stream;base64,${source.toString(
      "base64",
    )}`;

    const expectedIndices = [
      [0, 1, 2, 0, 2, 3],
      [0, 1, 2, 0, 2, 3],
    ];
    const expectedPositions = [
      [0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0],
      [0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.5, 1.0, 0.0],
    ];
    const expectedNormals = [
      [-1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0, -1.0, 0.0, 0.0],
      [0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0],
    ];
    const expectedTarget0Positions = [
      [0.0, 0.0, 0.0, 0.25, 0.0, 0.0, 0.25, 0.5, 0.0, 0.0, 0.5, 0.0],
      [0.25, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.25, 0.5, 0.0],
    ];
    const expectedTarget0Normals = [
      [-0.5, 0.0, 0.0, 0.0, -0.5, 0.0, 0.0, 0.5, 0.0, -0.5, 0.0, 0.0],
      [0.0, -0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0],
    ];
    const expectedTarget1Positions = [
      [0.0, 0.0, 0.0, 0.125, 0.0, 0.0, 0.125, 0.25, 0.0, 0.0, 0.25, 0.0],
      [0.125, 0.0, 0.0, 0.25, 0.0, 0.0, 0.25, 0.25, 0.0, 0.125, 0.25, 0.0],
    ];
    const expectedTarget1Normals = [
      [-0.25, 0.0, 0.0, 0.0, -0.25, 0.0, 0.0, 0.25, 0.0, -0.25, 0.0, 0.0],
      [0.0, -0.25, 0.0, 0.25, 0.0, 0.0, 0.25, 0.0, 0.0, 0.0, 0.25, 0.0],
    ];

    const primitiveTemplate = {
      attributes: {
        POSITION: 2,
        NORMAL: 3,
      },
      indices: 0,
      material: 0,
      targets: [
        {
          POSITION: 4,
          NORMAL: 5,
        },
        {
          POSITION: 6,
          NORMAL: 7,
        },
      ],
    };

    let primitive0 = clone(primitiveTemplate, true);
    let primitive1 = clone(primitiveTemplate, true);
    let primitive2 = clone(primitiveTemplate, true);

    primitive1.indices = 1;

    const gltf = {
      buffers: [
        {
          uri: dataUri,
        },
      ],
      bufferViews: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: 24,
        },
        {
          buffer: 0,
          byteOffset: 24,
          byteLength: 432,
          byteStride: 12,
        },
      ],
      accessors: [
        {
          bufferView: 0,
          byteOffset: 0,
          componentType: WebGLConstants.UNSIGNED_SHORT,
          count: 6,
          type: "SCALAR",
        },
        {
          bufferView: 0,
          byteOffset: 12,
          componentType: WebGLConstants.UNSIGNED_SHORT,
          count: 6,
          type: "SCALAR",
        },
        {
          bufferView: 1,
          byteOffset: 0,
          componentType: WebGLConstants.FLOAT,
          count: 6,
          type: "VEC3",
        },
        {
          bufferView: 1,
          byteOffset: 72,
          componentType: WebGLConstants.FLOAT,
          count: 6,
          type: "VEC3",
        },
        {
          bufferView: 1,
          byteOffset: 144,
          componentType: WebGLConstants.FLOAT,
          count: 6,
          type: "VEC3",
        },
        {
          bufferView: 1,
          byteOffset: 216,
          componentType: WebGLConstants.FLOAT,
          count: 6,
          type: "VEC3",
        },
        {
          bufferView: 1,
          byteOffset: 288,
          componentType: WebGLConstants.FLOAT,
          count: 6,
          type: "VEC3",
        },
        {
          bufferView: 1,
          byteOffset: 360,
          componentType: WebGLConstants.FLOAT,
          count: 6,
          type: "VEC3",
        },
      ],
      meshes: [
        {
          primitives: [primitive0, primitive1],
        },
        {
          primitives: [primitive2],
        },
      ],
    };

    await readResources(gltf);
    primitive0 = gltf.meshes[0].primitives[0];
    primitive1 = gltf.meshes[0].primitives[1];
    primitive2 = gltf.meshes[1].primitives[0];

    expect(primitive0.attributes).toEqual(primitive1.attributes);
    expect(primitive0.targets).toEqual(primitive1.targets);
    expect(primitive0.indices).not.toBe(primitive1.indices);
    expect(primitive0).toEqual(primitive2);

    splitPrimitives(gltf);

    expect(primitive0.attributes).not.toEqual(primitive1.attributes);
    expect(primitive0.targets).not.toEqual(primitive1.targets);
    expect(primitive0.indices).not.toBe(primitive1.indices);
    expect(primitive0).toEqual(primitive2);

    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive0.indices]),
    ).toEqual(expectedIndices[0]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive0.attributes.POSITION]),
    ).toEqual(expectedPositions[0]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive0.attributes.NORMAL]),
    ).toEqual(expectedNormals[0]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive0.targets[0].POSITION]),
    ).toEqual(expectedTarget0Positions[0]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive0.targets[0].NORMAL]),
    ).toEqual(expectedTarget0Normals[0]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive0.targets[1].POSITION]),
    ).toEqual(expectedTarget1Positions[0]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive0.targets[1].NORMAL]),
    ).toEqual(expectedTarget1Normals[0]);

    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive1.indices]),
    ).toEqual(expectedIndices[1]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive1.attributes.POSITION]),
    ).toEqual(expectedPositions[1]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive1.attributes.NORMAL]),
    ).toEqual(expectedNormals[1]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive1.targets[0].POSITION]),
    ).toEqual(expectedTarget0Positions[1]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive1.targets[0].NORMAL]),
    ).toEqual(expectedTarget0Normals[1]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive1.targets[1].POSITION]),
    ).toEqual(expectedTarget1Positions[1]);
    expect(
      readAccessorPacked(gltf, gltf.accessors[primitive1.targets[1].NORMAL]),
    ).toEqual(expectedTarget1Normals[1]);
  });
});

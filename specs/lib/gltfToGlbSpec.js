"use strict";
const fsExtra = require("fs-extra");
const path = require("path");

const gltfToGlb = require("../../lib/gltfToGlb");
const parseGlb = require("../../lib/parseGlb");

const gltfPath =
  "specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf";
const gltfMeshoptFallbackPath =
  "specs/data/2.0/extensions/EXT_meshopt_compression/meshopt-fallback/meshopt-fallback.gltf";

describe("gltfToGlb", () => {
  it("gltfToGlb", async () => {
    spyOn(console, "log");
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      separateTextures: true,
      stats: true,
    };
    const results = await gltfToGlb(gltf, options);
    const glb = results.glb;
    const separateResources = results.separateResources;
    expect(Buffer.isBuffer(glb)).toBe(true);
    expect(Object.keys(separateResources).length).toBe(1);
    expect(console.log).toHaveBeenCalled();

    // Header + JSON header + JSON content + binary header + binary content
    const glbLength = glb.readUInt32LE(8);
    const jsonChunkLength = glb.readUInt32LE(12);
    const binaryChunkLength = glb.readUInt32LE(12 + 8 + jsonChunkLength);
    const expectedLength = 12 + 8 + jsonChunkLength + 8 + binaryChunkLength;
    expect(glbLength).toBe(expectedLength);
    expect(glb.length).toBe(expectedLength);
  });

  it("gltfToGlb with separate resources", async () => {
    spyOn(console, "log");
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      separate: true,
      stats: true,
    };
    const results = await gltfToGlb(gltf, options);
    const glb = results.glb;
    const separateResources = results.separateResources;
    expect(Buffer.isBuffer(glb)).toBe(true);
    expect(Object.keys(separateResources).length).toBe(2);
    expect(console.log).toHaveBeenCalled();

    // Header + JSON header + JSON content. No binary header or content.
    const glbLength = glb.readUInt32LE(8);
    const jsonChunkLength = glb.readUInt32LE(12);
    const expectedLength = 12 + 8 + jsonChunkLength;
    expect(glbLength).toBe(expectedLength);
    expect(glb.length).toBe(expectedLength);
  });

  it("gltfToGlb processes glTF with EXT_meshopt_compression extension.", async () => {
    const gltf = fsExtra.readJsonSync(gltfMeshoptFallbackPath);
    const options = {
      resourceDirectory: path.dirname(gltfMeshoptFallbackPath),
    };
    const results = await gltfToGlb(gltf, options);
    expect(results.glb).toBeDefined();

    const processedGltf = parseGlb(results.glb);

    expect(processedGltf).toBeDefined();
    expect(processedGltf.buffers.length).toBe(1);

    const buffer0 = processedGltf.buffers[0];

    const bufferView0 = processedGltf.bufferViews[0];
    const bufferView1 = processedGltf.bufferViews[1];
    const bufferView2 = processedGltf.bufferViews[2];

    const meshoptObject0 = bufferView0.extensions.EXT_meshopt_compression;
    const meshoptObject1 = bufferView1.extensions.EXT_meshopt_compression;
    const meshoptObject2 = bufferView2.extensions.EXT_meshopt_compression;

    expect(buffer0.byteLength).toBe(1432);
    expect(buffer0.uri).not.toBeDefined();

    expect(bufferView0.buffer).toBe(0);
    expect(bufferView0.byteOffset).toBe(0);
    expect(bufferView0.byteLength).toBe(400);
    expect(meshoptObject0.buffer).toBe(0);
    expect(meshoptObject0.byteOffset).toBe(400);
    expect(meshoptObject0.byteLength).toBe(265);

    expect(bufferView1.buffer).toBe(0);
    expect(bufferView1.byteOffset).toBe(672);
    expect(bufferView1.byteLength).toBe(200);
    expect(meshoptObject1.buffer).toBe(0);
    expect(meshoptObject1.byteOffset).toBe(872);
    expect(meshoptObject1.byteLength).toBe(117);

    expect(bufferView2.buffer).toBe(0);
    expect(bufferView2.byteOffset).toBe(992);
    expect(bufferView2.byteLength).toBe(360);
    expect(meshoptObject2.buffer).toBe(0);
    expect(meshoptObject2.byteOffset).toBe(1352);
    expect(meshoptObject2.byteLength).toBe(78);
  });

  it("gltfToGlb processes glTF with EXT_meshopt_compression extension with separate resources.", async () => {
    const gltf = fsExtra.readJsonSync(gltfMeshoptFallbackPath);
    const options = {
      separate: true,
      resourceDirectory: path.dirname(gltfMeshoptFallbackPath),
    };
    const results = await gltfToGlb(gltf, options);
    expect(results.glb).toBeDefined();

    const processedGltf = parseGlb(results.glb);

    expect(processedGltf).toBeDefined();
    expect(processedGltf.buffers.length).toBe(2);

    const buffer0 = processedGltf.buffers[0];
    const buffer1 = processedGltf.buffers[1];

    const bufferView0 = gltf.bufferViews[0];
    const bufferView1 = gltf.bufferViews[1];
    const bufferView2 = gltf.bufferViews[2];

    const meshoptObject0 = bufferView0.extensions.EXT_meshopt_compression;
    const meshoptObject1 = bufferView1.extensions.EXT_meshopt_compression;
    const meshoptObject2 = bufferView2.extensions.EXT_meshopt_compression;

    expect(buffer0.byteLength).toBe(960);
    expect(buffer0.uri).toBe("meshopt-fallback-meshopt-fallback-1.bin");
    expect(buffer1.byteLength).toBe(472);
    expect(buffer1.uri).toBe("meshopt-fallback.bin");

    expect(bufferView0.buffer).toBe(0);
    expect(bufferView0.byteOffset).toBe(0);
    expect(bufferView0.byteLength).toBe(400);
    expect(meshoptObject0.buffer).toBe(1);
    expect(meshoptObject0.byteOffset).toBe(0);
    expect(meshoptObject0.byteLength).toBe(265);

    expect(bufferView1.buffer).toBe(0);
    expect(bufferView1.byteOffset).toBe(400);
    expect(bufferView1.byteLength).toBe(200);
    expect(meshoptObject1.buffer).toBe(1);
    expect(meshoptObject1.byteOffset).toBe(272);
    expect(meshoptObject1.byteLength).toBe(117);

    expect(bufferView2.buffer).toBe(0);
    expect(bufferView2.byteOffset).toBe(600);
    expect(bufferView2.byteLength).toBe(360);
    expect(meshoptObject2.buffer).toBe(1);
    expect(meshoptObject2.byteOffset).toBe(392);
    expect(meshoptObject2.byteLength).toBe(78);
  });
});

"use strict";
const Cesium = require("cesium");
const fsExtra = require("fs-extra");
const path = require("path");
const ForEach = require("../../lib/ForEach");
const parseGlb = require("../../lib/parseGlb");
const readResources = require("../../lib/readResources");

const RuntimeError = Cesium.RuntimeError;

const boxTexturedSeparate1Path =
  "specs/data/1.0/box-textured-separate/box-textured-separate.gltf";
const boxTexturedBinarySeparate1Path =
  "specs/data/1.0/box-textured-binary-separate/box-textured-binary-separate.glb";
const boxTexturedBinary1Path =
  "specs/data/1.0/box-textured-binary/box-textured-binary.glb";
const boxTexturedEmbedded1Path =
  "specs/data/1.0/box-textured-embedded/box-textured-embedded.gltf";
const boxTexturedSeparate2Path =
  "specs/data/2.0/box-textured-separate/box-textured-separate.gltf";
const boxTexturedBinarySeparate2Path =
  "specs/data/2.0/box-textured-binary-separate/box-textured-binary-separate.glb";
const boxTexturedBinary2Path =
  "specs/data/2.0/box-textured-binary/box-textured-binary.glb";
const boxTexturedEmbedded2Path =
  "specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf";

function readGltf(gltfPath, binary) {
  if (binary) {
    const glb = fsExtra.readFileSync(gltfPath);
    return parseGlb(glb);
  }
  return fsExtra.readJsonSync(gltfPath);
}

function checkPaths(object, resourceDirectory) {
  const pipelineExtras = object.extras._pipeline;
  const absolutePath = pipelineExtras.absolutePath;
  const relativePath = pipelineExtras.relativePath;
  expect(path.basename(relativePath)).toBe(relativePath);
  expect(absolutePath).toBe(path.join(resourceDirectory, relativePath));
  expect(object.name).toBe(
    path.basename(relativePath, path.extname(relativePath)),
  );
}

async function readsResources(gltfPath, binary, separate) {
  const gltf = readGltf(gltfPath, binary);
  const resourceDirectory = path.resolve(path.dirname(gltfPath));
  const options = {
    resourceDirectory: resourceDirectory,
  };
  await readResources(gltf, options);
  ForEach.shader(gltf, (shader) => {
    const shaderText = shader.extras._pipeline.source;
    expect(typeof shaderText === "string").toBe(true);
    expect(shaderText.length).toBeGreaterThan(0);
    expect(shader.uri).toBeUndefined();
    if (separate) {
      checkPaths(shader, resourceDirectory);
    }
  });
  ForEach.image(gltf, (image) => {
    const imageSource = image.extras._pipeline.source;
    expect(Buffer.isBuffer(imageSource)).toBe(true);
    expect(image.uri).toBeUndefined();
    if (separate) {
      checkPaths(image, resourceDirectory);
    }
  });
  ForEach.buffer(gltf, (buffer) => {
    const bufferSource = buffer.extras._pipeline.source;
    expect(Buffer.isBuffer(bufferSource)).toBe(true);
    expect(buffer.uri).toBeUndefined();
    if (separate && !binary) {
      checkPaths(buffer, resourceDirectory);
    }
  });
}

describe("readResources", () => {
  it("reads separate resources from 1.0 model", async () => {
    await readsResources(boxTexturedSeparate1Path, false, true);
  });

  it("reads separate resources from 1.0 glb", async () => {
    await readsResources(boxTexturedBinarySeparate1Path, true, true);
  });

  it("reads embedded resources from 1.0 model", async () => {
    await readsResources(boxTexturedEmbedded1Path, false, false);
  });

  it("reads resources from 1.0 glb", async () => {
    await readsResources(boxTexturedBinary1Path, true, false);
  });

  it("reads separate resources from model", async () => {
    await readsResources(boxTexturedSeparate2Path, false, true);
  });

  it("reads separate resources from glb", async () => {
    await readsResources(boxTexturedBinarySeparate2Path, true, true);
  });

  it("reads embedded resources from model", async () => {
    await readsResources(boxTexturedEmbedded2Path, false, false);
  });

  it("reads resources from glb", async () => {
    await readsResources(boxTexturedBinary2Path, true, false);
  });

  it("rejects if gltf contains separate resources but no resource directory is supplied", async () => {
    const gltf = readGltf(boxTexturedSeparate2Path);

    let thrownError;
    try {
      await readResources(gltf);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toEqual(
      new RuntimeError(
        "glTF model references separate files but no resourceDirectory is supplied",
      ),
    );
  });
});

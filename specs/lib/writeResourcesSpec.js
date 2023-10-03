"use strict";
const fsExtra = require("fs-extra");
const path = require("path");
const dataUriToBuffer = require("../../lib/dataUriToBuffer");
const ForEach = require("../../lib/ForEach");
const readResources = require("../../lib/readResources");
const writeResources = require("../../lib/writeResources");

const Cesium = require("cesium");
const CesiumMath = Cesium.Math;

const gltfPath =
  "specs/data/2.0/box-techniques-embedded/box-techniques-embedded.gltf";
const gltfWebpPath =
  "specs/data/2.0/extensions/EXT_texture_webp/box-textured-embedded/box-textured-embedded.gltf";
const gltfWebpSeparatePath =
  "specs/data/2.0/extensions/EXT_texture_webp/box-textured-separate/box-textured-with-fallback.gltf";
const gltfSharedImageReferencesPath =
  "specs/data/2.0/box-shared-image-references/box-shared-image-references.gltf";
const gltfSharedImageReferencesSeparatePath =
  "specs/data/2.0/box-shared-image-references-separate/box-shared-image-references-separate.gltf";
let gltf;
let gltfWebp;
let gltfWebpSeparate;
let gltfSharedImageReferences;
let gltfSharedImageReferencesSeparate;

describe("writeResources", () => {
  beforeEach(async () => {
    gltf = fsExtra.readJsonSync(gltfPath);
    gltfWebp = fsExtra.readJsonSync(gltfWebpPath);
    gltfWebpSeparate = fsExtra.readJsonSync(gltfWebpSeparatePath);
    gltfSharedImageReferences = fsExtra.readJsonSync(
      gltfSharedImageReferencesPath,
    );
    gltfSharedImageReferencesSeparate = fsExtra.readJsonSync(
      gltfSharedImageReferencesSeparatePath,
    );

    await readResources(gltf);
    await readResources(gltfWebp);
    await readResources(gltfWebpSeparate, {
      resourceDirectory: path.dirname(gltfWebpSeparatePath),
    });
    await readResources(gltfSharedImageReferences);
    await readResources(gltfSharedImageReferencesSeparate, {
      resourceDirectory: path.dirname(gltfSharedImageReferencesSeparatePath),
    });
  });

  it("writes embedded resources", () => {
    writeResources(gltf);
    ForEach.image(gltf, (image) => {
      expect(image.bufferView).toBeDefined();
      expect(image.uri).toBeUndefined();
    });
    expect(gltf.buffers.length).toBe(1);
    const buffer = gltf.buffers[0];
    const contents = dataUriToBuffer(buffer.uri);
    expect(contents.byteLength).toBe(buffer.byteLength);
  });

  it("writes resources as files", () => {
    const separateResources = {};
    const options = {
      separateBuffers: true,
      separateTextures: true,
      separateShaders: true,
      separateResources: separateResources,
    };
    const originalBufferViewsLength = gltf.bufferViews.length;
    const originalByteLength = gltf.buffers[0].byteLength;
    writeResources(gltf, options);
    ForEach.image(gltf, (image) => {
      expect(image.bufferView).toBeUndefined();
      expect(image.uri.indexOf(".png")).toBeGreaterThan(-1);
    });

    ForEach.shader(gltf, (shader) => {
      expect(shader.bufferView).toBeUndefined();
      expect(shader.uri.indexOf(".glsl")).toBeGreaterThan(-1);
    });

    expect(gltf.buffers.length).toBe(1);
    const buffer = gltf.buffers[0];
    expect(buffer.uri.indexOf(".bin")).toBeGreaterThan(-1);
    expect(Object.keys(separateResources).length).toBe(4);
    expect(Buffer.isBuffer(separateResources["buffer.bin"]));
    expect(Buffer.isBuffer(separateResources["image0.png"]));
    expect(gltf.bufferViews.length).toBeLessThan(originalBufferViewsLength);
    expect(buffer.byteLength).toBeLessThanOrEqual(originalByteLength);
  });

  it("writes resources as files with object names", () => {
    const separateResources = {};
    const options = {
      separateBuffers: true,
      separateTextures: true,
      separateShaders: true,
      separateResources: separateResources,
    };
    gltf.buffers[0].name = "my-buffer";
    gltf.images[0].name = "my-image";
    gltf.extensions.KHR_techniques_webgl.shaders[0].name = "my-shader";
    writeResources(gltf, options);
    expect(gltf.buffers[0].uri).toBe("my-buffer.bin");
    expect(gltf.images[0].uri).toBe("my-image.png");
    expect(gltf.extensions.KHR_techniques_webgl.shaders[0].uri).toBe(
      "my-shader.glsl",
    );
  });

  it("writes resources as files with gltf name when resources aren't named", () => {
    const separateResources = {};
    const options = {
      name: "my-gltf",
      separateBuffers: true,
      separateTextures: true,
      separateShaders: true,
      separateResources: separateResources,
    };

    delete gltf.buffers[0].name;
    delete gltf.images[0].name;
    delete gltf.extensions.KHR_techniques_webgl.programs[0].name;
    delete gltf.extensions.KHR_techniques_webgl.shaders[0].name;

    writeResources(gltf, options);
    expect(gltf.buffers[0].uri).toBe("my-gltf.bin");
    expect(gltf.images[0].uri).toBe("my-gltf0.png");
    expect(gltf.extensions.KHR_techniques_webgl.shaders[0].uri).toBe(
      "my-gltfFS0.glsl",
    );
  });

  it("writes resources as data uris", () => {
    const options = {
      dataUris: true,
    };
    const originalBufferViewsLength = gltf.bufferViews.length;
    const originalByteLength = gltf.buffers[0].byteLength;
    writeResources(gltf, options);
    const buffer = gltf.buffers[0];
    expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));

    ForEach.image(gltf, (image) => {
      expect(image.bufferView).toBeUndefined();
      expect(Buffer.isBuffer(dataUriToBuffer(image.uri)));
    });

    ForEach.shader(gltf, (shader) => {
      expect(shader.bufferView).toBeUndefined();
      expect(Buffer.isBuffer(dataUriToBuffer(shader.uri)));
    });

    expect(gltf.bufferViews.length).toBeLessThan(originalBufferViewsLength);
    expect(buffer.byteLength).toBeLessThanOrEqual(originalByteLength);
  });

  it("writes resources as bufferViews", () => {
    const originalBufferViewsLength = gltf.bufferViews.length;
    const originalByteLength = gltf.buffers[0].byteLength;
    writeResources(gltf);
    const buffer = gltf.buffers[0];
    expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));

    let bufferViewByteLength = 0;
    let bufferView;
    let sourceByteLength;
    ForEach.image(gltf, (image) => {
      expect(image.bufferView).toBeDefined();
      bufferView = gltf.bufferViews[image.bufferView];
      expect(bufferView).toBeDefined();
      sourceByteLength = image.extras._pipeline.source.byteLength;
      expect(sourceByteLength).toEqual(bufferView.byteLength);

      bufferViewByteLength += bufferView.byteLength;
    });

    ForEach.shader(gltf, (shader) => {
      expect(shader.bufferView).toBeDefined();
      bufferView = gltf.bufferViews[shader.bufferView];
      expect(bufferView).toBeDefined();
      sourceByteLength = Buffer.byteLength(shader.extras._pipeline.source);
      expect(sourceByteLength).toEqual(bufferView.byteLength);

      bufferViewByteLength += bufferView.byteLength;
    });

    expect(gltf.bufferViews.length).toBe(originalBufferViewsLength);
    expect(
      CesiumMath.equalsEpsilon(
        buffer.byteLength,
        originalByteLength + bufferViewByteLength,
        8,
      ),
    ).toBe(true);
  });

  it("preserves bufferViews for WebP and fallback image", () => {
    const originalBufferViewsLength = gltfWebp.bufferViews.length;
    writeResources(gltfWebp);
    // This glTF has all the buffer views already defined for the extension, so no change is expected.
    expect(gltfWebp.bufferViews.length).toBe(originalBufferViewsLength);
  });

  it("creates new bufferViews for WebP", () => {
    const originalBufferViewsLength = gltfWebpSeparate.bufferViews.length;
    writeResources(gltfWebpSeparate);
    // There should be a new bufferView for the WebP, and one for the fallback image.
    expect(gltfWebpSeparate.bufferViews.length).toBe(
      originalBufferViewsLength + 2,
    );
  });

  it("does not duplicate multiple references to the same buffer view", async () => {
    const originalBufferViewsLength =
      gltfSharedImageReferences.bufferViews.length;
    writeResources(gltfSharedImageReferences);
    expect(gltfSharedImageReferences.bufferViews.length).toBe(
      originalBufferViewsLength,
    );
    expect(gltfSharedImageReferences.images[0].bufferView).toBe(
      gltfSharedImageReferences.images[1].bufferView,
    );
  });

  it("does not duplicate multiple references to the same buffer view when saving separate resources", async () => {
    const separateResources = {};
    const options = {
      separateBuffers: true,
      separateTextures: true,
      separateShaders: true,
      separateResources: separateResources,
    };
    writeResources(gltfSharedImageReferences, options);
    expect(gltfSharedImageReferences.images[0].uri).toBeDefined();
    expect(gltfSharedImageReferences.images[0].uri).toBe(
      gltfSharedImageReferences.images[1].uri,
    );
  });

  it("does not duplicate multiple references to the same uri", async () => {
    writeResources(gltfSharedImageReferencesSeparate);
    expect(
      gltfSharedImageReferencesSeparate.images[0].bufferView,
    ).toBeDefined();
    expect(gltfSharedImageReferencesSeparate.images[0].bufferView).toBe(
      gltfSharedImageReferencesSeparate.images[1].bufferView,
    );
  });

  it("does not duplicate multiple references to the same uri when saving separate resources", async () => {
    const separateResources = {};
    const options = {
      separateBuffers: true,
      separateTextures: true,
      separateShaders: true,
      separateResources: separateResources,
    };
    writeResources(gltfSharedImageReferencesSeparate, options);
    expect(gltfSharedImageReferencesSeparate.images[0].uri).toBeDefined();
    expect(gltfSharedImageReferencesSeparate.images[0].uri).toBe(
      gltfSharedImageReferencesSeparate.images[1].uri,
    );
  });
});

"use strict";
const fsExtra = require("fs-extra");
const path = require("path");
const usesExtension = require("../../lib/usesExtension");
const processGltf = require("../../lib/processGltf");

const gltfPath =
  "specs/data/2.0/box-techniques-embedded/box-techniques-embedded.gltf";
const gltfSeparatePath =
  "specs/data/2.0/box-techniques-separate/box-techniques-separate.gltf";
const gltfWebpPath =
  "specs/data/2.0/extensions/EXT_texture_webp/box-textured-embedded/box-textured-embedded.gltf";
const gltfWebpSeparatePath =
  "specs/data/2.0/extensions/EXT_texture_webp/box-textured-separate/box-textured-separate.gltf";
const gltfMeshoptFallbackPath =
  "specs/data/2.0/extensions/EXT_meshopt_compression/meshopt-fallback/meshopt-fallback.gltf";
const gltfMeshoptNoFallbackPath =
  "specs/data/2.0/extensions/EXT_meshopt_compression/meshopt-no-fallback/meshopt-no-fallback.gltf";

describe("processGltf", () => {
  it("processes gltf with default options", async () => {
    const gltf = fsExtra.readJsonSync(gltfPath);
    const results = await processGltf(gltf);
    expect(results.gltf).toBeDefined();
  });

  it("uses resource directory", async () => {
    const gltf = fsExtra.readJsonSync(gltfSeparatePath);
    const options = {
      resourceDirectory: path.dirname(gltfSeparatePath),
    };
    const results = await processGltf(gltf, options);
    expect(results.gltf).toBeDefined();
  });

  it("saves separate resources", async () => {
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      separate: true,
      keepLegacyExtensions: true,
    };
    const results = await processGltf(gltf, options);
    expect(results.gltf).toBeDefined();
    expect(Object.keys(results.separateResources).length).toBe(4);
    expect(results.separateResources["Image0001.png"]).toBeDefined();
    expect(
      results.separateResources["CesiumTexturedBoxTest.bin"],
    ).toBeDefined();
    expect(
      results.separateResources["CesiumTexturedBoxTest0FS.glsl"],
    ).toBeDefined();
    expect(
      results.separateResources["CesiumTexturedBoxTest0VS.glsl"],
    ).toBeDefined();
  });

  it("saves separate textures", async () => {
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      separateTextures: true,
    };
    const results = await processGltf(gltf, options);
    expect(results.gltf).toBeDefined();
    expect(Object.keys(results.separateResources).length).toBe(1);
    expect(results.separateResources["Image0001.png"]).toBeDefined();
    expect(results.gltf.buffers[0].uri.indexOf("data") >= 0).toBe(true);
  });

  it("uses name to save separate resources", async () => {
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      separate: true,
      keepLegacyExtensions: true,
      name: "my-model",
    };

    delete gltf.buffers[0].name;
    delete gltf.images[0].name;
    delete gltf.extensions.KHR_techniques_webgl.programs[0].name;
    delete gltf.extensions.KHR_techniques_webgl.shaders[0].name;

    const results = await processGltf(gltf, options);
    expect(results.gltf).toBeDefined();
    expect(results.separateResources["my-model0.png"]).toBeDefined();
    expect(results.separateResources["my-model.bin"]).toBeDefined();
    expect(results.separateResources["my-modelFS0.glsl"]).toBeDefined();
    expect(results.separateResources["my-modelFS0.glsl"]).toBeDefined();
  });

  it("prints stats", async () => {
    spyOn(console, "log");
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      stats: true,
    };
    await processGltf(gltf, options);
    expect(console.log).toHaveBeenCalled();
  });

  it("uses draco compression", async () => {
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      dracoOptions: {
        compressionLevel: 7,
      },
    };
    const results = await processGltf(gltf, options);
    expect(usesExtension(results.gltf, "KHR_draco_mesh_compression")).toBe(
      true,
    );
  });

  it("runs custom stages", async () => {
    spyOn(console, "log");
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      customStages: [
        (gltf) => {
          gltf.meshes[0].name = "new-name";
        },
        (gltf) => {
          console.log(gltf.meshes[0].name);
        },
      ],
    };
    await processGltf(gltf, options);
    expect(console.log).toHaveBeenCalledWith("new-name");
  });

  it("uses logger", async () => {
    let loggedMessages = 0;
    const gltf = fsExtra.readJsonSync(gltfPath);
    const options = {
      stats: true,
      logger: () => {
        loggedMessages++;
      },
    };
    await processGltf(gltf, options);
    expect(loggedMessages).toBe(2);
  });

  it("processes gltf with EXT_texture_webp extension.", async () => {
    const gltf = fsExtra.readJsonSync(gltfWebpSeparatePath);
    const options = {
      resourceDirectory: path.dirname(gltfWebpSeparatePath),
    };
    const results = await processGltf(gltf, options);
    expect(results.gltf).toBeDefined();
    expect(results.gltf.textures[0].extensions.EXT_texture_webp).toBeDefined();

    const imageId = results.gltf.textures[0].extensions.EXT_texture_webp.source;
    expect(results.gltf.images[imageId].mimeType).toBe("image/webp");
  });

  it("processes embedded gltf with EXT_texture_webp extension.", async () => {
    const gltf = fsExtra.readJsonSync(gltfWebpPath);

    const results = await processGltf(gltf);
    expect(results.gltf).toBeDefined();
    expect(results.gltf.textures[0].extensions.EXT_texture_webp).toBeDefined();

    const imageId = results.gltf.textures[0].extensions.EXT_texture_webp.source;
    expect(results.gltf.images[imageId].mimeType).toBe("image/webp");
  });

  it("processes gltf with EXT_meshopt_compression extension that has fallback buffer.", async () => {
    const gltf = fsExtra.readJsonSync(gltfMeshoptFallbackPath);
    const options = {
      resourceDirectory: path.dirname(gltfMeshoptFallbackPath),
    };
    const results = await processGltf(gltf, options);
    const processedGltf = results.gltf;

    expect(processedGltf).toBeDefined();
    expect(processedGltf.buffers.length).toBe(2);

    const buffer0 = processedGltf.buffers[0];
    const buffer1 = processedGltf.buffers[1];

    const bufferView0 = processedGltf.bufferViews[0];
    const bufferView1 = processedGltf.bufferViews[1];
    const bufferView2 = processedGltf.bufferViews[2];

    const meshoptObject0 = bufferView0.extensions.EXT_meshopt_compression;
    const meshoptObject1 = bufferView1.extensions.EXT_meshopt_compression;
    const meshoptObject2 = bufferView2.extensions.EXT_meshopt_compression;

    expect(buffer0.byteLength).toBe(960);
    expect(buffer0.uri).toBeDefined();
    expect(buffer1.byteLength).toBe(472);
    expect(buffer1.uri).toBeDefined();

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

  it("processes gltf with EXT_meshopt_compression extension that doesn't have fallback buffer.", async () => {
    const gltf = fsExtra.readJsonSync(gltfMeshoptNoFallbackPath);
    const options = {
      resourceDirectory: path.dirname(gltfMeshoptNoFallbackPath),
    };
    const results = await processGltf(gltf, options);
    const processedGltf = results.gltf;

    expect(processedGltf).toBeDefined();
    expect(processedGltf.buffers.length).toBe(2);

    const buffer0 = processedGltf.buffers[0];
    const buffer1 = processedGltf.buffers[1];

    const bufferView0 = processedGltf.bufferViews[0];
    const bufferView1 = processedGltf.bufferViews[1];
    const bufferView2 = processedGltf.bufferViews[2];

    const meshoptObject0 = bufferView0.extensions.EXT_meshopt_compression;
    const meshoptObject1 = bufferView1.extensions.EXT_meshopt_compression;
    const meshoptObject2 = bufferView2.extensions.EXT_meshopt_compression;

    expect(buffer0.byteLength).toBe(472);
    expect(buffer0.uri).toBeDefined();
    expect(buffer1.byteLength).toBe(960);
    expect(buffer1.uri).not.toBeDefined();

    expect(bufferView0.buffer).toBe(1);
    expect(bufferView0.byteOffset).toBe(0);
    expect(bufferView0.byteLength).toBe(400);
    expect(meshoptObject0.buffer).toBe(0);
    expect(meshoptObject0.byteOffset).toBe(0);
    expect(meshoptObject0.byteLength).toBe(265);

    expect(bufferView1.buffer).toBe(1);
    expect(bufferView1.byteOffset).toBe(400);
    expect(bufferView1.byteLength).toBe(200);
    expect(meshoptObject1.buffer).toBe(0);
    expect(meshoptObject1.byteOffset).toBe(272);
    expect(meshoptObject1.byteLength).toBe(117);

    expect(bufferView2.buffer).toBe(1);
    expect(bufferView2.byteOffset).toBe(600);
    expect(bufferView2.byteLength).toBe(360);
    expect(meshoptObject2.buffer).toBe(0);
    expect(meshoptObject2.byteOffset).toBe(392);
    expect(meshoptObject2.byteLength).toBe(78);
  });
});

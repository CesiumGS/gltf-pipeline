'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const path = require('path');
const hasExtension = require('../../lib/hasExtension');
const processGltf = require('../../lib/processGltf');

const RuntimeError = Cesium.RuntimeError;

const gltfPath = 'specs/data/2.0/box-techniques-embedded/box-techniques-embedded.gltf';
const gltfSeparatePath = 'specs/data/2.0/box-techniques-separate/box-techniques-separate.gltf';
const gltfWebpPath = 'specs/data/2.0/extensions/EXT_texture_webp/box-textured-embedded/box-textured-embedded.gltf';
const gltfWebpSeparatePath = 'specs/data/2.0/extensions/EXT_texture_webp/box-textured-separate/box-textured-separate.gltf';

describe('processGltf', () => {
    it('processes gltf with default options', async () => {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const results = await processGltf(gltf);
        expect(results.gltf).toBeDefined();
    });

    it('uses resource directory', async () => {
        const gltf = fsExtra.readJsonSync(gltfSeparatePath);
        const options = {
            resourceDirectory: path.dirname(gltfSeparatePath)
        };
        const results = await processGltf(gltf, options);
        expect(results.gltf).toBeDefined();
    });

    it('saves separate resources', async () => {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            separate: true
        };
        const results = await processGltf(gltf, options);
        expect(results.gltf).toBeDefined();
        expect(Object.keys(results.separateResources).length).toBe(4);
        expect(results.separateResources['Image0001.png']).toBeDefined();
        expect(results.separateResources['CesiumTexturedBoxTest.bin']).toBeDefined();
        expect(results.separateResources['CesiumTexturedBoxTest0FS.glsl']).toBeDefined();
        expect(results.separateResources['CesiumTexturedBoxTest0VS.glsl']).toBeDefined();
    });

    it('saves separate textures', async () => {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            separateTextures: true
        };
        const results = await processGltf(gltf, options);
        expect(results.gltf).toBeDefined();
        expect(Object.keys(results.separateResources).length).toBe(1);
        expect(results.separateResources['Image0001.png']).toBeDefined();
        expect(results.gltf.buffers[0].uri.indexOf('data') >= 0).toBe(true);
    });

    it('uses name to save separate resources', async () => {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            separate: true,
            name: 'my-model'
        };

        delete gltf.buffers[0].name;
        delete gltf.images[0].name;
        delete gltf.extensions.KHR_techniques_webgl.programs[0].name;
        delete gltf.extensions.KHR_techniques_webgl.shaders[0].name;

        const results = await processGltf(gltf, options);
        expect(results.gltf).toBeDefined();
        expect(results.separateResources['my-model0.png']).toBeDefined();
        expect(results.separateResources['my-model.bin']).toBeDefined();
        expect(results.separateResources['my-modelFS0.glsl']).toBeDefined();
        expect(results.separateResources['my-modelFS0.glsl']).toBeDefined();
    });

    it('prints stats', async () => {
        spyOn(console, 'log');
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            stats: true
        };
        await processGltf(gltf, options);
        expect(console.log).toHaveBeenCalled();
    });

    it('uses draco compression', async () => {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            dracoOptions: {
                compressionLevel: 7
            }
        };
        const results = await processGltf(gltf, options);
        expect(hasExtension(results.gltf, 'KHR_draco_mesh_compression')).toBe(true);
    });

    it('runs custom stages', async () => {
        spyOn(console, 'log');
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            customStages: [
                (gltf) => {
                    gltf.meshes[0].name = 'new-name';
                },
                (gltf) => {
                    console.log(gltf.meshes[0].name);
                }
            ]
        };
        await processGltf(gltf, options);
        expect(console.log).toHaveBeenCalledWith('new-name');
    });

    it('uses logger', async () => {
        let loggedMessages = 0;
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            stats: true,
            logger: () => {
                loggedMessages++;
            }
        };
        await processGltf(gltf, options);
        expect(loggedMessages).toBe(2);
    });

    it('processes gltf with EXT_texture_webp extension.', async () => {
        const gltf = fsExtra.readJsonSync(gltfWebpSeparatePath);
        const options = {
            resourceDirectory: path.dirname(gltfWebpSeparatePath)
        };
        const results = await processGltf(gltf, options);
        expect(results.gltf).toBeDefined();
        expect(results.gltf.textures[0].extensions.EXT_texture_webp).toBeDefined();

        const imageId = results.gltf.textures[0].extensions.EXT_texture_webp.source;
        expect(results.gltf.images[imageId].mimeType).toBe('image/webp');
    });

    it('processes embedded gltf with EXT_texture_webp extension.', async () => {
        const gltf = fsExtra.readJsonSync(gltfWebpPath);

        const results = await processGltf(gltf);
        expect(results.gltf).toBeDefined();
        expect(results.gltf.textures[0].extensions.EXT_texture_webp).toBeDefined();

        const imageId = results.gltf.textures[0].extensions.EXT_texture_webp.source;
        expect(results.gltf.images[imageId].mimeType).toBe('image/webp');
    });
});

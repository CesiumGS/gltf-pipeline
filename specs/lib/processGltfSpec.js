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

describe('processGltf', function() {
    it('processes gltf with default options', function(done) {
        const gltf = fsExtra.readJsonSync(gltfPath);
        expect(processGltf(gltf)
            .then(function(results) {
                expect(results.gltf).toBeDefined();
            }), done).toResolve();
    });

    it('uses resource directory', function(done) {
        const gltf = fsExtra.readJsonSync(gltfSeparatePath);
        const options = {
            resourceDirectory: path.dirname(gltfSeparatePath)
        };
        expect(processGltf(gltf, options)
            .then(function(results) {
                expect(results.gltf).toBeDefined();
            }), done).toResolve();
    });

    it('saves separate resources', function(done) {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            separate: true
        };
        expect(processGltf(gltf, options)
            .then(function(results) {
                expect(results.gltf).toBeDefined();
                expect(Object.keys(results.separateResources).length).toBe(4);
                expect(results.separateResources['Image0001.png']).toBeDefined();
                expect(results.separateResources['CesiumTexturedBoxTest.bin']).toBeDefined();
                expect(results.separateResources['CesiumTexturedBoxTest0FS.glsl']).toBeDefined();
                expect(results.separateResources['CesiumTexturedBoxTest0VS.glsl']).toBeDefined();
            }), done).toResolve();
    });

    it('saves separate textures', function(done) {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            separateTextures: true
        };
        expect(processGltf(gltf, options)
            .then(function(results) {
                expect(results.gltf).toBeDefined();
                expect(Object.keys(results.separateResources).length).toBe(1);
                expect(results.separateResources['Image0001.png']).toBeDefined();
                expect(results.gltf.buffers[0].uri.indexOf('data') >= 0).toBe(true);
            }), done).toResolve();
    });

    it('uses name to save separate resources', function(done) {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            separate: true,
            name: 'my-model'
        };

        delete gltf.buffers[0].name;
        delete gltf.images[0].name;
        delete gltf.extensions.KHR_techniques_webgl.programs[0].name;
        delete gltf.extensions.KHR_techniques_webgl.shaders[0].name;

        expect(processGltf(gltf, options)
            .then(function(results) {
                expect(results.gltf).toBeDefined();
                expect(results.separateResources['my-model0.png']).toBeDefined();
                expect(results.separateResources['my-model.bin']).toBeDefined();
                expect(results.separateResources['my-modelFS0.glsl']).toBeDefined();
                expect(results.separateResources['my-modelFS0.glsl']).toBeDefined();
            }), done).toResolve();
    });

    it('rejects when loading resource outside of the resource directory when secure is true', function(done) {
        const gltf = fsExtra.readJsonSync(gltfSeparatePath);
        const options = {
            secure: true
        };
        gltf.images[0].uri = '../cesium.png';
        expect(processGltf(gltf, options), done).toRejectWith(RuntimeError);
    });

    it('prints stats', function(done) {
        spyOn(console, 'log');
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            stats: true
        };
        expect(processGltf(gltf, options)
            .then(function() {
                expect(console.log).toHaveBeenCalled();
            }), done).toResolve();
    });

    it('uses draco compression', function(done) {
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            dracoOptions: {
                compressionLevel: 7
            }
        };
        expect(processGltf(gltf, options)
            .then(function(results) {
                expect(hasExtension(results.gltf, 'KHR_draco_mesh_compression')).toBe(true);
            }), done).toResolve();
    });

    it('runs custom stages', function(done) {
        spyOn(console, 'log');
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            customStages: [
                function(gltf) {
                    gltf.meshes[0].name = 'new-name';
                },
                function(gltf) {
                    console.log(gltf.meshes[0].name);
                }
            ]
        };
        expect(processGltf(gltf, options)
            .then(function() {
                expect(console.log).toHaveBeenCalledWith('new-name');
            }), done).toResolve();
    });

    it('uses logger', function(done) {
        let loggedMessages = 0;
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            stats: true,
            logger: function() {
                loggedMessages++;
            }
        };
        expect(processGltf(gltf, options)
            .then(function() {
                expect(loggedMessages).toBe(2);
            }), done).toResolve();
    });

    it('processes gltf with EXT_texture_webp extension.', function(done) {
        const gltf = fsExtra.readJsonSync(gltfWebpSeparatePath);
        const options = {
            resourceDirectory: path.dirname(gltfWebpSeparatePath)
        };
        expect(processGltf(gltf, options)
            .then(function(results) {
                expect(results.gltf).toBeDefined();
                expect(results.gltf.textures[0].extensions.EXT_texture_webp).toBeDefined();

                const imageId = results.gltf.textures[0].extensions.EXT_texture_webp.source;
                expect(results.gltf.images[imageId].mimeType).toBe('image/webp');
            }), done).toResolve();
    });

    it('processes embedded gltf with EXT_texture_webp extension.', function(done) {
        const gltf = fsExtra.readJsonSync(gltfWebpPath);

        expect(processGltf(gltf)
            .then(function(results) {
                expect(results.gltf).toBeDefined();
                expect(results.gltf.textures[0].extensions.EXT_texture_webp).toBeDefined();

                const imageId = results.gltf.textures[0].extensions.EXT_texture_webp.source;
                expect(results.gltf.images[imageId].mimeType).toBe('image/webp');
            }), done).toResolve();
    });
});

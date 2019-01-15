'use strict';
const fsExtra = require('fs-extra');
const path = require('path');
const dataUriToBuffer = require('../../lib/dataUriToBuffer');
const ForEach = require('../../lib/ForEach');
const readResources = require('../../lib/readResources');
const writeResources = require('../../lib/writeResources');

const Cesium = require('cesium');
const CesiumMath = Cesium.Math;

const gltfPath = 'specs/data/2.0/box-techniques-embedded/box-techniques-embedded.gltf';
const gltfWebpPath = 'specs/data/2.0/extensions/box-textured-webp/box-textured-separate.gltf';
let gltf;
let gltfWebp;

describe('writeResources', function() {
    beforeEach(function(done) {
        const gltfLoaded = fsExtra.readJsonSync(gltfPath);
        const gltfWebpLoaded = fsExtra.readJsonSync(gltfWebpPath);
        return readResources(gltfLoaded)
            .then(function() {
                gltf = gltfLoaded;
            })
            .then(function() {
                const options = {
                    resourceDirectory: path.dirname(gltfWebpPath)
                };
                return readResources(gltfWebpLoaded, options);
            })
            .then(function() {
                gltfWebp = gltfWebpLoaded;
                done();
            });
    });

    it('writes embedded resources', function() {
        writeResources(gltf);
        ForEach.image(gltf, function(image) {
            expect(image.bufferView).toBeDefined();
            expect(image.uri).toBeUndefined();
        });
        expect(gltf.buffers.length).toBe(1);
        const buffer = gltf.buffers[0];
        const contents = dataUriToBuffer(buffer.uri);
        expect(contents.byteLength).toBe(buffer.byteLength);
    });

    it('writes resources as files', function() {
        const separateResources = {};
        const options = {
            separateBuffers: true,
            separateTextures: true,
            separateShaders: true,
            separateResources: separateResources
        };
        const originalBufferViewsLength = gltf.bufferViews.length;
        const originalByteLength = gltf.buffers[0].byteLength;
        writeResources(gltf, options);
        ForEach.image(gltf, function(image) {
            expect(image.bufferView).toBeUndefined();
            expect(image.uri.indexOf('.png')).toBeGreaterThan(-1);
        });

        ForEach.shader(gltf, function (shader) {
            expect(shader.bufferView).toBeUndefined();
            expect(shader.uri.indexOf('.glsl')).toBeGreaterThan(-1);
        });

        expect(gltf.buffers.length).toBe(1);
        const buffer = gltf.buffers[0];
        expect(buffer.uri.indexOf('.bin')).toBeGreaterThan(-1);
        expect(Object.keys(separateResources).length).toBe(4);
        expect(Buffer.isBuffer(separateResources['buffer.bin']));
        expect(Buffer.isBuffer(separateResources['image0.png']));
        expect(gltf.bufferViews.length).toBeLessThan(originalBufferViewsLength);
        expect(buffer.byteLength).toBeLessThanOrEqual(originalByteLength);
    });

    it('writes resources as files with object names', function() {
        const separateResources = {};
        const options = {
            separateBuffers: true,
            separateTextures: true,
            separateShaders: true,
            separateResources: separateResources
        };
        gltf.buffers[0].name = 'my-buffer';
        gltf.images[0].name = 'my-image';
        gltf.extensions.KHR_techniques_webgl.shaders[0].name = 'my-shader';
        writeResources(gltf, options);
        expect(gltf.buffers[0].uri).toBe('my-buffer.bin');
        expect(gltf.images[0].uri).toBe('my-image.png');
        expect(gltf.extensions.KHR_techniques_webgl.shaders[0].uri).toBe('my-shader.glsl');
    });

    it('writes resources as files with gltf name when resources aren\'t named', function() {
        const separateResources = {};
        const options = {
            name: 'my-gltf',
            separateBuffers: true,
            separateTextures: true,
            separateShaders: true,
            separateResources: separateResources
        };

        delete gltf.buffers[0].name;
        delete gltf.images[0].name;
        delete gltf.extensions.KHR_techniques_webgl.programs[0].name;
        delete gltf.extensions.KHR_techniques_webgl.shaders[0].name;

        writeResources(gltf, options);
        expect(gltf.buffers[0].uri).toBe('my-gltf.bin');
        expect(gltf.images[0].uri).toBe('my-gltf0.png');
        expect(gltf.extensions.KHR_techniques_webgl.shaders[0].uri).toBe('my-gltfFS0.glsl');
    });

    it('writes resources as data uris', function() {
        const options = {
            dataUris: true
        };
        const originalBufferViewsLength = gltf.bufferViews.length;
        const originalByteLength = gltf.buffers[0].byteLength;
        writeResources(gltf, options);
        const buffer = gltf.buffers[0];
        expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));

        ForEach.image(gltf, function (image) {
            expect(image.bufferView).toBeUndefined();
            expect(Buffer.isBuffer(dataUriToBuffer(image.uri)));
        });

        ForEach.shader(gltf, function (shader) {
            expect(shader.bufferView).toBeUndefined();
            expect(Buffer.isBuffer(dataUriToBuffer(shader.uri)));
        });

        expect(gltf.bufferViews.length).toBeLessThan(originalBufferViewsLength);
        expect(buffer.byteLength).toBeLessThanOrEqual(originalByteLength);
    });

    it('writes resources as bufferViews', function() {
        const originalBufferViewsLength = gltf.bufferViews.length;
        const originalByteLength = gltf.buffers[0].byteLength;
        writeResources(gltf);
        const buffer = gltf.buffers[0];
        expect(Buffer.isBuffer(dataUriToBuffer(buffer.uri)));

        let bufferViewByteLength = 0;
        let bufferView;
        let sourceByteLength;
        ForEach.image(gltf, function (image) {
            expect(image.bufferView).toBeDefined();
            bufferView = gltf.bufferViews[image.bufferView];
            expect(bufferView).toBeDefined();
            sourceByteLength = image.extras._pipeline.source.byteLength;
            expect(sourceByteLength).toEqual(bufferView.byteLength);

            bufferViewByteLength += bufferView.byteLength;
        });

        ForEach.shader(gltf, function (shader) {
            expect(shader.bufferView).toBeDefined();
            bufferView = gltf.bufferViews[shader.bufferView];
            expect(bufferView).toBeDefined();
            sourceByteLength = Buffer.byteLength(shader.extras._pipeline.source);
            expect(sourceByteLength).toEqual(bufferView.byteLength);

            bufferViewByteLength += bufferView.byteLength;
        });

        expect(gltf.bufferViews.length).toBe(originalBufferViewsLength);
        expect(CesiumMath.equalsEpsilon(buffer.byteLength, originalByteLength + bufferViewByteLength, 8)).toBe(true);
    });

    it('preserves bufferViews for WebP and fallback image', function() {
        const originalBufferViewsLength = gltfWebp.bufferViews.length;
        writeResources(gltfWebp);
        // There should be a new bufferView for the WebP, and one for the fallback image.
        expect(gltfWebp.bufferViews.length).toBe(originalBufferViewsLength + 2);
    });
});

'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var parseBinaryGltf = require('../../lib/parseBinaryGltf');
var removePipelineExtras = require('../../lib/removePipelineExtras');
var binaryGltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var overlapGltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestOverlap.glb';
var gltfScenePath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestBinary.txt';
var bufferPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxBuffer_Binary.bin';
var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS_Binary.glsl';
var imagePath = './specs/data/boxTexturedUnoptimized/Cesium_Logo_Flat_Binary.png';

describe('parseBinaryGltf', function() {
    var testData = {
        binary: binaryGltfPath,
        gltf: gltfScenePath,
        buffer: bufferPath,
        shader: fragmentShaderPath,
        image: imagePath,
        overlap: overlapGltfPath
    };

    beforeAll(function (done) {
        var names = Object.keys(testData);
        var promise = Promise.each(names, function (name) {
            testData[name] = fs.readFileSync(testData[name]);
        });
        expect(promise, done).toResolve();
    });

    it('loads a glTF scene', function() {
        var gltf = parseBinaryGltf(testData.binary);

        expect(gltf).toBeDefined();
        expect(gltf.buffers.bufferView_29_buffer).toBeDefined();
        expect(gltf.buffers.bufferView_30_buffer).toBeDefined();
        expect(gltf.images.Image0001).toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0FS).toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0VS).toBeDefined();

        removePipelineExtras(gltf);
        expect(gltf).toEqual(JSON.parse(testData.gltf));
    });

    it('loads a glTF scene with overlapping buffer views', function() {
        var gltf = parseBinaryGltf(testData.overlap);
        var noOverlapGltf = parseBinaryGltf(testData.binary);

        expect(gltf).toBeDefined();
        expect(gltf.bufferViews.bufferView_29).toBeDefined();
        expect(gltf.bufferViews.bufferView_29_a).toBeDefined();
        expect(gltf.bufferViews.bufferView_30).toBeDefined();
        expect(gltf.bufferViews.bufferView_30_a).toBeDefined();

        expect (gltf.bufferViews.bufferView_29.buffer).toEqual('bufferView_29_buffer');
        expect (gltf.bufferViews.bufferView_29_a.buffer).toEqual('bufferView_29_buffer');
        expect (gltf.bufferViews.bufferView_30.buffer).toEqual('bufferView_30_buffer');
        expect (gltf.bufferViews.bufferView_30.buffer).toEqual('bufferView_30_buffer');

        expect (gltf.bufferViews.bufferView_29.byteOffset).toEqual(0);
        expect (gltf.bufferViews.bufferView_29.byteLength).toEqual(72);
        expect (gltf.bufferViews.bufferView_29_a.byteOffset).toEqual(12);
        expect (gltf.bufferViews.bufferView_29_a.byteLength).toEqual(12);
        expect (gltf.bufferViews.bufferView_30.byteOffset).toEqual(0);
        expect (gltf.bufferViews.bufferView_30.byteLength).toEqual(528);
        expect (gltf.bufferViews.bufferView_30_a.byteOffset).toEqual(468);
        expect (gltf.bufferViews.bufferView_30_a.byteLength).toEqual(300);

        expect(gltf.buffers.bufferView_29_buffer).toBeDefined();
        expect(gltf.buffers.bufferView_30_buffer).toBeDefined();

        expect(gltf.buffers.bufferView_29_buffer.extras._pipeline.source.equals(noOverlapGltf.buffers.bufferView_29_buffer.extras._pipeline.source)).toBe(true);
        expect(gltf.buffers.bufferView_30_buffer.extras._pipeline.source.equals(noOverlapGltf.buffers.bufferView_30_buffer.extras._pipeline.source)).toBe(true);
    });

    it('loads an embedded buffer', function() {
        var gltf = parseBinaryGltf(testData.binary);

        expect(gltf.buffers.bufferView_30_buffer.extras._pipeline.source).toBeDefined();
        expect(gltf.buffers.bufferView_30_buffer.extras._pipeline.source.equals(testData.buffer)).toBe(true);
    });

    it('loads an embedded image', function() {
        var gltf = parseBinaryGltf(testData.binary);

        expect(gltf.images.Image0001.extras._pipeline.source).toBeDefined();
        expect(gltf.images.Image0001.extras._pipeline.source.equals(testData.image)).toBe(true);
    });

    it('loads an embedded shader', function() {
        var gltf = parseBinaryGltf(testData.binary);

        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline.source).toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline.source).toEqual(testData.shader.toString());
    });

    it('throws an error', function() {
        var magicError = Buffer.from(testData.binary);
        magicError.fill(0, 0, 4);
        expect(function() {
            try {
                parseBinaryGltf(magicError);
            }
            catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual('File is not valid binary glTF');
                throw err;
            }
        }).toThrowDeveloperError();
    });

    it('throws a version error', function() {
        var versionError = Buffer.from(testData.binary);
        versionError.fill(0, 4, 8);
        expect(function() {
            try {
                parseBinaryGltf(versionError);
            }
            catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual('Binary glTF version is not 1');
                throw err;
            }
        }).toThrowDeveloperError();
    });

    it('throws a format error', function() {
        var formatError = Buffer.from(testData.binary);
        formatError.fill(1, 16, 20);
        expect(function() {
            try {
                parseBinaryGltf(formatError);
            }
            catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual('Binary glTF scene format is not JSON');
                throw err;
            }
        }).toThrowDeveloperError();
    });
});

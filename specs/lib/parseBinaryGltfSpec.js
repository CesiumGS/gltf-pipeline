'use strict';
var fs = require('fs');
var async = require('async');
var bufferEqual = require('buffer-equal');
var parseBinaryGltf = require('../../lib/parseBinaryGltf');
var binaryGltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var gltfScenePath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestBinary.txt';
var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS_Binary.glsl';
var imagePath = './specs/data/boxTexturedUnoptimized/Cesium_Logo_Flat_Binary.png';

describe('parseBinaryGltf', function() {
    var testData = {
        binary: binaryGltfPath,
        gltf: gltfScenePath,
        shader: fragmentShaderPath,
        image: imagePath
    };

    beforeAll(function(done) {
        var names = Object.keys(testData);
        async.each(names, function(name, callback) {
            fs.readFile(testData[name], function(err, data) {
                if (err) {
                    callback(err);
                }
                else {
                    testData[name] = data;
                    callback();
                }
            });
        }, function(err) {
            if (err) {
                throw err;
            }
            done();
        });
    });

    it('loads a glTF scene', function() {
        var gltf = parseBinaryGltf(testData.binary);

        expect(gltf).toBeDefined();
        expect(gltf.buffers.bufferView_29_buffer).toBeDefined();
        expect(gltf.buffers.bufferView_30_buffer).toBeDefined();
        expect(gltf.images.Image0001).toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0FS).toBeDefined();
        expect(gltf.shaders.CesiumTexturedBoxTest0VS).toBeDefined();

        delete gltf.bufferViews.bufferView_29.extras;
        delete gltf.bufferViews.bufferView_30.extras;
        delete gltf.buffers.bufferView_29_buffer.extras;
        delete gltf.buffers.bufferView_30_buffer.extras;
        delete gltf.images.Image0001.extras;
        delete gltf.shaders.CesiumTexturedBoxTest0FS.extras;
        delete gltf.shaders.CesiumTexturedBoxTest0VS.extras;

        fs.writeFile('./specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestBinary.txt', JSON.stringify(gltf, undefined, 2), function (err) {
            if (err) {
                throw err;
            }
        });    
        // expect(gltf).toEqual(JSON.parse(testData.gltf));
    });

    it('loads an embedded image', function() {
        var gltf = parseBinaryGltf(testData.binary);

        expect(gltf.images.Image0001.extras.source).toBeDefined();
        expect(bufferEqual(gltf.images.Image0001.extras.source, testData.image)).toBe(true);
    });

    it('loads an embedded shader', function() {
        var gltf = parseBinaryGltf(testData.binary);

        expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras.source).toBeDefined();
        expect(bufferEqual(gltf.shaders.CesiumTexturedBoxTest0FS.extras.source, testData.shader)).toBe(true);
    });
});
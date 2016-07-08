'use strict';
var fs = require('fs');
var path = require('path');
var clone = require('clone');
var async = require('async');
var bufferEqual = require('buffer-equal');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');
var readGltf = require('../../lib/readGltf');
var removeUnused = require('../../lib/removeUnused');
var writeBinaryGltf = require('../../lib/writeBinaryGltf');
var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest_BinaryInput.gltf';
var scenePath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest_BinaryCheck.gltf';
var outputPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var bufferPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.bin';
var imagePath = './specs/data/boxTexturedUnoptimized/Cesium_Logo_Flat_Binary.png';
var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS_Binary.glsl';
var vertexShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0VS_Binary.glsl';
var invalidPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';

describe('writeBinaryGltf', function() {
    var testData = {
        gltf : gltfPath,
        scene : scenePath,
        image : imagePath,
        buffer : bufferPath,
        fragmentShader : fragmentShaderPath,
        vertexShader : vertexShaderPath
    };

    beforeAll(function(done) {
        var options = {};
        readGltf(gltfPath, options, function(gltf) {
            testData.gltf = gltf;

            fs.readFile(scenePath, function(err, data) {
                if (err) {
                    throw err;
                }
                testData.scene = JSON.parse(data);

                var names = ['image', 'buffer', 'fragmentShader', 'vertexShader'];
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
        });
    });

    it('writes a valid binary gltf header with embedded resources', function(done) {
        writeBinaryGltf(clone(testData.gltf), {
            outputPath : outputPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        }, function(err, header, scene, body) {
            expect(header.toString('utf8', 0, 4)).toEqual('glTF');
            expect(header.readUInt32LE(4)).toEqual(1);
            expect(header.readUInt32LE(8)).toEqual(17706);
            expect(header.readUInt32LE(12)).toEqual(3896);
            expect(header.readUInt32LE(16)).toEqual(0);
            done();
        });
    });

    it('writes a valid binary gltf header with separate resources', function(done) {
        writeBinaryGltf(clone(testData.gltf), {
            outputPath : outputPath,
            embed : false,
            embedImage : false,
            createDirectory : true
        }, function(err, header, scene, body) {
            expect(header.toString('utf8', 0, 4)).toEqual('glTF');
            expect(header.readUInt32LE(4)).toEqual(1);
            expect(header.readUInt32LE(8)).toEqual(4308);
            expect(header.readUInt32LE(12)).toEqual(3448);
            expect(header.readUInt32LE(16)).toEqual(0);
            done();
        });
    });

    it('writes the correct binary scene', function(done) {
        writeBinaryGltf(clone(testData.gltf), {
            outputPath : outputPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        }, function(err, header, scene, body) {
            expect(JSON.parse(scene.toString())).toEqual(testData.scene);
            done();
        });
    });

    it('writes the correct binary body with embedded resources', function(done) {
        writeBinaryGltf(clone(testData.gltf), {
            outputPath : outputPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        }, function(err, header, scene, body) {
            var binaryBody = Buffer.concat([testData.buffer, testData.fragmentShader, testData.vertexShader, testData.image]);
            expect(bufferEqual(binaryBody, body)).toBe(true);
            done();
        });
    });

    it('writes the correct binary body with separate images', function(done) {
        writeBinaryGltf(clone(testData.gltf), {
            outputPath : outputPath,
            embed : true,
            embedImage : false,
            createDirectory : true
        }, function(err, header, scene, body) {
            var binaryBody = Buffer.concat([testData.buffer, testData.fragmentShader, testData.vertexShader]);
            expect(bufferEqual(binaryBody, body)).toBe(true);
            done();
        });
    });

    it('writes the correct binary body with separate resources except images', function(done) {
        writeBinaryGltf(clone(testData.gltf), {
            outputPath : outputPath,
            embed : false,
            embedImage : true,
            createDirectory : true
        }, function(err, header, scene, body) {
            var binaryBody = Buffer.concat([testData.buffer, testData.image]);
            expect(bufferEqual(binaryBody, body)).toBe(true);
            done();
        });
    });

    it('writes the correct binary body with separate resources', function(done) {
        writeBinaryGltf(clone(testData.gltf), {
            outputPath : outputPath,
            embed : false,
            embedImage : false,
            createDirectory : true
        }, function(err, header, scene, body) {
            var binaryBody = testData.buffer;
            expect(bufferEqual(binaryBody, body)).toBe(true);
            done();
        });
    });
    
    it('throws an invalid output path error', function() {
        expect(function() {
            writeBinaryGltf(clone(testData.gltf), {
                outputPath : undefined
            }, true);
        }).toThrowError('Output path is undefined.');
    });
    
    it('throws an invalid output extension error', function() {
        expect(function() {
            writeBinaryGltf(clone(testData.gltf), {
                outputPath : invalidPath
            }, true);
        }).toThrowError('Invalid output path extension.');
    });
});
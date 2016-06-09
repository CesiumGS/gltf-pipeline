'use strict';

var fs = require('fs');
var clone = require('clone');
var bufferEqual = require('buffer-equal');
var dataUriToBuffer = require('data-uri-to-buffer');
var writeGltf = require('../../lib/writeGltf');
var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS.glsl';
var outputPath = './specs/data/boxTexturedUnoptimized/output.gltf';
var outputFragmentShaderPath = './specs/data/boxTexturedUnoptimized/output/CesiumTexturedBoxTest0FS.glsl';

describe('writeShaders', function() {
    var fragmentShaderData;
    var fragmentShaderUri;
    var testGltf;

    beforeAll(function(done) {
        fs.readFile(fragmentShaderPath, function (err, data) {
            if (err) {
                throw err;
            }
            fragmentShaderData = data;
            testGltf = {
                "shaders": {
                    "CesiumTexturedBoxTest0FS": {
                        "type": 35632,
                        "uri": fragmentShaderUri,
                        "extras": {
                            "_pipeline": {
                                "source": fragmentShaderData,
                                "extension": '.glsl',
                                "deleteExtras": true
                            }
                        }
                    }
                }
            };
            fragmentShaderUri = 'data:text/plain;base64,' + new Buffer(fragmentShaderData).toString('base64');
            done();
        });
    });

    it('writes an external shader', function(done) {
        var gltf = clone(testGltf);

        writeGltf(gltf, outputPath, false, false, true, function() {
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.uri).toEqual('CesiumTexturedBoxTest0FS.glsl');
            fs.readFile(outputFragmentShaderPath, function(err, outputData) {
                if (err) {
                    throw err;
                }
                expect(bufferEqual(outputData, fragmentShaderData)).toBe(true);
                done();
            });
        });
    });

    it('writes an embedded shader', function(done) {
        var gltf = clone(testGltf);
        
        writeGltf(gltf, outputPath, true, true, true, function() {
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras).not.toBeDefined();
            expect(gltf.shaders.CesiumTexturedBoxTest0FS.uri).toEqual(fragmentShaderUri);
            done();
        });
    });

    it('throws an error', function(done) {
        var gltf = clone(testGltf);

        writeGltf(gltf, './specs/errorFilePath/output.gltf', false, false, false, function(err) {
            expect(err).toBeDefined();
            done();
        });
    });
});
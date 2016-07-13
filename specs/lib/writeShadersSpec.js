'use strict';

var fs = require('fs');
var Promise = require('bluebird');
var readFile = Promise.promisify(fs.readFile);
var clone = require('clone');
var bufferEqual = require('buffer-equal');
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
        var options = {
            outputPath : outputPath,
            embed : false,
            embedImage : false,
            createDirectory : true
        };

        writeGltf(gltf, options)
            .then(function() {
                expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras).not.toBeDefined();
                expect(gltf.shaders.CesiumTexturedBoxTest0FS.uri).toEqual('CesiumTexturedBoxTest0FS.glsl');
                readFile(outputFragmentShaderPath).then(function(outputData) {
                    expect(bufferEqual(outputData, fragmentShaderData)).toBe(true);
                    done();
                });
            });
    });

    it('writes an embedded shader', function(done) {
        var gltf = clone(testGltf);
        var options = {
            outputPath : outputPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        };
        
        writeGltf(gltf, options)
            .then(function() {
                expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras).not.toBeDefined();
                expect(gltf.shaders.CesiumTexturedBoxTest0FS.uri).toEqual(fragmentShaderUri);
                done();
            });
    });
});
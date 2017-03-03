'use strict';
var clone = require('clone');
var fs = require('fs');
var Promise = require('bluebird');

var bufferEqual = require('buffer-equal');
var writeGltf = require('../../lib/writeGltf');

var fsReadFile = Promise.promisify(fs.readFile);

var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS.glsl';
var outputPath = './specs/data/boxTexturedUnoptimized/output.gltf';
var outputFragmentShaderPath = './specs/data/boxTexturedUnoptimized/output/CesiumTexturedBoxTest0FS.glsl';

describe('writeShaders', function() {
    var fragmentShaderData;
    var fragmentShaderUri;
    var testGltf;

    beforeAll(function(done) {
        expect(fsReadFile(fragmentShaderPath)
            .then(function(data) {
                fragmentShaderData = data;
                fragmentShaderUri = 'data:text/plain;base64,' + new Buffer(fragmentShaderData).toString('base64');
                testGltf = {
                    shaders: [
                        {
                            type: 35632,
                            uri: fragmentShaderUri,
                            name: 'CesiumTexturedBoxTest0FS',
                            extras: {
                                _pipeline: {
                                    source: fragmentShaderData,
                                    extension: '.glsl'
                                }
                            }
                        }
                    ]
                };
            }), done).toResolve();
    });

    it('writes an external shader', function(done) {
        var gltf = clone(testGltf);
        var options = {
            outputPath : outputPath,
            embed : false,
            embedImage : false,
            createDirectory : true
        };

        expect(writeGltf(gltf, options)
            .then(function() {
                expect(gltf.shaders[0].extras).not.toBeDefined();
                expect(gltf.shaders[0].uri).toEqual('CesiumTexturedBoxTest0FS.glsl');
                return fsReadFile(outputFragmentShaderPath);
            })
            .then(function(outputData) {
                expect(bufferEqual(outputData, fragmentShaderData)).toBe(true);
            }), done).toResolve();
    });

    it('writes an embedded shader', function(done) {
        var gltf = clone(testGltf);
        var options = {
            outputPath : outputPath,
            embed : true,
            embedImage : true,
            createDirectory : true
        };

        expect(writeGltf(gltf, options)
            .then(function() {
                expect(gltf.shaders[0].extras).not.toBeDefined();
                expect(gltf.shaders[0].uri).toEqual(fragmentShaderUri);
            }), done).toResolve();
    });
});

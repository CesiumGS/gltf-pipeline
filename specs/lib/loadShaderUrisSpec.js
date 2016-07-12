'use strict';
var Promise = require('bluebird');
var fs = require('fs');
var bufferEqual = require('buffer-equal');

var fsReadFile = Promise.promisify(fs.readFile);

var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');

var fragmentShaderPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest0FS.glsl';
var basePath = './specs/data/boxTexturedUnoptimized/';

describe('loadShaderUris', function() {
    var fragmentShaderData;
    var fragmentShaderUri;
    var options = {
        basePath: basePath
    };

    beforeAll(function(done) {
        fsReadFile(fragmentShaderPath)
            .then(function(data){
                fragmentShaderData = data;
                fragmentShaderUri = 'data:text/plain;base64,' + new Buffer(fragmentShaderData).toString('base64');
                done();
            })
            .catch(function(err) {
                throw err;
            });
    });

    it('loads an external shader', function(done) {
        var gltf = {
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTest0FS.glsl"
                }
            }
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline.source).toBeDefined();
                expect(bufferEqual(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline.source, fragmentShaderData)).toBe(true);
                expect(gltf.shaders.CesiumTexturedBoxTest0FS.extras._pipeline.extension).toEqual('.glsl');
                done();
            });
    });

    it('loads an embedded shader', function(done) {
        var gltf = {
            "shaders": {
                "box0FS": {
                    "type": 35632,
                    "uri": fragmentShaderUri
                }
            }
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.shaders.box0FS.extras._pipeline.source).toBeDefined();
                expect(bufferEqual(gltf.shaders.box0FS.extras._pipeline.source, fragmentShaderData)).toBe(true);
                expect(gltf.shaders.box0FS.extras._pipeline.extension).toEqual('.glsl');
                done();
            });
    });

    it('loads an external and an embedded shader', function(done) {
        var gltf = {
            "shaders": {
                "embeddedBox0FS": {
                    "type": 35632,
                    "uri": fragmentShaderUri
                },
                "externalBox0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTest0FS.glsl"
                }
            }
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.shaders.externalBox0FS.extras._pipeline.source).toBeDefined();
                expect(bufferEqual(gltf.shaders.embeddedBox0FS.extras._pipeline.source, fragmentShaderData)).toBe(true);
                expect(gltf.shaders.externalBox0FS.extras._pipeline.extension).toEqual('.glsl');
                done();
            });
    });

    it('throws an error', function(done) {
        var gltf = {
            "shaders": {
                "CesiumTexturedBoxTest0FS": {
                    "type": 35632,
                    "uri": "CesiumTexturedBoxTestError.glsl"
                }
            }
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .catch(function(err) {
                expect(err).toBeDefined();
                done();
            });
    });
});

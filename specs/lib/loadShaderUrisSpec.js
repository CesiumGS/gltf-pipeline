'use strict';
var fs = require('fs');
var bufferEqual = require('buffer-equal');
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
        fs.readFile(fragmentShaderPath, function (err, data) {
            if (err) {
                throw err;
            }
            fragmentShaderData = data;
            fragmentShaderUri = 'data:text/plain;base64,' + new Buffer(fragmentShaderData).toString('base64');
            done();
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
        loadGltfUris(gltf, options, function(err, gltf) {
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
        loadGltfUris(gltf, options, function(err, gltf) {
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
        loadGltfUris(gltf, options, function(err, gltf) {
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
        loadGltfUris(gltf, options, function(err, gltf) {
            expect(err).toBeDefined();
            done();
        });
    });
});

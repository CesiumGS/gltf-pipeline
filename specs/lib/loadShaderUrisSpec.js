'use strict';
var fsExtra = require('fs-extra');

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
        fsExtra.readFile(fragmentShaderPath)
            .then(function(data){
                fragmentShaderData = data.toString();
                fragmentShaderUri = 'data:text/plain;base64,' + Buffer.from(fragmentShaderData).toString('base64');
                done();
            })
            .catch(done.fail);
    });

    it('loads an external shader', function(done) {
        var gltf = {
            shaders: [
                {
                    type: 35632,
                    uri: 'CesiumTexturedBoxTest0FS.glsl'
                }
            ]
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.shaders[0].extras._pipeline.source).toBeDefined();
                expect(gltf.shaders[0].extras._pipeline.source).toEqual(fragmentShaderData);
                expect(gltf.shaders[0].extras._pipeline.extension).toEqual('.glsl');
                done();
            });
    });

    it('loads an embedded shader', function(done) {
        var gltf = {
            shaders: [
                {
                    'type': 35632,
                    'uri': fragmentShaderUri
                }
            ]
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.shaders[0].extras._pipeline.source).toBeDefined();
                expect(gltf.shaders[0].extras._pipeline.source).toEqual(fragmentShaderData);
                expect(gltf.shaders[0].extras._pipeline.extension).toEqual('.glsl');
                done();
            });
    });

    it('loads an external and an embedded shader', function(done) {
        var gltf = {
            shaders: [
                {
                    type: 35632,
                    uri: fragmentShaderUri
                },
                {
                    type: 35632,
                    uri: 'CesiumTexturedBoxTest0FS.glsl'
                }
            ]
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.shaders[0].extras._pipeline.source).toBeDefined();
                expect(gltf.shaders[0].extras._pipeline.source).toEqual(fragmentShaderData);
                expect(gltf.shaders[0].extras._pipeline.extension).toEqual('.glsl');
                done();
            });
    });

    it('throws an error', function(done) {
        var gltf = {
            shaders: [
                {
                    type: 35632,
                    uri: 'CesiumTexturedBoxTestError.glsl'
                }
            ]
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .catch(function(err) {
                expect(err).toBeDefined();
                done();
            });
    });
});

'use strict';
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var path = require('path');
var clone = require('clone');

var gltfPipeline = require('../../lib/gltfPipeline');
var readGltf = require('../../lib/readGltf');
var addPipelineExtras = require('../../lib/addPipelineExtras');

var processJSON = gltfPipeline.processJSON;
var processJSONToDisk = gltfPipeline.processJSONToDisk;
var processFile = gltfPipeline.processFile;
var processFileToDisk = gltfPipeline.processFileToDisk;

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var gltfEmbeddedPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTestEmbedded.gltf';
var glbPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.glb';
var outputGltfPath = './output/CesiumTexturedBoxTest.gltf';
var outputGlbPath = './output/CesiumTexturedBoxTest.glb';

describe('gltfPipeline', function() {
    it('optimizes a gltf JSON with embedded resources', function(done) {
        var options = {};
        var gltfCopy;
        readGltf(gltfEmbeddedPath, options)
            .then(function(gltf) {
                gltfCopy = clone(gltf);
                return processJSON(gltf, options);
            })
            .then(function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                done();
            });
    });
    
    it('optimizes a gltf JSON with external resources', function(done) {
        var options = { basePath : path.dirname(gltfPath) };
        var gltfCopy;
        fsExtraReadFile(gltfPath, options)
            .then(function(data) {
                var gltf = JSON.parse(data);
                gltfCopy = clone(gltfCopy);
                addPipelineExtras(gltf);
                return processJSON(gltf, options);
            })
            .then(function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                done();
            });
    });

    it('optimizes a glTF file', function(done) {
        var gltfCopy;
        var options = {};
        readGltf(gltfPath, options)
            .then(function(gltf) {
                gltfCopy = clone(gltf);
                return processFile(gltfPath, options);
            })
            .then(function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                done();
            });
    });

    it('optimizes a glb file', function(done) {
        var gltfCopy;
        var options = {};
        readGltf(glbPath, options)
            .then(function(gltf) {
                gltfCopy = clone(gltf);
                return processFile(glbPath, options);
            })
            .then(function(gltf) {
                expect(gltf).toBeDefined();
                expect(clone(gltf)).not.toEqual(gltfCopy);
                done();
            });
    });

    it('will write a file to the correct directory', function(done) {
        var spy = spyOn(fsExtra, 'outputJson').and.callFake(function() {});
        var options = {
            createDirectory : false
        };
        processFileToDisk(gltfPath, outputGltfPath, options)
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
                done();
            })
            .catch(function(err) {
                done();
                throw err;
            });
    });

    it('will write a binary file', function(done) {
        var spy = spyOn(fsExtra, 'outputFile').and.callFake(function() {});
        var options = {
            binary : true,
            createDirectory : false
        };
        processFileToDisk(gltfPath, outputGlbPath, options)
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGlbPath));
                done();
            })
            .catch(function(err) {
                done();
                throw err;
            });

    });

    it('will write a file from JSON', function(done) {
        var spy = spyOn(fsExtra, 'outputJson').and.callFake(function() {
            return;
        });
        var readOptions = {};
        var processOptions = {
            createDirectory : false, 
            basePath : path.dirname(gltfPath)
        };
        readGltf(gltfPath, readOptions)
            .then(function(gltf) {
                return processJSONToDisk(gltf, outputGltfPath, processOptions);
            })
            .then(function() {
                expect(path.normalize(spy.calls.first().args[0])).toEqual(path.normalize(outputGltfPath));
                done();
            })
            .catch(function(err) {
                done();
                throw err;
            });
    });

    it('will write sources from JSON', function(done) {
        var initialUri;
        var options = {};
        readGltf(gltfEmbeddedPath, options)
            .then(function(gltf) {
                initialUri = gltf.buffers.CesiumTexturedBoxTest.uri;
                return processJSON(gltf, options);
            })
            .then(function(gltf) {
                var finalUri = gltf.buffers.CesiumTexturedBoxTest.uri;
                expect(initialUri).not.toEqual(finalUri);
                done();
            });
    });

    it('will write sources from file', function(done) {
        var initialUri;
        var options = {};
        readGltf(gltfEmbeddedPath, options)
            .then(function(gltf) {
                initialUri = gltf.buffers.CesiumTexturedBoxTest.uri;
                return processFile(gltfEmbeddedPath, options);
            })
            .then(function(gltfFinal) {
                var finalUri = gltfFinal.buffers.CesiumTexturedBoxTest.uri;
                expect(initialUri).not.toEqual(finalUri);
                done();
            });
    });
});
